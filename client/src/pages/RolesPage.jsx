import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiAlertTriangle, FiShield, FiCheck, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import roleService from '../services/roleService';
import { getPermissionModules, ACTION_LABELS } from '../config/moduleRegistry';
import usePermission from '../hooks/usePermission';

// ─── ACTION COLUMNS for the matrix ───
const MATRIX_ACTIONS = ['read', 'create', 'update', 'delete'];

// ─── Confirm Dialog ───
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-dialog-icon"><FiAlertTriangle /></div>
        <h3 className="confirm-dialog-title">{title || 'Xác nhận'}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="btn btn-outline" onClick={onCancel}>Hủy</button>
          <button className="btn btn-danger" onClick={onConfirm}>Xóa</button>
        </div>
      </div>
    </div>
  );
}

// ─── Permission Matrix Component ───
function PermissionMatrix({ allPermissions, selectedIds, onChange }) {
  const modules = getPermissionModules();

  // Build a lookup: module_key + action → permission_id
  const permLookup = {};
  for (const p of allPermissions) {
    const key = `${p.module}.${p.action}`;
    permLookup[key] = p.permission_id;
  }

  const selectedSet = new Set(selectedIds);

  const isChecked = (moduleKey, action) => {
    const pid = permLookup[`${moduleKey}.${action}`];
    return pid ? selectedSet.has(pid) : false;
  };

  const toggle = (moduleKey, action) => {
    const pid = permLookup[`${moduleKey}.${action}`];
    if (!pid) return;

    const newSet = new Set(selectedSet);

    if (newSet.has(pid)) {
      // Unchecking
      newSet.delete(pid);

      // If unchecking "read", also uncheck create/update/delete/export
      if (action === 'read') {
        for (const a of ['create', 'update', 'delete', 'export']) {
          const relPid = permLookup[`${moduleKey}.${a}`];
          if (relPid) newSet.delete(relPid);
        }
      }
    } else {
      // Checking
      newSet.add(pid);

      // If checking create/update/delete/export, auto-check "read"
      if (action !== 'read') {
        const readPid = permLookup[`${moduleKey}.read`];
        if (readPid) newSet.add(readPid);
      }
    }

    onChange([...newSet]);
  };

  // Check-all for a column
  const toggleColumn = (action) => {
    const newSet = new Set(selectedSet);
    const allChecked = modules.every(mod => {
      if (!mod.actions.includes(action)) return true;
      const pid = permLookup[`${mod.key}.${action}`];
      return pid ? newSet.has(pid) : true;
    });

    for (const mod of modules) {
      if (!mod.actions.includes(action)) continue;
      const pid = permLookup[`${mod.key}.${action}`];
      if (!pid) continue;

      if (allChecked) {
        // Uncheck all in this column
        newSet.delete(pid);
        // If unchecking "read", also uncheck CUD
        if (action === 'read') {
          for (const a of ['create', 'update', 'delete', 'export']) {
            const relPid = permLookup[`${mod.key}.${a}`];
            if (relPid) newSet.delete(relPid);
          }
        }
      } else {
        // Check all in this column
        newSet.add(pid);
        // If checking CUD, auto-check read
        if (action !== 'read') {
          const readPid = permLookup[`${mod.key}.read`];
          if (readPid) newSet.add(readPid);
        }
      }
    }

    onChange([...newSet]);
  };

  // Check-all for a row
  const toggleRow = (moduleKey) => {
    const newSet = new Set(selectedSet);
    const mod = modules.find(m => m.key === moduleKey);
    if (!mod) return;

    const allChecked = mod.actions.every(action => {
      const pid = permLookup[`${moduleKey}.${action}`];
      return pid ? newSet.has(pid) : true;
    });

    for (const action of mod.actions) {
      const pid = permLookup[`${moduleKey}.${action}`];
      if (!pid) continue;
      if (allChecked) newSet.delete(pid);
      else newSet.add(pid);
    }

    onChange([...newSet]);
  };

  // Group modules by section
  const sectionMap = new Map();
  for (const mod of modules) {
    if (!sectionMap.has(mod.section)) sectionMap.set(mod.section, []);
    sectionMap.get(mod.section).push(mod);
  }

  const isColumnAllChecked = (action) => {
    return modules.every(mod => {
      if (!mod.actions.includes(action)) return true;
      const pid = permLookup[`${mod.key}.${action}`];
      return pid ? selectedSet.has(pid) : true;
    });
  };

  const isRowAllChecked = (moduleKey) => {
    const mod = modules.find(m => m.key === moduleKey);
    if (!mod) return false;
    return mod.actions.every(action => {
      const pid = permLookup[`${moduleKey}.${action}`];
      return pid ? selectedSet.has(pid) : true;
    });
  };

  return (
    <div className="perm-matrix-wrapper">
      <table className="perm-matrix">
        <thead>
          <tr>
            <th className="perm-matrix-module-header">Chức năng</th>
            {MATRIX_ACTIONS.map(action => (
              <th key={action} className="perm-matrix-action-header">
                <label className="perm-matrix-col-toggle">
                  <input
                    type="checkbox"
                    checked={isColumnAllChecked(action)}
                    onChange={() => toggleColumn(action)}
                  />
                  <span>{ACTION_LABELS[action] || action}</span>
                </label>
              </th>
            ))}
            <th className="perm-matrix-action-header">
              <span>Tất cả</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {[...sectionMap.entries()].map(([section, mods]) => (
            <>{/* Section label row */}
              <tr key={`section-${section}`} className="perm-matrix-section-row">
                <td colSpan={MATRIX_ACTIONS.length + 2} className="perm-matrix-section-label">
                  {section}
                </td>
              </tr>
              {mods.map(mod => (
                <tr key={mod.key} className="perm-matrix-row">
                  <td className="perm-matrix-module-name">
                    <mod.icon className="perm-matrix-module-icon" />
                    {mod.name}
                  </td>
                  {MATRIX_ACTIONS.map(action => (
                    <td key={action} className="perm-matrix-cell">
                      {mod.actions.includes(action) ? (
                        <label className="perm-checkbox-label">
                          <input
                            type="checkbox"
                            className="perm-checkbox"
                            checked={isChecked(mod.key, action)}
                            onChange={() => toggle(mod.key, action)}
                          />
                          <span className="perm-checkbox-custom">
                            <FiCheck className="perm-checkbox-icon" />
                          </span>
                        </label>
                      ) : (
                        <span className="perm-matrix-na">—</span>
                      )}
                    </td>
                  ))}
                  <td className="perm-matrix-cell">
                    <label className="perm-checkbox-label">
                      <input
                        type="checkbox"
                        className="perm-checkbox"
                        checked={isRowAllChecked(mod.key)}
                        onChange={() => toggleRow(mod.key)}
                      />
                      <span className="perm-checkbox-custom perm-checkbox-all">
                        <FiCheck className="perm-checkbox-icon" />
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main RolesPage Component ───
export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role_name: '', description: '' });
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { canCreate, canUpdate, canDelete } = usePermission();
  const _canCreate = canCreate('roles');
  const _canUpdate = canUpdate('roles');
  const _canDelete = canDelete('roles');

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData, permData] = await Promise.all([
        roleService.getAll(),
        roleService.getAllPermissions(),
      ]);
      setRoles(rolesData);
      setAllPermissions(permData.permissions || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered roles
  const filteredRoles = roles.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.role_name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
  });

  // Open create modal
  const openCreate = () => {
    setEditing(null);
    setForm({ role_name: '', description: '' });
    setSelectedPermIds([]);
    setShowModal(true);
  };

  // Open edit modal
  const openEdit = async (role) => {
    try {
      const full = await roleService.getById(role.role_id);
      setEditing(full);
      setForm({ role_name: full.role_name, description: full.description || '' });
      setSelectedPermIds(full.permissions.map(p => p.permission_id));
      setShowModal(true);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải nhóm quyền');
    }
  };

  // Save (create or update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.role_name.trim()) {
      toast.error('Tên nhóm quyền là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        role_name: form.role_name.trim(),
        description: form.description.trim(),
        permission_ids: selectedPermIds,
      };
      if (editing) {
        await roleService.update(editing.role_id, payload);
        toast.success('Cập nhật nhóm quyền thành công');
      } else {
        await roleService.create(payload);
        toast.success('Tạo nhóm quyền thành công');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu nhóm quyền');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await roleService.delete(deleteTarget.role_id);
      toast.success('Xóa nhóm quyền thành công');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa nhóm quyền');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nhóm quyền</h1>
          <p>Quản lý phân quyền theo vai trò</p>
        </div>
        {_canCreate && (
          <button className="btn btn-primary" onClick={openCreate} id="btn-create-role">
            <FiPlus /> Thêm nhóm quyền
          </button>
        )}
      </div>

      {/* Search */}
      <div className="crud-search-bar">
        <FiSearch className="crud-search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm nhóm quyền..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="crud-search-input"
          id="search-roles"
        />
        {search && (
          <button className="crud-search-clear" onClick={() => setSearch('')}>
            <FiX />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên nhóm</th>
                  <th>Mô tả</th>
                  <th>Số người dùng</th>
                  <th>Loại</th>
                  {(_canUpdate || _canDelete) && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map(role => (
                  <tr key={role.role_id}>
                    <td><span className="badge badge-secondary">{role.role_id}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiShield style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <strong>{role.role_name}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{role.description || '—'}</td>
                    <td>
                      <span className="badge badge-info" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <FiUsers size={12} /> {role.user_count || 0}
                      </span>
                    </td>
                    <td>
                      {role.is_system ? (
                        <span className="badge badge-warning">Hệ thống</span>
                      ) : (
                        <span className="badge badge-secondary">Tùy chỉnh</span>
                      )}
                    </td>
                    {(_canUpdate || _canDelete) && (
                      <td>
                        {_canUpdate && (
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(role)} aria-label="Sửa" id={`edit-role-${role.role_id}`}>
                            <FiEdit2 />
                          </button>
                        )}{' '}
                        {(_canDelete && !role.is_system) && (
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(role)} aria-label="Xóa" id={`delete-role-${role.role_id}`}>
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      {search ? 'Không tìm thấy nhóm quyền phù hợp' : 'Chưa có nhóm quyền'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)} role="dialog" aria-modal="true" aria-label={editing ? 'Sửa nhóm quyền' : 'Thêm nhóm quyền'}>
          <div className="modal perm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Sửa nhóm quyền' : 'Thêm nhóm quyền'}</h3>
              <button className="modal-close" onClick={() => !saving && setShowModal(false)} aria-label="Đóng" disabled={saving}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role-name">Tên nhóm quyền *</label>
                    <input
                      id="role-name"
                      className="form-control"
                      type="text"
                      required
                      placeholder="VD: Nhân viên bán hàng"
                      value={form.role_name}
                      onChange={e => setForm({ ...form, role_name: e.target.value })}
                      disabled={editing?.is_system}
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role-desc">Mô tả</label>
                    <input
                      id="role-desc"
                      className="form-control"
                      type="text"
                      placeholder="Mô tả ngắn gọn"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Permission Matrix */}
                <div className="form-group">
                  <label>Phân quyền theo module</label>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Chọn các quyền truy cập cho nhóm này. Tick "Xem" để hiện module trên menu.
                  </p>
                  <PermissionMatrix
                    allPermissions={allPermissions}
                    selectedIds={selectedPermIds}
                    onChange={setSelectedPermIds}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Thêm mới')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xác nhận xóa"
        message={deleteTarget ? `Bạn có chắc chắn muốn xóa nhóm quyền "${deleteTarget.role_name}"? Hành động này không thể hoàn tác.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
