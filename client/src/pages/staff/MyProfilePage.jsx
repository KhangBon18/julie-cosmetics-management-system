import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import staffService from '../../services/staffService';

export default function MyProfilePage() {
  const [employee, setEmployee] = useState(null);
  const [posHistory, setPosHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const data = await staffService.getProfile();
      setEmployee(data);
      setPosHistory(data.position_history || []);
      setForm({ phone: data.phone || '', address: data.address || '' });
    } catch (err) {
      toast.error(err.message || 'Lỗi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await staffService.updateProfile(form);
      toast.success('Cập nhật thành công!');
      setEditing(false);
      loadProfile();
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!employee) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Không tìm thấy thông tin nhân viên</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hồ sơ cá nhân</h1>
          <p>Xem và cập nhật thông tin cá nhân</p>
        </div>
        <button className={`btn ${editing ? 'btn-outline' : 'btn-primary'}`} onClick={() => { if (editing) handleSave(); else setEditing(true); }}>
          {editing ? '💾 Lưu thay đổi' : '✏️ Chỉnh sửa'}
        </button>
      </div>

      <div className="card">
        <div className="card-header"><h3>Thông tin cá nhân</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input className="form-control" value={employee.full_name} disabled />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" value={employee.email} disabled />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input className="form-control" value={form.phone} disabled={!editing}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={editing ? { borderColor: '#6366f1' } : {}} />
            </div>
            <div className="form-group">
              <label>Địa chỉ</label>
              <input className="form-control" value={form.address} disabled={!editing}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={editing ? { borderColor: '#6366f1' } : {}} />
            </div>
            <div className="form-group">
              <label>Giới tính</label>
              <input className="form-control" value={employee.gender} disabled />
            </div>
            <div className="form-group">
              <label>Ngày sinh</label>
              <input className="form-control" value={employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString('vi-VN') : '—'} disabled />
            </div>
            <div className="form-group">
              <label>Ngày nhận việc</label>
              <input className="form-control" value={employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('vi-VN') : '—'} disabled />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <input className="form-control" value={employee.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ'} disabled />
            </div>
            <div className="form-group">
              <label>Chức vụ hiện tại</label>
              <input className="form-control" value={employee.position_name || 'Chưa gán'} disabled />
            </div>
            <div className="form-group">
              <label>Lương cơ bản</label>
              <input className="form-control" value={new Intl.NumberFormat('vi-VN').format(employee.base_salary) + 'đ'} disabled />
            </div>
          </div>
          {editing && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSave}>💾 Lưu</button>
              <button className="btn btn-outline" onClick={() => { setEditing(false); setForm({ phone: employee.phone || '', address: employee.address || '' }); }}>Hủy</button>
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử chức vụ */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3>Lịch sử chức vụ</h3></div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Chức vụ</th><th>Ngày nhận</th><th>Ngày kết thúc</th><th>Lương tại thời điểm</th><th>Ghi chú</th></tr>
            </thead>
            <tbody>
              {posHistory.map((h, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{h.position_name}</td>
                  <td>{new Date(h.effective_date).toLocaleDateString('vi-VN')}</td>
                  <td>{h.end_date ? new Date(h.end_date).toLocaleDateString('vi-VN') : <span className="badge badge-success">Hiện tại</span>}</td>
                  <td>{new Intl.NumberFormat('vi-VN').format(h.salary_at_time)}đ</td>
                  <td>{h.note || '—'}</td>
                </tr>
              ))}
              {!posHistory.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Chưa có lịch sử chức vụ</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
