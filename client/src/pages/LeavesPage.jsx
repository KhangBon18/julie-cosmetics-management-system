import { useState, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { leaveService } from '../services/dataService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

const statusBadge = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
const statusLabel = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
const typeLabel = { annual: 'Phép năm', sick: 'Ốm đau', maternity: 'Thai sản', unpaid: 'Không lương', resignation: 'Nghỉ việc' };

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [total, setTotal] = useState(0);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { canUpdate } = usePermission();
  const isManager = canUpdate('leaves');

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const d = await leaveService.getAll({ limit: 50 }); setLeaves(d.leaves||[]); setTotal(d.total||0); } catch(e){toast.error(e.message);} };
  const handleApprove = async (id) => { try { await leaveService.approve(id); toast.success('Đã duyệt'); loadData(); } catch(e){toast.error(e.message);} };
  const openRejectModal = (leave) => {
    setRejectTarget(leave);
    setRejectReason(leave?.reject_reason || '');
  };
  const closeRejectModal = () => {
    setRejectTarget(null);
    setRejectReason('');
  };
  const handleReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await leaveService.reject(rejectTarget.request_id, { reject_reason: reason });
      toast.success('Đã từ chối');
      closeRejectModal();
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <div className="page-header"><div><h1>Nghỉ phép & Nghỉ việc</h1><p>{total} đơn</p></div></div>
      <div className="card"><div className="table-container">
        <table>
          <thead><tr><th>Nhân viên</th><th>Loại</th><th>Từ ngày</th><th>Đến ngày</th><th>Số ngày</th><th>Lý do</th><th>Trạng thái</th>{isManager&&<th>Thao tác</th>}</tr></thead>
          <tbody>
            {leaves.map(l => (
              <tr key={l.request_id}>
                <td style={{fontWeight:600}}>{l.employee_name}</td>
                <td>{typeLabel[l.leave_type]||l.leave_type}</td>
                <td>{new Date(l.start_date).toLocaleDateString('vi-VN')}</td>
                <td>{new Date(l.end_date).toLocaleDateString('vi-VN')}</td>
                <td>{l.total_days}</td>
                <td style={{maxWidth:220}}>
                  <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.reason}</div>
                  {l.status === 'rejected' && l.reject_reason ? (
                    <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                      Lý do từ chối: {l.reject_reason}
                    </div>
                  ) : null}
                </td>
                <td><span className={`badge ${statusBadge[l.status]}`}>{statusLabel[l.status]}</span></td>
                {isManager && <td>{l.status==='pending' && <><button className="btn btn-sm btn-success" onClick={()=>handleApprove(l.request_id)}><FiCheck /></button>{' '}<button className="btn btn-sm btn-danger" onClick={()=>openRejectModal(l)}><FiX /></button></>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>

      {rejectTarget && (
        <div className="modal-overlay" onClick={closeRejectModal} role="dialog" aria-modal="true" aria-label="Từ chối đơn nghỉ">
          <div className="modal" onClick={event => event.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Từ chối đơn nghỉ</h3>
              <button className="modal-close" onClick={closeRejectModal} aria-label="Đóng">×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
                Nhân viên: <strong>{rejectTarget.employee_name}</strong>
              </p>
              <div className="form-group">
                <label htmlFor="reject-reason">Lý do từ chối</label>
                <textarea
                  id="reject-reason"
                  className="form-control"
                  rows={4}
                  value={rejectReason}
                  onChange={event => setRejectReason(event.target.value)}
                  placeholder="Nhập lý do từ chối để lưu vào hồ sơ duyệt đơn"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-outline" onClick={closeRejectModal}>Hủy</button>
                <button className="btn btn-danger" onClick={handleReject}>Xác nhận từ chối</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
