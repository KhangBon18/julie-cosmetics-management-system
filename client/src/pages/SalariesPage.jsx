import { useState, useEffect } from 'react';
import { salaryService } from '../services/dataService';
import { toast } from 'react-toastify';
import api from '../services/api';
import usePermission from '../hooks/usePermission';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function SalariesPage() {
  const [salaries, setSalaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('2026');
  const [generating, setGenerating] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(2026);
  const [showGenerate, setShowGenerate] = useState(false);

  const { canCreate, canExport } = usePermission();
  const _canCreate = canCreate('salaries');
  const _canExport = canExport('salaries');

  useEffect(() => { loadData(); }, [month, year]);

  const loadData = async () => {
    try {
      const d = await salaryService.getAll({ limit: 50, month: month || undefined, year: year || undefined });
      setSalaries(d.salaries || []); setTotal(d.total || 0);
    } catch (e) { toast.error(e.message); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await api.post('/salaries/generate', { month: genMonth, year: genYear });
      toast.success(result.message);
      setShowGenerate(false);
      setMonth(String(genMonth));
      setYear(String(genYear));
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi tạo bảng lương');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    const filterLabel = month ? `Tháng ${month}/${year}` : `Năm ${year}`;
    const totalNet = salaries.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0);
    printWindow.document.write(`
      <html><head><title>Bảng lương - Julie Cosmetics</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;padding:30px;color:#1e293b}
        h1{text-align:center;color:#6366f1;margin-bottom:4px}
        h2{text-align:center;color:#64748b;font-weight:400;margin-top:0}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #cbd5e1;padding:10px 12px;text-align:right;font-size:13px}
        th{background:#f1f5f9;font-weight:600;text-align:center}
        .total-row{background:#eff6ff;font-weight:700}
        .footer{margin-top:30px;text-align:center;color:#94a3b8;font-size:12px}
      </style></head><body>
        <h1>💄 JULIE COSMETICS</h1>
        <h2>BẢNG LƯƠNG TỔNG HỢP — ${filterLabel}</h2>
        <table><thead><tr><th>STT</th><th>Nhân viên</th><th>Tháng/Năm</th><th>Ngày công</th><th>Lương CB</th><th>Lương thực</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th></tr></thead>
        <tbody>
          ${salaries.map((s, i) => `<tr>
            <td style="text-align:center">${i + 1}</td>
            <td style="text-align:left;font-weight:600">${s.employee_name}</td>
            <td style="text-align:center">${s.month}/${s.year}</td>
            <td style="text-align:center">${s.work_days_actual}/${s.work_days_standard}</td>
            <td>${fmt(s.base_salary)}đ</td>
            <td>${fmt(s.gross_salary)}đ</td>
            <td>${s.bonus > 0 ? '+' + fmt(s.bonus) + 'đ' : '—'}</td>
            <td>${s.deductions > 0 ? '-' + fmt(s.deductions) + 'đ' : '—'}</td>
            <td style="font-weight:bold;color:#2563eb">${fmt(s.net_salary)}đ</td>
          </tr>`).join('')}
          <tr class="total-row"><td colspan="8" style="text-align:right">TỔNG CỘNG:</td><td style="color:#059669">${fmt(totalNet)}đ</td></tr>
        </tbody></table>
        <div class="footer"><p>Xuất bởi hệ thống Julie Cosmetics — ${new Date().toLocaleString('vi-VN')}</p></div>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Bảng lương</h1><p>{total} bản ghi</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {_canCreate && (
            <button className="btn btn-primary" onClick={() => setShowGenerate(!showGenerate)}>
              {showGenerate ? '✕ Đóng' : '⚡ Tính lương tự động'}
            </button>
          )}
          {(_canExport && salaries.length > 0) && (
            <button className="btn btn-outline" onClick={handlePrintAll}>🖨️ In bảng lương</button>
          )}
        </div>
      </div>

      {/* Form tính lương tự động */}
      {showGenerate && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
          <div className="card-header"><h3>⚡ Tính lương tự động cho tất cả nhân viên</h3></div>
          <div className="card-body">
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              Hệ thống sẽ tự động tính lương cho tất cả nhân viên đang hoạt động dựa trên: lương cơ bản, ngày công chuẩn (22 ngày), và số ngày nghỉ không lương đã duyệt trong tháng.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div className="form-group">
                <label>Tháng</label>
                <select className="form-control" value={genMonth} onChange={e => setGenMonth(parseInt(e.target.value))}>
                  {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Năm</label>
                <select className="form-control" value={genYear} onChange={e => setGenYear(parseInt(e.target.value))}>
                  <option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ height: 40 }}>
                {generating ? 'Đang tính...' : '⚡ Tính lương & Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <select className="form-control" style={{ width: 120 }} value={month} onChange={e => setMonth(e.target.value)}>
              <option value="">Tất cả tháng</option>
              {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
            </select>
            <select className="form-control" style={{ width: 100 }} value={year} onChange={e => setYear(e.target.value)}>
              <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Nhân viên</th><th>Tháng/Năm</th><th>Ngày công</th><th>Lương CB</th><th>Lương thực</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th></tr></thead>
            <tbody>
              {salaries.map(s => (
                <tr key={s.salary_id}>
                  <td style={{ fontWeight: 600 }}>{s.employee_name}</td>
                  <td>{s.month}/{s.year}</td>
                  <td>{s.work_days_actual}/{s.work_days_standard}</td>
                  <td>{fmt(s.base_salary)}đ</td>
                  <td>{fmt(s.gross_salary)}đ</td>
                  <td style={{ color: '#059669' }}>{s.bonus > 0 ? `+${fmt(s.bonus)}đ` : '—'}</td>
                  <td style={{ color: '#ef4444' }}>{s.deductions > 0 ? `-${fmt(s.deductions)}đ` : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{fmt(s.net_salary)}đ</td>
                </tr>
              ))}
              {!salaries.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có bảng lương</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
