import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import staffService from '../../services/staffService';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
const normalizeNote = (value) => String(value || '').trim();
const getSupplementalNotes = (salary) => {
  const notes = [];
  const mainNote = normalizeNote(salary.notes);
  const bonusReason = normalizeNote(salary.bonus_reason);

  if (mainNote) notes.push({ text: mainNote, tone: 'default' });
  if (bonusReason && bonusReason !== mainNote) {
    notes.push({ text: `Thưởng: ${bonusReason}`, tone: 'bonus' });
  }

  return notes;
};

export default function MySalaryPage() {
  const [salaries, setSalaries] = useState([]);
  const [formula, setFormula] = useState(null);
  const [year, setYear] = useState('2026');
  const [loading, setLoading] = useState(true);
  const [showFormula, setShowFormula] = useState(false);
  const printRef = useRef();

  useEffect(() => { loadData(); }, [year]);

  const loadData = async () => {
    try {
      const [salaryData, formulaData] = await Promise.all([
        staffService.getMySalaries({ year: year || undefined }),
        staffService.getSalaryFormula()
      ]);
      setSalaries(salaryData.salaries || []);
      setFormula(formulaData);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalNet = salaries.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Bảng lương - Julie Cosmetics</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #1e293b; }
          h1 { text-align: center; color: #6366f1; margin-bottom: 4px; }
          h2 { text-align: center; color: #64748b; font-weight: 400; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: right; font-size: 13px; }
          th { background: #f1f5f9; font-weight: 600; text-align: center; }
          td:first-child { text-align: center; }
          .total-row { background: #eff6ff; font-weight: 700; }
          .note { display:block; margin-top:4px; font-size:11px; color:#64748b; text-align:left; }
          .note.bonus { color:#059669; }
          .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>💄 JULIE COSMETICS</h1>
        <h2>BẢNG LƯƠNG NĂM ${year}</h2>
        <p><strong>Nhân viên:</strong> ${salaries[0]?.employee_name || '—'}</p>
        <table>
          <thead>
            <tr><th>Tháng</th><th>Ngày công</th><th>Lương CB</th><th>Lương thực</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th></tr>
          </thead>
          <tbody>
            ${salaries.map(s => `
              <tr>
                <td>
                  ${s.month}/${s.year}
                  ${getSupplementalNotes(s).map(note => `<span class="note${note.tone === 'bonus' ? ' bonus' : ''}">${note.text}</span>`).join('')}
                </td>
                <td>${s.work_days_actual}/${s.work_days_standard}</td>
                <td>${fmt(s.base_salary)}đ</td>
                <td>${fmt(s.gross_salary)}đ</td>
                <td>${s.bonus > 0 ? '+' + fmt(s.bonus) + 'đ' : '—'}</td>
                <td>${s.deductions > 0 ? '-' + fmt(s.deductions) + 'đ' : '—'}</td>
                <td style="font-weight:bold;color:#2563eb">${fmt(s.net_salary)}đ</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="6" style="text-align:right">TỔNG CỘNG NĂM ${year}:</td>
              <td style="color:#059669">${fmt(totalNet)}đ</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>Xuất bởi hệ thống Julie Cosmetics — ${new Date().toLocaleString('vi-VN')}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintMonth = (salary) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Phiếu lương tháng ${salary.month}/${salary.year}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: auto; }
          h1 { text-align: center; color: #6366f1; margin-bottom: 4px; }
          h2 { text-align: center; color: #64748b; font-weight: 400; margin-top: 0; }
          .info { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info:last-child { border-bottom: none; }
          .label { color: #64748b; }
          .value { font-weight: 600; }
          .total { font-size: 20px; color: #2563eb; text-align: center; margin-top: 24px; padding: 16px; background: #eff6ff; border-radius: 8px; }
          .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px; }
          .section { margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>💄 JULIE COSMETICS</h1>
        <h2>PHIẾU LƯƠNG THÁNG ${salary.month}/${salary.year}</h2>
        <div class="section">
          <div class="info"><span class="label">Nhân viên:</span><span class="value">${salary.employee_name}</span></div>
          <div class="info"><span class="label">Ngày công chuẩn:</span><span class="value">${salary.work_days_standard} ngày</span></div>
          <div class="info"><span class="label">Ngày công thực tế:</span><span class="value">${salary.work_days_actual} ngày</span></div>
          <div class="info"><span class="label">Ngày nghỉ không lương:</span><span class="value">${salary.unpaid_leave_days} ngày</span></div>
        </div>
        <div class="section">
          <div class="info"><span class="label">Lương cơ bản:</span><span class="value">${fmt(salary.base_salary)}đ</span></div>
          <div class="info"><span class="label">Lương thực tế:</span><span class="value">${fmt(salary.gross_salary)}đ</span></div>
          <div class="info"><span class="label">Thưởng:</span><span class="value" style="color:#059669">${salary.bonus > 0 ? '+' + fmt(salary.bonus) + 'đ' : '—'}</span></div>
          ${normalizeNote(salary.bonus_reason) && normalizeNote(salary.bonus_reason) !== normalizeNote(salary.notes) ? `<div class="info"><span class="label">Lý do thưởng:</span><span class="value">${salary.bonus_reason}</span></div>` : ''}
          <div class="info"><span class="label">Khấu trừ:</span><span class="value" style="color:#ef4444">${salary.deductions > 0 ? '-' + fmt(salary.deductions) + 'đ' : '—'}</span></div>
        </div>
        <div class="total">
          <div style="font-size:14px;color:#64748b;margin-bottom:4px">THỰC NHẬN</div>
          <strong>${fmt(salary.net_salary)}đ</strong>
        </div>
        ${getSupplementalNotes(salary).length ? `<div style="margin-top:16px;color:#64748b">${getSupplementalNotes(salary).map(note => `<p style="margin:6px 0;color:${note.tone === 'bonus' ? '#059669' : '#64748b'}"><em>${note.text}</em></p>`).join('')}</div>` : ''}
        <div class="footer">
          <p>Xuất bởi hệ thống Julie Cosmetics — ${new Date().toLocaleString('vi-VN')}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng lương cá nhân</h1>
          <p>Xem và in bảng lương của bạn</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setShowFormula(!showFormula)}>
            📐 {showFormula ? 'Ẩn công thức' : 'Cách tính lương'}
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>🖨️ In bảng lương năm</button>
        </div>
      </div>

      {/* Công thức tính lương */}
      {showFormula && formula && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #f59e0b' }}>
          <div className="card-header"><h3>📐 Công thức tính lương</h3></div>
          <div className="card-body">
            <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1', marginBottom: 12, fontFamily: 'monospace' }}>
              {formula.formula}
            </div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {formula.details.map((d, i) => <li key={i} style={{ padding: '4px 0', color: '#475569' }}>{d}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <select className="form-control" style={{ width: 120 }} value={year} onChange={e => setYear(e.target.value)}>
              <option value="">Tất cả năm</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <span style={{ color: '#64748b', fontSize: 14 }}>
              Tổng thực nhận: <strong style={{ color: '#2563eb' }}>{fmt(totalNet)}đ</strong>
            </span>
          </div>
        </div>

        <div className="table-container" ref={printRef}>
          <table>
            <thead>
              <tr><th>Tháng</th><th>Ngày công</th><th>Lương CB</th><th>Lương thực</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {salaries.map(s => (
                <tr key={s.salary_id}>
                  <td style={{ fontWeight: 600 }}>
                    <div>{s.month}/{s.year}</div>
                    {getSupplementalNotes(s).map(note => (
                      <div
                        key={`${s.salary_id}-${note.tone}-${note.text}`}
                        style={{ fontSize: 12, color: note.tone === 'bonus' ? '#059669' : '#64748b', fontWeight: 400, marginTop: 4 }}
                      >
                        {note.text}
                      </div>
                    ))}
                  </td>
                  <td>{s.work_days_actual}/{s.work_days_standard}</td>
                  <td>{fmt(s.base_salary)}đ</td>
                  <td>{fmt(s.gross_salary)}đ</td>
                  <td style={{ color: '#059669' }}>{s.bonus > 0 ? `+${fmt(s.bonus)}đ` : '—'}</td>
                  <td style={{ color: '#ef4444' }}>{s.deductions > 0 ? `-${fmt(s.deductions)}đ` : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{fmt(s.net_salary)}đ</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handlePrintMonth(s)}>
                      🖨️ In
                    </button>
                  </td>
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
