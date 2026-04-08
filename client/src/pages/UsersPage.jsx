import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiLock, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { userService } from '../services/dataService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

const roleBadge = { admin:'badge-danger', manager:'badge-purple', staff:'badge-info', warehouse:'badge-warning' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, userId: null, newPassword: '' });
  const [form, setForm] = useState({});

  const { canCreate, canUpdate } = usePermission();
  const _canCreate = canCreate('users');
  const _canUpdate = canUpdate('users');

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const d = await userService.getAll({ limit: 50 }); setUsers(d.users||[]); } catch(e){toast.error(e.message);} };

  const openCreate = () => { setForm({ username:'', password:'', role:'staff', employee_id:'' }); setShowModal(true); };
  const handleSave = async (e) => { e.preventDefault(); try { await userService.create(form); toast.success('Tạo tài khoản thành công'); setShowModal(false); loadData(); } catch(e){toast.error(e.message);} };
  const toggleActive = async (u) => { try { await userService.toggleActive(u.user_id, { is_active: !u.is_active }); toast.success(u.is_active?'Đã khóa':'Đã mở khóa'); loadData(); } catch(e){toast.error(e.message);} };
  const openResetPw = (id) => { setResetModal({ open: true, userId: id, newPassword: '' }); };
  const handleResetPw = async (e) => {
    e.preventDefault();
    if (!resetModal.newPassword) return;
    try {
      await userService.resetPassword(resetModal.userId, { new_password: resetModal.newPassword });
      toast.success('Đã reset mật khẩu');
      setResetModal({ open: false, userId: null, newPassword: '' });
    } catch(e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Tài khoản hệ thống</h1><p>{users.length} tài khoản</p></div>
        {_canCreate && <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Tạo tài khoản</button>}
      </div>
      <div className="card"><div className="table-container">
        <table>
          <thead><tr><th>Username</th><th>Nhân viên</th><th>Role</th><th>Trạng thái</th><th>Lần đăng nhập cuối</th>
          {_canUpdate && <th>Thao tác</th>}</tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id}>
                <td style={{fontWeight:600}}>{u.username}</td>
                <td>{u.full_name||'— Hệ thống —'}</td>
                <td><span className={`badge ${roleBadge[u.role]}`}>{u.role}</span></td>
                <td><span className={`badge ${u.is_active?'badge-success':'badge-danger'}`}>{u.is_active?'Active':'Locked'}</span></td>
                <td>{u.last_login ? new Date(u.last_login).toLocaleString('vi-VN') : '—'}</td>
                {_canUpdate && (
                  <td>
                    <button type="button" className="btn btn-sm btn-outline" title="Reset mật khẩu" onClick={()=>openResetPw(u.user_id)}><FiLock/></button>{' '}
                    <button type="button" className="btn btn-sm btn-outline" title={u.is_active?'Khóa':'Mở khóa'} onClick={()=>toggleActive(u)}>{u.is_active?<FiToggleRight/>:<FiToggleLeft/>}</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>Tạo tài khoản mới</h3><button className="modal-close" onClick={()=>setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group"><label>Username *</label><input className="form-control" required value={form.username||''} onChange={e=>setForm({...form,username:e.target.value})} /></div>
                <div className="form-group"><label>Mật khẩu *</label><input className="form-control" type="password" required value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})} /></div>
                <div className="form-group"><label>Role *</label><select className="form-control" value={form.role||'staff'} onChange={e=>setForm({...form,role:e.target.value})}><option value="admin">Admin</option><option value="manager">Manager</option><option value="staff">Staff</option><option value="warehouse">Warehouse</option></select></div>
                <div className="form-group"><label>Employee ID (nếu có)</label><input className="form-control" type="number" value={form.employee_id||''} onChange={e=>setForm({...form,employee_id:e.target.value})} /></div>
                <div className="form-actions"><button type="button" className="btn btn-outline" onClick={()=>setShowModal(false)}>Hủy</button><button type="submit" className="btn btn-primary">Tạo tài khoản</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {resetModal.open && (
        <div className="modal-overlay" onClick={()=>setResetModal({open: false, userId: null, newPassword: ''})}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3>Đổi mật khẩu</h3><button className="modal-close" onClick={()=>setResetModal({open: false, userId: null, newPassword: ''})}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleResetPw}>
                <div className="form-group">
                  <label>Mật khẩu mới *</label>
                  <input className="form-control" type="password" required value={resetModal.newPassword} onChange={e=>setResetModal({...resetModal, newPassword: e.target.value})} autoFocus />
                </div>
                <div className="form-actions" style={{ marginTop: 24 }}>
                  <button type="button" className="btn btn-outline" onClick={()=>setResetModal({open: false, userId: null, newPassword: ''})}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Xác nhận</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
