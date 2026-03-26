import { useState, useEffect } from 'react';
import { FiEye, FiEyeOff, FiTrash2 } from 'react-icons/fi';
import { reviewService } from '../services/dataService';
import { toast } from 'react-toastify';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const d = await reviewService.getAll({ limit: 50 }); setReviews(d.reviews||[]); } catch(e){toast.error(e.message);} };
  const toggle = async (id, v) => { try { await reviewService.toggleVisibility(id, !v); toast.success(v?'Đã ẩn':'Đã hiện'); loadData(); } catch(e){toast.error(e.message);} };
  const del = async (id) => { if(!confirm('Xóa?')) return; try { await reviewService.delete(id); toast.success('Đã xóa'); loadData(); } catch(e){toast.error(e.message);} };

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
                <td><button className="btn btn-sm btn-outline" onClick={()=>toggle(r.review_id,r.is_visible)}>{r.is_visible?<FiEyeOff/>:<FiEye/>}</button>{' '}<button className="btn btn-sm btn-danger" onClick={()=>del(r.review_id)}><FiTrash2/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
