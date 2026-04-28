import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiAlertTriangle, FiShield, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import roleService from '../services/roleService';
import { getPermissionModules } from '../config/moduleRegistry';
import usePermission from '../hooks/usePermission';
import PermissionMatrix from '../components/PermissionMatrix';

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  manager: 'Quản lý nhân sự',
  sales: 'Nhân viên kinh doanh',
  warehouse: 'Thủ kho',
  staff_portal: 'Nhân viên cổng cá nhân',
  staff: 'Nhân viên bán hàng (legacy)',
};

const getRoleDisplayName = (roleName) => ROLE_LABELS[String(roleName || '').trim().toLowerCase()] || roleName;

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
  const normalizedEditingRole = String(editing?.role_name || form.role_name || '').trim().toLowerCase();
  const lockSystemModules = normalizedEditingRole !== 'admin';

  useEffect(() => {
    if (!lockSystemModules || !allPermissions.length) return;

    const systemModuleKeys = new Set(
      getPermissionModules()
        .filter(moduleItem => moduleItem.systemOnly)
        .map(moduleItem => moduleItem.key)
    );
    const blockedPermissionIds = new Set(
      allPermissions
        .filter(permission => systemModuleKeys.has(permission.module))
        .map(permission => permission.permission_id)
    );

    setSelectedPermIds((current) => {
      const next = current.filter(id => !blockedPermissionIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [lockSystemModules, allPermissions]);

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
        localStorage.setItem('rbac_permissions_version', String(Date.now()));
        toast.success('Cập nhật nhóm quyền thành công');
      } else {
        await roleService.create(payload);
        localStorage.setItem('rbac_permissions_version', String(Date.now()));
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
      localStorage.setItem('rbac_permissions_version', String(Date.now()));
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
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            Lưu ý: quyền động của nhân viên hiện tách thành <strong>`sales`</strong> cho khu kinh doanh và <strong>`staff_portal`</strong> cho cổng cá nhân. Sau khi lưu quyền, người dùng chỉ cần tải lại trang hoặc chuyển lại tab để sidebar tự đồng bộ.
          </p>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <strong>{getRoleDisplayName(role.role_name)}</strong>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{role.role_name}</span>
                        </div>
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
              <h3><FiShield style={{ color: 'var(--primary)', flexShrink: 0 }} /> {editing ? 'Sửa nhóm quyền' : 'Thêm nhóm quyền'}</h3>
              <button className="modal-close" onClick={() => !saving && setShowModal(false)} aria-label="Đóng" disabled={saving}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <p className="form-section-label">Thông tin cơ bản</p>
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
                    {editing?.is_system ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                        Tên kỹ thuật của role hệ thống được giữ cố định để tránh lệch RBAC và workspace.
                      </div>
                    ) : null}
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
                <div className="form-group" style={{ marginTop: 8 }}>
                  <p className="form-section-label" style={{ marginBottom: 8 }}>Phân quyền theo module</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Chọn các quyền truy cập cho nhóm này. Tick “Xem” để hiện module trên menu.
                  </p>
                  {lockSystemModules ? (
                    <div className="role-lock-msg">
                      <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                      <span>Các module hệ thống (<strong>Tài khoản</strong>, <strong>Nhóm quyền</strong>, <strong>Cấu hình</strong>) được khóa riêng cho admin để tránh lộ quyền sai khi cấp động cho role khác.</span>
                    </div>
                  ) : null}
                  <PermissionMatrix
                    allPermissions={allPermissions}
                    selectedIds={selectedPermIds}
                    onChange={setSelectedPermIds}
                    lockSystemModules={lockSystemModules}
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
