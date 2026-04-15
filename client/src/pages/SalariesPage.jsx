import { useState, useEffect } from 'react';
import { salaryService } from '../services/dataService';
import { toast } from 'react-toastify';
import api from '../services/api';
import usePermission from '../hooks/usePermission';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
const monthLabel = (value) => `Tháng ${value}`;

const openPrintWindow = (html, title) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để tiếp tục.');
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body{font-family:'Segoe UI',sans-serif;padding:28px;color:#1e293b}
          h1{text-align:center;color:#4f46e5;margin-bottom:4px}
          h2{text-align:center;color:#64748b;font-weight:500;margin-top:0;margin-bottom:24px}
          .meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px}
          .meta-card{border:1px solid #dbeafe;background:#f8fbff;border-radius:12px;padding:14px 16px}
          .meta-label{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
          .meta-value{font-size:18px;font-weight:700;color:#1e3a8a;margin-top:4px}
          .section-title{margin:28px 0 10px;font-size:18px;font-weight:700;color:#1e293b}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{border:1px solid #cbd5e1;padding:10px 12px;font-size:13px}
          th{background:#eef2ff;font-weight:700;text-align:center}
          td{text-align:right;vertical-align:top}
          td.text-left{text-align:left}
          td.text-center{text-align:center}
          .subtotal-row td{background:#f8fafc;font-weight:700}
          .grand-total td{background:#e0f2fe;font-weight:800}
          .note{font-size:11px;color:#64748b;line-height:1.5;margin-top:4px}
          .footer{margin-top:28px;text-align:center;color:#94a3b8;font-size:12px}
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

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
    handlePrintYearReport();
  };

  const fetchPrintableSalaries = async (filters) => {
    const response = await salaryService.getAll({
      limit: 'all',
      year: filters.year,
      month: filters.month,
      employee_id: filters.employee_id
    });
    return response.salaries || [];
  };

  const renderSalaryRows = (rows, startIndex = 1) => rows.map((salary, index) => `
    <tr>
      <td class="text-center">${startIndex + index}</td>
      <td class="text-left">
        <div style="font-weight:700">${salary.employee_name}</div>
        ${salary.notes ? `<div class="note">${salary.notes}</div>` : ''}
      </td>
      <td class="text-center">${salary.month}/${salary.year}</td>
      <td class="text-center">${salary.work_days_actual}/${salary.work_days_standard}</td>
      <td>${fmt(salary.base_salary)}đ</td>
      <td>${fmt(salary.gross_salary)}đ</td>
      <td>${salary.bonus > 0 ? `+${fmt(salary.bonus)}đ` : '—'}</td>
      <td>${salary.deductions > 0 ? `-${fmt(salary.deductions)}đ` : '—'}</td>
      <td style="font-weight:700;color:#2563eb">${fmt(salary.net_salary)}đ</td>
    </tr>
  `).join('');

  const handlePrintMonthReport = async () => {
    if (!month) {
      toast.info('Vui lòng chọn tháng trước khi in bảng lương theo tháng.');
      return;
    }

    try {
      const printableRows = await fetchPrintableSalaries({ month, year });
      if (!printableRows.length) {
        toast.info(`Chưa có bảng lương cho tháng ${month}/${year}.`);
        return;
      }

      const totalNet = printableRows.reduce((sum, row) => sum + Number(row.net_salary || 0), 0);
      const totalBonus = printableRows.reduce((sum, row) => sum + Number(row.bonus || 0), 0);
      const totalDeductions = printableRows.reduce((sum, row) => sum + Number(row.deductions || 0), 0);

      openPrintWindow(`
        <h1>JULIE COSMETICS</h1>
        <h2>Bảng lương tháng ${month}/${year}</h2>
        <div class="meta">
          <div class="meta-card">
            <div class="meta-label">Số nhân sự</div>
            <div class="meta-value">${printableRows.length}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Tổng thưởng</div>
            <div class="meta-value">${fmt(totalBonus)}đ</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Tổng khấu trừ</div>
            <div class="meta-value">${fmt(totalDeductions)}đ</div>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>STT</th><th>Nhân viên</th><th>Tháng/Năm</th><th>Ngày công</th><th>Lương cơ bản</th><th>Lương thực tế</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th></tr>
          </thead>
          <tbody>
            ${renderSalaryRows(printableRows)}
            <tr class="grand-total">
              <td colspan="8" class="text-right" style="text-align:right">Tổng thực nhận tháng ${month}/${year}</td>
              <td>${fmt(totalNet)}đ</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">Xuất bởi hệ thống Julie Cosmetics — ${new Date().toLocaleString('vi-VN')}</div>
      `, `Bang luong thang ${month}-${year}`);
    } catch (error) {
      toast.error(error.message || 'Không thể in bảng lương theo tháng.');
    }
  };

  const handlePrintYearReport = async () => {
    if (!year) {
      toast.info('Vui lòng chọn năm trước khi in bảng lương theo năm.');
      return;
    }

    try {
      const printableRows = await fetchPrintableSalaries({ year });
      if (!printableRows.length) {
        toast.info(`Chưa có bảng lương cho năm ${year}.`);
        return;
      }

      const monthGroups = printableRows.reduce((acc, row) => {
        const key = Number(row.month);
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});

      const sortedMonths = Object.keys(monthGroups).map(Number).sort((a, b) => a - b);
      const annualTotal = printableRows.reduce((sum, row) => sum + Number(row.net_salary || 0), 0);
      const annualBonus = printableRows.reduce((sum, row) => sum + Number(row.bonus || 0), 0);
      const annualDeductions = printableRows.reduce((sum, row) => sum + Number(row.deductions || 0), 0);

      let runningIndex = 1;
      const monthSections = sortedMonths.map((monthValue) => {
        const rows = monthGroups[monthValue];
        const monthTotal = rows.reduce((sum, row) => sum + Number(row.net_salary || 0), 0);
        const currentIndex = runningIndex;
        runningIndex += rows.length;

        return `
          <div class="section-title">${monthLabel(monthValue)} năm ${year}</div>
          <table>
            <thead>
              <tr><th>STT</th><th>Nhân viên</th><th>Tháng/Năm</th><th>Ngày công</th><th>Lương cơ bản</th><th>Lương thực tế</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th></tr>
            </thead>
            <tbody>
              ${renderSalaryRows(rows, currentIndex)}
              <tr class="subtotal-row">
                <td colspan="8" style="text-align:right">Tổng thực nhận ${monthLabel(monthValue).toLowerCase()}/${year}</td>
                <td>${fmt(monthTotal)}đ</td>
              </tr>
            </tbody>
          </table>
        `;
      }).join('');

      openPrintWindow(`
        <h1>JULIE COSMETICS</h1>
        <h2>Bảng lương tổng hợp năm ${year}</h2>
        <div class="meta">
          <div class="meta-card">
            <div class="meta-label">Số bản ghi</div>
            <div class="meta-value">${printableRows.length}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Tổng thưởng năm</div>
            <div class="meta-value">${fmt(annualBonus)}đ</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Tổng khấu trừ năm</div>
            <div class="meta-value">${fmt(annualDeductions)}đ</div>
          </div>
        </div>
        ${monthSections}
        <table style="margin-top:20px">
          <tbody>
            <tr class="grand-total">
              <td style="text-align:right;width:85%">Tổng thực nhận năm ${year}</td>
              <td style="width:15%">${fmt(annualTotal)}đ</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">Xuất bởi hệ thống Julie Cosmetics — ${new Date().toLocaleString('vi-VN')}</div>
      `, `Bang luong nam ${year}`);
    } catch (error) {
      toast.error(error.message || 'Không thể in bảng lương theo năm.');
    }
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
            <>
              <button className="btn btn-outline" onClick={handlePrintMonthReport}>🖨️ In theo tháng</button>
              <button className="btn btn-outline" onClick={handlePrintAll}>🖨️ In theo năm</button>
            </>
          )}
        </div>
      </div>

      {/* Form tính lương tự động */}
      {showGenerate && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
          <div className="card-header"><h3>⚡ Tính lương tự động cho tất cả nhân viên</h3></div>
          <div className="card-body">
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              Hệ thống sẽ tự động tính lương cho tất cả nhân viên đang hoạt động dựa trên: lịch sử chức vụ theo ngày hiệu lực, ngày công chuẩn trong cấu hình hệ thống, và số ngày nghỉ không lương đã duyệt trong tháng. Nếu đổi chức vụ giữa tháng, lương sẽ được prorate theo từng giai đoạn chức vụ.
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
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.employee_name}</div>
                    {s.notes && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.notes}</div>}
                  </td>
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
