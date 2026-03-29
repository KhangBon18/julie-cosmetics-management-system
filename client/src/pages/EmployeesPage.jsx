import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import { employeeService, positionService } from '../services/dataService';
import { toast } from 'react-toastify';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [positions, setPositions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const limit = 10;

  useEffect(() => { loadEmployees(); }, [page]);
  useEffect(() => { positionService.getAll().then(setPositions).catch(() => {}); }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll({ page, limit });
      setEmployees(data.employees || []);
      setTotal(data.total || 0);
    } catch (err) { toast.error(err.message); }
  };

  const openCreate = () => { setEditing(null); setForm({ full_name:'', email:'', phone:'', gender:'Nam', hire_date: new Date().toISOString().slice(0,10), base_salary:0, status:'active' }); setShowModal(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e, date_of_birth: e.date_of_birth?.slice(0,10), hire_date: e.hire_date?.slice(0,10) }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await employeeService.update(editing.employee_id, form); toast.success('Cập nhật thành công'); }
      else { await employeeService.create(form); toast.success('Thêm nhân viên thành công'); }
      setShowModal(false); loadEmployees();
    } catch (err) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await employeeService.delete(deleteTarget.employee_id); toast.success('Đã xóa'); loadEmployees(); } catch (err) { toast.error(err.message); }
    finally { setDeleteTarget(null); }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div>
      <div className="page-header">
        <div><h1>Nhân viên</h1><p>{total} nhân viên</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Thêm nhân viên</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Nhân viên</th><th>Email</th><th>SĐT</th><th>Chức vụ</th><th>Lương</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.employee_id}>
                  <td><div style={{ fontWeight: 600 }}>{e.full_name}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{e.gender}</div></td>
                  <td>{e.email}</td>
                  <td>{e.phone}</td>
                  <td>{e.position_name || '—'}</td>
                  <td>{fmt(e.base_salary)}đ</td>
                  <td><span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{e.status === 'active' ? 'Đang làm' : 'Nghỉ việc'}</span></td>
                  <td><button className="btn btn-sm btn-outline" onClick={() => openEdit(e)}><FiEdit2 /></button> <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(e)}><FiTrash2 /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group"><label>Họ tên *</label><input className="form-control" required value={form.full_name||''} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Email *</label><input className="form-control" type="email" required value={form.email||''} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  <div className="form-group"><label>SĐT</label><input className="form-control" value={form.phone||''} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Giới tính</label><select className="form-control" value={form.gender||'Nam'} onChange={e => setForm({...form, gender: e.target.value})}><option>Nam</option><option>Nữ</option></select></div>
                  <div className="form-group"><label>Ngày sinh</label><input className="form-control" type="date" value={form.date_of_birth||''} onChange={e => setForm({...form, date_of_birth: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Ngày vào làm *</label><input className="form-control" type="date" required value={form.hire_date||''} onChange={e => setForm({...form, hire_date: e.target.value})} /></div>
                  <div className="form-group"><label>Lương cơ bản</label><input className="form-control" type="number" value={form.base_salary||''} onChange={e => setForm({...form, base_salary: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Địa chỉ</label><input className="form-control" value={form.address||''} onChange={e => setForm({...form, address: e.target.value})} /></div>
                {editing && <div className="form-group"><label>Trạng thái</label><select className="form-control" value={form.status||'active'} onChange={e => setForm({...form, status: e.target.value})}><option value="active">Đang làm</option><option value="inactive">Nghỉ việc</option></select></div>}
                <div className="form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button><button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog-icon"><FiAlertTriangle /></div>
            <h3 className="confirm-dialog-title">Xác nhận xóa</h3>
            <p className="confirm-dialog-message">Bạn có chắc chắn muốn xóa nhân viên "{deleteTarget.full_name}"? Hành động này không thể hoàn tác.</p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
