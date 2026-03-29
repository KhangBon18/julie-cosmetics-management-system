import { useState, useEffect } from 'react';
import { FiEye, FiEyeOff, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { reviewService } from '../services/dataService';
import { toast } from 'react-toastify';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const d = await reviewService.getAll({ limit: 50 }); setReviews(d.reviews||[]); } catch(e){toast.error(e.message);} };
  const toggle = async (id, v) => { try { await reviewService.toggleVisibility(id, !v); toast.success(v?'Đã ẩn':'Đã hiện'); loadData(); } catch(e){toast.error(e.message);} };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await reviewService.delete(deleteTarget.review_id); toast.success('Đã xóa'); loadData(); } catch(e){toast.error(e.message);}
    finally { setDeleteTarget(null); }
  };

  return (
    <div>
      <div className="page-header"><div><h1>Đánh giá sản phẩm</h1><p>{reviews.length} đánh giá</p></div></div>
      <div className="card"><div className="table-container">
        <table>
          <thead><tr><th>Sản phẩm</th><th>Khách hàng</th><th>⭐</th><th>Nội dung</th><th>Hiển thị</th><th>Thao tác</th></tr></thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.review_id}>
                <td style={{fontWeight:600}}>{r.product_name}</td>
                <td>{r.customer_name}</td>
                <td>{'⭐'.repeat(r.rating)}</td>
                <td style={{maxWidth:250}}>{r.comment||'—'}</td>
                <td><span className={`badge ${r.is_visible?'badge-success':'badge-danger'}`}>{r.is_visible?'Hiện':'Ẩn'}</span></td>
                <td><button className="btn btn-sm btn-outline" onClick={()=>toggle(r.review_id,r.is_visible)}>{r.is_visible?<FiEyeOff/>:<FiEye/>}</button>{' '}<button className="btn btn-sm btn-danger" onClick={()=>setDeleteTarget(r)}><FiTrash2/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog-icon"><FiAlertTriangle /></div>
            <h3 className="confirm-dialog-title">Xác nhận xóa</h3>
            <p className="confirm-dialog-message">Bạn có chắc chắn muốn xóa đánh giá của "{deleteTarget.customer_name}" cho sản phẩm "{deleteTarget.product_name}"?</p>
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
