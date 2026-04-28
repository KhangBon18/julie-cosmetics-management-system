import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiLock, FiPlus, FiShield, FiToggleLeft, FiToggleRight, FiTrash2 } from 'react-icons/fi';
import { employeeService, userService } from '../services/dataService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';
import useAuth from '../hooks/useAuth';
import roleService from '../services/roleService';
import PermissionMatrix from '../components/PermissionMatrix';

const roleBadge = { admin: 'badge-danger', manager: 'badge-purple', sales: 'badge-primary', staff: 'badge-info', staff_portal: 'badge-info', warehouse: 'badge-warning' };

const emptyResetModal = { open: false, userId: null, newPassword: '' };
const emptyPermissionModal = {
  open: false,
  user: null,
  selectedIds: [],
  inheritedIds: [],
  grantedIds: [],
  deniedIds: [],
  loading: false,
  saving: false
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetModal, setResetModal] = useState(emptyResetModal);
  const [permissionModal, setPermissionModal] = useState(emptyPermissionModal);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);

  const { user: currentUser, refreshUser } = useAuth();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const _canCreate = canCreate('users');
  const _canUpdate = canUpdate('users');
  const _canDelete = canDelete('users');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [userData, roleData, employeeData] = await Promise.all([
        userService.getAll({ limit: 100 }),
        roleService.getAll().catch(() => []),
        employeeService.getAll({ limit: 200, status: 'active' }).catch(() => ({ employees: [] }))
      ]);
      setUsers(userData.users || []);
      setRoles(roleData || []);
      setEmployees(employeeData.employees || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const loadAllPermissions = async () => {
    if (allPermissions.length) return allPermissions;
    const permissionData = await roleService.getAllPermissions();
    const permissions = permissionData.permissions || [];
    setAllPermissions(permissions);
    return permissions;
  };

  const employeeOptions = useMemo(
    () => employees.map(employee => ({
      value: employee.employee_id,
      label: `${employee.full_name} • ${employee.position_name || 'Chưa có chức vụ'}`
    })),
    [employees]
  );

  const getDefaultRole = () => {
    if (!roles.length) return { role_id: '', role: 'staff' };
    const preferred = roles.find(r => r.role_name === 'staff') || roles[0];
    return { role_id: preferred.role_id, role: preferred.role_name };
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      username: '',
      password: '',
      employee_id: '',
      is_active: true,
      ...getDefaultRole()
    });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: '',
      role_id: user.role_id || '',
      role: user.role_name || user.role,
      employee_id: user.employee_id || '',
      is_active: Boolean(user.is_active)
    });
    setShowModal(true);
  };

  const handleRoleChange = (roleIdValue) => {
    const selectedRole = roles.find(role => String(role.role_id) === String(roleIdValue));
    setForm(prev => ({
      ...prev,
      role_id: roleIdValue,
      role: selectedRole?.role_name || prev.role
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        username: form.username,
        role_id: form.role_id ? parseInt(form.role_id, 10) : undefined,
        role: form.role,
        employee_id: form.employee_id ? parseInt(form.employee_id, 10) : null,
        is_active: Boolean(form.is_active)
      };

      if (editing) {
        await userService.update(editing.user_id, payload);
        toast.success('Cập nhật tài khoản thành công');
        if (currentUser?.user_id === editing.user_id) {
          await refreshUser();
        }
      } else {
        await userService.create({ ...payload, password: form.password });
        toast.success('Tạo tài khoản thành công');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleActive = async (targetUser) => {
    try {
      await userService.toggleActive(targetUser.user_id, { is_active: !targetUser.is_active });
      toast.success(targetUser.is_active ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      if (currentUser?.user_id === targetUser.user_id) {
        await refreshUser();
      }
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleResetPw = async (event) => {
    event.preventDefault();
    if (!resetModal.newPassword) return;

    try {
      await userService.resetPassword(resetModal.userId, { new_password: resetModal.newPassword });
      toast.success('Đã reset mật khẩu');
      setResetModal(emptyResetModal);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openPermissions = async (targetUser) => {
    setPermissionModal({
      ...emptyPermissionModal,
      open: true,
      user: targetUser,
      loading: true
    });

    try {
      const [permissions, userPermissions] = await Promise.all([
        loadAllPermissions(),
        userService.getPermissions(targetUser.user_id)
      ]);

      setAllPermissions(permissions);
      setPermissionModal({
        open: true,
        user: targetUser,
        selectedIds: userPermissions.effective_permission_ids || [],
        inheritedIds: userPermissions.inherited_permission_ids || [],
        grantedIds: userPermissions.granted_permission_ids || [],
        deniedIds: userPermissions.denied_permission_ids || [],
        loading: false,
        saving: false
      });
    } catch (error) {
      toast.error(error.message || 'Lỗi khi tải quyền tài khoản');
      setPermissionModal(emptyPermissionModal);
    }
  };

  const savePermissions = async () => {
    if (!permissionModal.user) return;

    setPermissionModal(current => ({ ...current, saving: true }));
    try {
      await userService.updatePermissions(permissionModal.user.user_id, {
        permission_ids: permissionModal.selectedIds
      });
      localStorage.setItem('rbac_permissions_version', String(Date.now()));
      toast.success('Cập nhật quyền riêng của tài khoản thành công');

      if (currentUser?.user_id === permissionModal.user.user_id) {
        await refreshUser();
      }

      setPermissionModal(emptyPermissionModal);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Lỗi khi lưu quyền tài khoản');
      setPermissionModal(current => ({ ...current, saving: false }));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await userService.delete(deleteTarget.user_id);
      toast.success('Đã xóa tài khoản');
      if (currentUser?.user_id === deleteTarget.user_id) {
        await refreshUser();
      }
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Tài khoản hệ thống</h1><p>{users.length} tài khoản</p></div>
        {_canCreate ? <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Tạo tài khoản</button> : null}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Nhân viên liên kết</th>
                <th>Nhóm quyền</th>
                <th>Trạng thái</th>
                <th>Lần đăng nhập cuối</th>
                {(_canUpdate || _canDelete) ? <th>Thao tác</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id}>
                  <td style={{ fontWeight: 600 }}>{user.username}</td>
                  <td>
                    <div>{user.full_name || '— Tài khoản hệ thống —'}</div>
                    {user.email ? <div style={{ color: '#64748b', fontSize: 12 }}>{user.email}</div> : null}
                  </td>
                  <td><span className={`badge ${roleBadge[user.role_name || user.role] || 'badge-info'}`}>{user.role_name || user.role}</span></td>
                  <td><span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>{user.is_active ? 'Active' : 'Locked'}</span></td>
                  <td>{user.last_login ? new Date(user.last_login).toLocaleString('vi-VN') : '—'}</td>
                  {(_canUpdate || _canDelete) ? (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {_canUpdate ? <button type="button" className="btn btn-sm btn-outline" title="Sửa tài khoản" onClick={() => openEdit(user)}><FiEdit2 /></button> : null}
                        {_canUpdate ? <button type="button" className="btn btn-sm btn-outline" title="Phân quyền riêng" onClick={() => openPermissions(user)}><FiShield /></button> : null}
                        {_canUpdate ? <button type="button" className="btn btn-sm btn-outline" title="Reset mật khẩu" onClick={() => setResetModal({ open: true, userId: user.user_id, newPassword: '' })}><FiLock /></button> : null}
                        {_canUpdate ? <button type="button" className="btn btn-sm btn-outline" title={user.is_active ? 'Khóa' : 'Mở khóa'} onClick={() => toggleActive(user)}>{user.is_active ? <FiToggleRight /> : <FiToggleLeft />}</button> : null}
                        {_canDelete ? <button type="button" className="btn btn-sm btn-danger" title="Xóa tài khoản" onClick={() => setDeleteTarget(user)}><FiTrash2 /></button> : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!users.length ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có tài khoản nào</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {showModal ? (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>Username *</label>
                  <input className="form-control" required value={form.username || ''} onChange={event => setForm({ ...form, username: event.target.value })} />
                </div>
                {!editing ? (
                  <div className="form-group">
                    <label>Mật khẩu *</label>
                    <input className="form-control" type="password" required value={form.password || ''} onChange={event => setForm({ ...form, password: event.target.value })} />
                  </div>
                ) : null}
                <div className="form-row">
                  <div className="form-group">
                    <label>Nhóm quyền *</label>
                    <select className="form-control" required value={form.role_id || ''} onChange={event => handleRoleChange(event.target.value)}>
                      <option value="">Chọn nhóm quyền</option>
                      {roles.map(role => (
                        <option key={role.role_id} value={role.role_id}>
                          {role.role_name}{role.is_system ? ' (hệ thống)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nhân viên liên kết</label>
                    <select className="form-control" value={form.employee_id || ''} onChange={event => setForm({ ...form, employee_id: event.target.value })}>
                      <option value="">Không liên kết</option>
                      {employeeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {editing ? (
                  <div className="form-group">
                    <label>Trạng thái tài khoản</label>
                    <select className="form-control" value={form.is_active ? '1' : '0'} onChange={event => setForm({ ...form, is_active: event.target.value === '1' })}>
                      <option value="1">Hoạt động</option>
                      <option value="0">Khóa</option>
                    </select>
                  </div>
                ) : null}
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                  Một nhân viên chỉ được liên kết với một tài khoản đang hoạt động trong hệ thống.
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Tạo tài khoản'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {resetModal.open ? (
        <div className="modal-overlay" onClick={() => setResetModal(emptyResetModal)}>
          <div className="modal" onClick={event => event.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3>Đổi mật khẩu</h3><button className="modal-close" onClick={() => setResetModal(emptyResetModal)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleResetPw}>
                <div className="form-group">
                  <label>Mật khẩu mới *</label>
                  <input className="form-control" type="password" required value={resetModal.newPassword} onChange={event => setResetModal({ ...resetModal, newPassword: event.target.value })} autoFocus />
                </div>
                <div className="form-actions" style={{ marginTop: 24 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setResetModal(emptyResetModal)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Xác nhận</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {permissionModal.open ? (
        <div className="modal-overlay" onClick={() => !permissionModal.saving && setPermissionModal(emptyPermissionModal)}>
          <div className="modal perm-modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h3><FiShield style={{ color: 'var(--primary)', flexShrink: 0 }} /> Phân quyền tài khoản</h3>
              <button className="modal-close" onClick={() => !permissionModal.saving && setPermissionModal(emptyPermissionModal)} disabled={permissionModal.saving}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <p className="form-section-label" style={{ marginBottom: 6 }}>
                  {permissionModal.user?.username} · {permissionModal.user?.role_name || permissionModal.user?.role}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Ma trận này là quyền hiệu lực cuối cùng của tài khoản. Quyền nhóm được chọn sẵn; tick thêm để cấp riêng, bỏ tick để chặn riêng cho tài khoản này.
                </p>
              </div>

              {permissionModal.loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải quyền...</div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <span className="badge badge-info">Nhóm: {permissionModal.inheritedIds.length}</span>
                    <span className="badge badge-success">Cấp riêng: {permissionModal.grantedIds.length}</span>
                    <span className="badge badge-warning">Chặn riêng: {permissionModal.deniedIds.length}</span>
                  </div>
                  <PermissionMatrix
                    allPermissions={allPermissions}
                    selectedIds={permissionModal.selectedIds}
                    onChange={(nextIds) => setPermissionModal(current => ({ ...current, selectedIds: nextIds }))}
                  />
                </>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setPermissionModal(emptyPermissionModal)} disabled={permissionModal.saving}>Hủy</button>
                <button type="button" className="btn btn-primary" onClick={savePermissions} disabled={permissionModal.loading || permissionModal.saving}>
                  {permissionModal.saving ? 'Đang lưu...' : 'Lưu phân quyền'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-dialog" onClick={event => event.stopPropagation()}>
            <div className="confirm-dialog-title" style={{ marginBottom: 12 }}>Xóa tài khoản</div>
            <p className="confirm-dialog-message">Bạn có chắc muốn xóa tài khoản <strong>{deleteTarget.username}</strong>? Tài khoản sẽ bị soft-delete để giữ audit trail.</p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleDelete}>Xóa tài khoản</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
