import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { invoiceService } from '../services/dataService';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => { loadData(); }, [page]);

  const loadData = async () => {
    try {
      const data = await invoiceService.getAll({ page, limit });
      setInvoices(data.invoices || []); setTotal(data.total || 0);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header"><div><h1>Hóa đơn</h1><p>{total} hóa đơn</p></div></div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Mã HĐ</th><th>Khách hàng</th><th>Tổng tiền</th><th>Giảm giá</th><th>Thành tiền</th><th>Điểm</th><th>Thanh toán</th><th>Ngày</th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.invoice_id}>
                  <td>#{inv.invoice_id}</td>
                  <td>{inv.customer_name || <span style={{color:'#94a3b8'}}>Vãng lai</span>}</td>
                  <td>{fmt(inv.subtotal)}đ</td>
                  <td>{inv.discount_percent > 0 ? `${inv.discount_percent}% (-${fmt(inv.discount_amount)}đ)` : '—'}</td>
                  <td style={{fontWeight:600, color:'#059669'}}>{fmt(inv.final_total)}đ</td>
                  <td>{inv.points_earned > 0 ? `+${inv.points_earned}` : '—'}</td>
                  <td><span className={`badge ${inv.payment_method==='cash'?'badge-success':inv.payment_method==='card'?'badge-info':'badge-purple'}`}>{inv.payment_method}</span></td>
                  <td>{new Date(inv.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > limit && <div className="pagination"><div className="pagination-info">Trang {page}/{Math.ceil(total/limit)}</div><div className="pagination-buttons"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Trước</button><button disabled={page>=Math.ceil(total/limit)} onClick={()=>setPage(p=>p+1)}>Sau</button></div></div>}
      </div>
    </div>
  );
}
