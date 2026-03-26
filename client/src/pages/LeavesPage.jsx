import { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiX } from 'react-icons/fi';
import { leaveService } from '../services/dataService';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';

const statusBadge = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
const statusLabel = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
const typeLabel = { annual: 'Phép năm', sick: 'Ốm đau', maternity: 'Thai sản', unpaid: 'Không lương' };

export default function LeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [total, setTotal] = useState(0);
  const isManager = ['admin','manager'].includes(user?.role);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const d = await leaveService.getAll({ limit: 50 }); setLeaves(d.leaves||[]); setTotal(d.total||0); } catch(e){toast.error(e.message);} };
  const handleApprove = async (id) => { try { await leaveService.approve(id); toast.success('Đã duyệt'); loadData(); } catch(e){toast.error(e.message);} };
  const handleReject = async (id) => { const r=prompt('Lý do từ chối:'); if(!r) return; try { await leaveService.reject(id, {reject_reason:r}); toast.success('Đã từ chối'); loadData(); } catch(e){toast.error(e.message);} };

  return (
    <div>
      <div className="page-header"><div><h1>Nghỉ phép</h1><p>{total} đơn</p></div></div>
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
                <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.reason}</td>
                <td><span className={`badge ${statusBadge[l.status]}`}>{statusLabel[l.status]}</span></td>
                {isManager && <td>{l.status==='pending' && <><button className="btn btn-sm btn-success" onClick={()=>handleApprove(l.request_id)}><FiCheck /></button>{' '}<button className="btn btn-sm btn-danger" onClick={()=>handleReject(l.request_id)}><FiX /></button></>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
