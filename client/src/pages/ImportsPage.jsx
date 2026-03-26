import { useState, useEffect } from 'react';
import { importService } from '../services/dataService';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function ImportsPage() {
  const [imports, setImports] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const d = await importService.getAll({ limit: 50 }); setImports(d.imports||[]); setTotal(d.total||0); } catch(e){toast.error(e.message);} };

  return (
    <div>
      <div className="page-header"><div><h1>Phiếu nhập kho</h1><p>{total} phiếu nhập</p></div></div>
      <div className="card"><div className="table-container">
        <table>
          <thead><tr><th>Mã phiếu</th><th>Nhà cung cấp</th><th>Người tạo</th><th>Tổng tiền</th><th>Ghi chú</th><th>Ngày nhập</th></tr></thead>
          <tbody>
            {imports.map(i => (
              <tr key={i.receipt_id}>
                <td>#{i.receipt_id}</td>
                <td style={{fontWeight:600}}>{i.supplier_name}</td>
                <td>{i.created_by_name||'—'}</td>
                <td style={{fontWeight:600,color:'#2563eb'}}>{fmt(i.total_amount)}đ</td>
                <td>{i.note||'—'}</td>
                <td>{new Date(i.created_at).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
