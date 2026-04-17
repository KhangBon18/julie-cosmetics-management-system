import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import { employeeService, positionService } from '../services/dataService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [positions, setPositions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [positionTarget, setPositionTarget] = useState(null);
  const [positionHistory, setPositionHistory] = useState([]);
  const [positionForm, setPositionForm] = useState({});
  const [submittingPosition, setSubmittingPosition] = useState(false);
  const limit = 10;

  const { canCreate, canUpdate, canDelete } = usePermission();
  const _canCreate = canCreate('employees');
  const _canUpdate = canUpdate('employees');
  const _canDelete = canDelete('employees');

  useEffect(() => { loadEmployees(); }, [page]);
  useEffect(() => { positionService.getAll().then(setPositions).catch(() => {}); }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll({ page, limit });
      setEmployees(data.employees || []);
      setTotal(data.total || 0);
    } catch (err) { toast.error(err.message); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      full_name: '',
      email: '',
      phone: '',
      gender: 'Nam',
      hire_date: new Date().toISOString().slice(0, 10),
      position_id: '',
      base_salary: 0,
      status: 'active'
    });
    setShowModal(true);
  };
  const openEdit = (e) => { setEditing(e); setForm({ ...e, date_of_birth: e.date_of_birth?.slice(0,10), hire_date: e.hire_date?.slice(0,10) }); setShowModal(true); };
  const openAssignPosition = async (employee) => {
    try {
      const history = await employeeService.getPositionHistory(employee.employee_id);
      setPositionHistory(history || []);
      setPositionTarget(employee);
      setPositionForm({
        position_id: '',
        effective_date: new Date().toISOString().slice(0, 10),
        salary_at_time: employee.base_salary || 0,
        note: ''
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await employeeService.update(editing.employee_id, form);
        toast.success('Cập nhật thành công');
      } else {
        await employeeService.create({
          ...form,
          position_id: Number(form.position_id),
          base_salary: Number(form.base_salary || 0)
        });
        toast.success('Thêm nhân viên thành công');
      }
      setShowModal(false); loadEmployees();
    } catch (err) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await employeeService.delete(deleteTarget.employee_id); toast.success('Đã xóa'); loadEmployees(); } catch (err) { toast.error(err.message); }
    finally { setDeleteTarget(null); }
  };

  const handleAssignPosition = async (e) => {
    e.preventDefault();
    if (!positionTarget) return;
    setSubmittingPosition(true);
    try {
      await employeeService.assignPosition(positionTarget.employee_id, positionForm);
      toast.success('Cập nhật chức vụ thành công');
      setPositionTarget(null);
      setPositionHistory([]);
      loadEmployees();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingPosition(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div>
      <div className="page-header">
        <div><h1>Nhân viên</h1><p>{total} nhân viên</p></div>
        {_canCreate && (
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Thêm nhân viên</button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Nhân viên</th><th>Email</th><th>SĐT</th><th>Chức vụ</th><th>Lương</th><th>Trạng thái</th>
            {(_canUpdate || _canDelete) && <th>Thao tác</th>}</tr></thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.employee_id}>
                  <td><div style={{ fontWeight: 600 }}>{e.full_name}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{e.gender}</div></td>
                  <td>{e.email}</td>
                  <td>{e.phone}</td>
                  <td>{e.position_name || '—'}</td>
                  <td>{fmt(e.base_salary)}đ</td>
                  <td><span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{e.status === 'active' ? 'Đang làm' : 'Nghỉ việc'}</span></td>
                  {(_canUpdate || _canDelete) && (
                    <td>
                      {_canUpdate && <button className="btn btn-sm btn-outline" onClick={() => openEdit(e)}><FiEdit2 /></button>}{' '}
                      {_canUpdate && <button className="btn btn-sm btn-outline" onClick={() => openAssignPosition(e)} title="Đổi chức vụ">🎯</button>}{' '}
                      {_canDelete && <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(e)}><FiTrash2 /></button>}
                    </td>
                  )}
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
                  <div className="form-group">
                    <label>{editing ? 'Lương cơ bản' : 'Lương tại thời điểm nhận chức vụ'}</label>
                    <input
                      className="form-control input-number"
                      type="text"
                      value={form.base_salary ? fmt(form.base_salary) : ''}
                      disabled={!!editing}
                      onChange={e => {
                        const num = parseInt(e.target.value.replace(/\D/g, ''), 10);
                        setForm({...form, base_salary: isNaN(num) ? '' : num});
                      }}
                    />
                    {editing && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        Muốn đổi lương/chức vụ theo thời điểm, vui lòng dùng nút 🎯 để hệ thống lưu lịch sử chức vụ đúng nghiệp vụ.
                      </div>
                    )}
                  </div>
                </div>
                {!editing && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Chức vụ ban đầu *</label>
                      <select
                        className="form-control"
                        required
                        value={form.position_id || ''}
                        onChange={e => {
                          const nextPositionId = e.target.value;
                          const nextPosition = positions.find(p => String(p.position_id) === nextPositionId);
                          setForm({
                            ...form,
                            position_id: nextPositionId,
                            base_salary: nextPosition?.base_salary || form.base_salary
                          });
                        }}
                      >
                        <option value="">Chọn chức vụ</option>
                        {positions.map(position => (
                          <option key={position.position_id} value={position.position_id}>
                            {position.position_name}
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        Hệ thống sẽ tự tạo lịch sử chức vụ đầu tiên ngay khi thêm nhân viên.
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Gợi ý theo chức vụ</label>
                      <input
                        className="form-control"
                        disabled
                        value={
                          form.position_id
                            ? `${fmt(positions.find(p => String(p.position_id) === String(form.position_id))?.base_salary || 0)}đ`
                            : 'Chọn chức vụ để xem mức lương gợi ý'
                        }
                      />
                    </div>
                  </div>
                )}
                <div className="form-group"><label>Địa chỉ</label><input className="form-control" value={form.address||''} onChange={e => setForm({...form, address: e.target.value})} /></div>
                {editing && <div className="form-group"><label>Trạng thái</label><select className="form-control" value={form.status||'active'} onChange={e => setForm({...form, status: e.target.value})}><option value="active">Đang làm</option><option value="inactive">Nghỉ việc</option></select></div>}
                <div className="form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button><button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {positionTarget && (
        <div className="modal-overlay" onClick={() => setPositionTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi chức vụ nhân viên</h3>
              <button className="modal-close" onClick={() => setPositionTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700 }}>{positionTarget.full_name}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Chức vụ hiện tại: {positionTarget.position_name || '—'} • Lương hiện tại: {fmt(positionTarget.base_salary)}đ</div>
              </div>

              <form onSubmit={handleAssignPosition}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Chức vụ mới *</label>
                    <select className="form-control" required value={positionForm.position_id || ''} onChange={e => {
                      const nextPositionId = e.target.value;
                      const nextPosition = positions.find(p => String(p.position_id) === nextPositionId);
                      setPositionForm({
                        ...positionForm,
                        position_id: nextPositionId,
                        salary_at_time: nextPosition?.base_salary || positionForm.salary_at_time
                      });
                    }}>
                      <option value="">Chọn chức vụ</option>
                      {positions.map(p => (
                        <option key={p.position_id} value={p.position_id}>{p.position_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ngày hiệu lực *</label>
                    <input className="form-control" type="date" required value={positionForm.effective_date || ''} onChange={e => setPositionForm({ ...positionForm, effective_date: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Lương tại thời điểm nhận chức vụ *</label>
                    <input className="form-control input-number" type="text" required value={positionForm.salary_at_time ? fmt(positionForm.salary_at_time) : ''} onChange={e => {
                      const num = parseInt(e.target.value.replace(/\D/g, ''), 10);
                      setPositionForm({ ...positionForm, salary_at_time: isNaN(num) ? 0 : num });
                    }} />
                  </div>
                  <div className="form-group">
                    <label>Ghi chú</label>
                    <input className="form-control" value={positionForm.note || ''} onChange={e => setPositionForm({ ...positionForm, note: e.target.value })} placeholder="VD: Điều chuyển nội bộ / thăng chức" />
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                  Hệ thống sẽ tự động kết thúc chức vụ hiện tại vào ngày trước hiệu lực mới và dùng lịch sử này để prorate bảng lương theo từng giai đoạn trong tháng.
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setPositionTarget(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingPosition}>
                    {submittingPosition ? 'Đang cập nhật...' : 'Lưu chức vụ mới'}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: 20 }}>
                <h4 style={{ marginBottom: 12 }}>Lịch sử chức vụ</h4>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Chức vụ</th><th>Hiệu lực từ</th><th>Đến ngày</th><th>Lương tại thời điểm đó</th></tr></thead>
                    <tbody>
                      {positionHistory.map(item => (
                        <tr key={item.id}>
                          <td>{item.position_name}</td>
                          <td>{item.effective_date?.slice(0, 10)}</td>
                          <td>{item.end_date ? item.end_date.slice(0, 10) : 'Hiện tại'}</td>
                          <td>{fmt(item.salary_at_time)}đ</td>
                        </tr>
                      ))}
                      {!positionHistory.length && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>Chưa có lịch sử chức vụ</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
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
