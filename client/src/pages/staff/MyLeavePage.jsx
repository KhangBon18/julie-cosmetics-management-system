import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import staffService from '../../services/staffService';

const leaveTypeLabels = {
  annual: 'Phép năm',
  sick: 'Ốm đau',
  maternity: 'Thai sản',
  unpaid: 'Nghỉ không lương',
  resignation: 'Nghỉ việc'
};
const statusLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
const statusClass = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };

export default function MyLeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await staffService.getMyLeaves();
      setLeaves(data.leaves || []);
      setLeaveBalance(data.leave_balance || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date || !form.reason) {
      return toast.error('Vui lòng nhập đầy đủ thông tin');
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      return toast.error('Ngày kết thúc phải sau ngày bắt đầu');
    }
    setSubmitting(true);
    try {
      await staffService.createLeave(form);
      toast.success('Nộp đơn nghỉ phép thành công!');
      setShowForm(false);
      setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi nộp đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const calcDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const diff = Math.abs(new Date(form.end_date) - new Date(form.start_date));
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Nghỉ phép & Nghỉ việc</h1>
          <p>{leaves.length} đơn đã gửi</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {leaveBalance && (
            <div style={{ background: '#f8fafc', padding: '6px 16px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Tổng phép</div>
                <div style={{ fontWeight: 600 }}>{leaveBalance.annual_leave_entitled}</div>
              </div>
              <div style={{ width: 1, height: 24, background: '#cbd5e1' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Đã dùng</div>
                <div style={{ fontWeight: 600, color: '#ef4444' }}>{leaveBalance.annual_leave_used}</div>
              </div>
              <div style={{ width: 1, height: 24, background: '#cbd5e1' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Còn lại</div>
                <div style={{ fontWeight: 700, color: '#059669', fontSize: 16 }}>{leaveBalance.annual_leave_remaining}</div>
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Đóng' : '+ Tạo đơn mới'}
          </button>
        </div>
      </div>

      {/* Form nộp đơn */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
          <div className="card-header"><h3>📝 Tạo đơn nghỉ phép / nghỉ việc</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Loại nghỉ phép</label>
                  <select className="form-control" value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>
                    <option value="annual">Phép năm</option>
                    <option value="sick">Ốm đau</option>
                    <option value="maternity">Thai sản</option>
                    <option value="unpaid">Nghỉ không lương</option>
                    <option value="resignation">Nghỉ việc</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Số ngày ước tính: <strong style={{ color: '#6366f1' }}>{calcDays()} ngày</strong></label>
                  <input className="form-control" disabled value={`${calcDays()} ngày`} />
                  <small style={{ color: '#64748b', marginTop: 6, display: 'block' }}>
                    Đây là số ngày preview. Với đơn nghỉ việc, ngày kết thúc sẽ được xem là ngày làm việc cuối cùng.
                  </small>
                </div>
                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input className="form-control" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input className="form-control" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>{form.leave_type === 'resignation' ? 'Lý do nghỉ việc' : 'Lý do nghỉ phép'}</label>
                <textarea className="form-control" rows={3} value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder={form.leave_type === 'resignation' ? 'Nhập lý do nghỉ việc, thời điểm bàn giao...' : 'Nhập lý do nghỉ phép...'} required />
              </div>
              {form.leave_type === 'resignation' ? (
                <div style={{ background: '#fff7ed', color: '#9a3412', padding: 12, borderRadius: 8, marginTop: 8, fontSize: 13 }}>
                  Sau khi quản lý duyệt, hệ thống dùng <strong>ngày kết thúc</strong> làm ngày nghỉ việc chính thức để khóa tài khoản và chuyển hồ sơ sang trạng thái đã nghỉ.
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Đang nộp...' : '📋 Nộp đơn'}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách đơn */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Loại</th><th>Từ ngày</th><th>Đến ngày</th><th>Số ngày</th><th>Lý do</th><th>Trạng thái</th><th>Người duyệt</th></tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.request_id}>
                  <td><span className="badge badge-info">{leaveTypeLabels[l.leave_type] || l.leave_type}</span></td>
                  <td>{new Date(l.start_date).toLocaleDateString('vi-VN')}</td>
                  <td>{new Date(l.end_date).toLocaleDateString('vi-VN')}</td>
                  <td style={{ fontWeight: 600 }}>{l.total_days}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                  <td><span className={`badge ${statusClass[l.status]}`}>{statusLabels[l.status]}</span></td>
                  <td>
                    <div>{l.approved_by_name || '—'}</div>
                    {l.status === 'rejected' && l.reject_reason ? (
                      <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                        Lý do: {l.reject_reason}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!leaves.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có đơn nghỉ nào</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
