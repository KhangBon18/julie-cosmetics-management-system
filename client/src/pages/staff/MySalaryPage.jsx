import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import staffService from '../../services/staffService';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));
const fmtMoney = (n) => `${fmt(n)}đ`;
const generatedAtLabel = () => new Date().toLocaleString('vi-VN');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getEmployeeName = (profile, salary) => (
  profile?.full_name || salary?.employee_name || 'Nhân viên Julie Cosmetics'
);

const getEmployeeCode = (profile, salary) => (
  profile?.employee_code || profile?.employee_id || salary?.employee_id || salary?.salary_id || 'N/A'
);

const getPositionLabel = (profile) => (
  profile?.position_name || profile?.current_position || profile?.department_name || profile?.department || 'Chưa cập nhật'
);

const parseDetails = (salary) => {
  if (!salary?.calculation_details) return null;
  if (typeof salary.calculation_details === 'object') return salary.calculation_details;
  try { return JSON.parse(salary.calculation_details); } catch { return null; }
};

const openSalaryPrintWindow = (html, title) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để tiếp tục.');
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body{font-family:Arial,'Helvetica Neue',sans-serif;color:#172033;margin:0;padding:28px;background:#fff}
          h1{font-size:24px;text-align:center;margin:0 0 4px;color:#1d4ed8}
          h2{font-size:18px;text-align:center;margin:0 0 22px;color:#334155;font-weight:600}
          .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 20px;margin-bottom:18px}
          .meta div{border-bottom:1px solid #e5e7eb;padding:7px 0;font-size:13px}
          .meta span{display:inline-block;min-width:130px;color:#64748b}
          .summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:18px 0}
          .box{border:1px solid #cbd5e1;border-radius:8px;padding:12px;text-align:center}
          .box label{display:block;font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:4px}
          .box strong{font-size:18px;color:#0f172a}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          th,td{border:1px solid #cbd5e1;padding:8px 10px;font-size:12px;text-align:right}
          th{background:#eef2ff;color:#1e293b;text-align:center}
          td.left{text-align:left}
          td.center{text-align:center}
          .section{font-weight:700;margin-top:18px;color:#0f172a}
          .note{font-size:12px;line-height:1.5;color:#475569;margin-top:12px}
          .signatures{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:42px;text-align:center;font-size:13px}
          .muted{color:#64748b}
          @media print{body{padding:16mm}.no-print{display:none}}
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const renderFormulaHtml = (formula) => {
  if (!formula) return '';
  const details = (formula.details || []).map(item => `<li>${escapeHtml(item)}</li>`).join('');
  return `
    <div class="section">Công thức / ghi chú cách tính</div>
    <div class="note"><strong>${escapeHtml(formula.formula || '')}</strong></div>
    ${details ? `<ul class="note">${details}</ul>` : ''}
  `;
};

const renderMonthlySalaryHtml = (salary, profile, formula) => {
  const details = parseDetails(salary);
  const gross = Number(salary.gross_salary || details?.summary?.gross_salary || 0);
  const deductions = Number(salary.deductions || details?.summary?.total_deductions || 0);
  const bonus = Number(salary.bonus || 0);
  const net = Number(salary.net_salary || 0);
  const employeeName = getEmployeeName(profile, salary);

  return `
    <h1>JULIE COSMETICS</h1>
    <h2>Phiếu lương tháng ${escapeHtml(salary.month)}/${escapeHtml(salary.year)}</h2>
    <div class="meta">
      <div><span>Nhân viên:</span><strong>${escapeHtml(employeeName)}</strong></div>
      <div><span>Mã nhân viên:</span><strong>${escapeHtml(getEmployeeCode(profile, salary))}</strong></div>
      <div><span>Chức vụ/Bộ phận:</span><strong>${escapeHtml(getPositionLabel(profile))}</strong></div>
      <div><span>Ngày in:</span><strong>${escapeHtml(generatedAtLabel())}</strong></div>
      <div><span>Kỳ lương:</span><strong>Tháng ${escapeHtml(salary.month)}/${escapeHtml(salary.year)}</strong></div>
      <div><span>Trạng thái:</span><strong>${escapeHtml(salary.status || 'N/A')}</strong></div>
    </div>
    <table>
      <tbody>
        <tr><th class="left">Khoản mục</th><th>Giá trị</th></tr>
        <tr><td class="left">Lương cơ bản / lương hiệu lực</td><td>${fmtMoney(salary.base_salary || details?.base_rates?.effective_base_salary)}</td></tr>
        <tr><td class="left">Ngày công thực tế / ngày công chuẩn</td><td>${fmt(salary.work_days_actual)} / ${fmt(salary.work_days_standard)}</td></tr>
        <tr><td class="left">Nghỉ phép có lương</td><td>${fmt(salary.paid_leave_days)} ngày</td></tr>
        <tr><td class="left">Nghỉ không lương</td><td>${fmt(salary.unpaid_leave_days)} ngày</td></tr>
        <tr><td class="left">Vắng không phép</td><td>${fmt(salary.absent_days)} ngày</td></tr>
        <tr><td class="left">Đi trễ / về sớm</td><td>${fmt(salary.total_late_minutes)} phút / ${fmt(salary.total_early_leave_minutes)} phút</td></tr>
        <tr><td class="left">Tăng ca</td><td>${fmt(salary.total_overtime_minutes)} phút (${fmtMoney(salary.overtime_amount)})</td></tr>
        <tr><td class="left">Phụ cấp</td><td>${fmtMoney(salary.allowance_amount)}</td></tr>
        <tr><td class="left">Thưởng</td><td>${fmtMoney(bonus)}</td></tr>
        <tr><td class="left">Khấu trừ / phạt / nghỉ không lương</td><td>${fmtMoney(deductions)}</td></tr>
      </tbody>
    </table>
    <div class="summary">
      <div class="box"><label>Gross</label><strong>${fmtMoney(gross)}</strong></div>
      <div class="box"><label>Thưởng</label><strong>${fmtMoney(bonus)}</strong></div>
      <div class="box"><label>Khấu trừ</label><strong>${fmtMoney(deductions)}</strong></div>
      <div class="box"><label>Thực nhận</label><strong>${fmtMoney(net)}</strong></div>
    </div>
    ${salary.notes ? `<div class="note"><strong>Ghi chú:</strong> ${escapeHtml(salary.notes)}</div>` : ''}
    ${renderFormulaHtml(formula)}
    <div class="signatures">
      <div><strong>Người lập bảng lương</strong><br/><span class="muted">(Ký và ghi rõ họ tên)</span></div>
      <div><strong>Nhân viên xác nhận</strong><br/><span class="muted">(Ký và ghi rõ họ tên)</span></div>
    </div>
  `;
};

const renderAnnualSalaryHtml = (salaries, profile, formula, year) => {
  const totalGross = salaries.reduce((sum, salary) => sum + Number(salary.gross_salary || 0), 0);
  const totalBonus = salaries.reduce((sum, salary) => sum + Number(salary.bonus || 0), 0);
  const totalDeductions = salaries.reduce((sum, salary) => sum + Number(salary.deductions || 0), 0);
  const totalNet = salaries.reduce((sum, salary) => sum + Number(salary.net_salary || 0), 0);
  const totalWorkDays = salaries.reduce((sum, salary) => sum + Number(salary.work_days_actual || 0), 0);

  const rows = salaries.map(salary => `
    <tr>
      <td class="center">${escapeHtml(salary.month)}/${escapeHtml(salary.year)}</td>
      <td>${fmt(salary.work_days_actual)}/${fmt(salary.work_days_standard)}</td>
      <td>${fmt(salary.total_overtime_minutes)} phút</td>
      <td>${fmtMoney(salary.base_salary)}</td>
      <td>${fmtMoney(salary.gross_salary)}</td>
      <td>${fmtMoney(salary.bonus)}</td>
      <td>${fmtMoney(salary.deductions)}</td>
      <td>${fmtMoney(salary.net_salary)}</td>
      <td class="center">${escapeHtml(salary.status || '')}</td>
    </tr>
  `).join('');

  return `
    <h1>JULIE COSMETICS</h1>
    <h2>Bảng tổng hợp lương năm ${escapeHtml(year || 'tất cả')}</h2>
    <div class="meta">
      <div><span>Nhân viên:</span><strong>${escapeHtml(getEmployeeName(profile, salaries[0]))}</strong></div>
      <div><span>Mã nhân viên:</span><strong>${escapeHtml(getEmployeeCode(profile, salaries[0]))}</strong></div>
      <div><span>Chức vụ/Bộ phận:</span><strong>${escapeHtml(getPositionLabel(profile))}</strong></div>
      <div><span>Ngày in:</span><strong>${escapeHtml(generatedAtLabel())}</strong></div>
      <div><span>Số kỳ lương:</span><strong>${fmt(salaries.length)}</strong></div>
      <div><span>Tổng ngày công:</span><strong>${fmt(totalWorkDays)}</strong></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Kỳ</th><th>Ngày công</th><th>OT</th><th>Lương CB</th><th>Gross</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th><th>TT</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <th class="left" colspan="4">Tổng cộng</th>
          <th>${fmtMoney(totalGross)}</th>
          <th>${fmtMoney(totalBonus)}</th>
          <th>${fmtMoney(totalDeductions)}</th>
          <th>${fmtMoney(totalNet)}</th>
          <th></th>
        </tr>
      </tbody>
    </table>
    ${renderFormulaHtml(formula)}
    <div class="signatures">
      <div><strong>Người lập bảng lương</strong><br/><span class="muted">(Ký và ghi rõ họ tên)</span></div>
      <div><strong>Nhân viên xác nhận</strong><br/><span class="muted">(Ký và ghi rõ họ tên)</span></div>
    </div>
  `;
};

const STATUS_LABELS = {
  draft: { label: 'Nháp', color: '#64748b', bg: '#f1f5f9' },
  approved: { label: 'Đã duyệt', color: '#8b5cf6', bg: '#f3e8ff' },
  paid: { label: 'Đã thanh toán', color: '#059669', bg: '#d1fae5' },
  locked: { label: 'Đã khóa', color: '#dc2626', bg: '#fee2e2' },
};

const Badge = ({ status }) => {
  const s = STATUS_LABELS[status] || STATUS_LABELS.draft;
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg }}>{s.label}</span>;
};

export default function MySalaryPage() {
  const [salaries, setSalaries] = useState([]);
  const [formula, setFormula] = useState(null);
  const [profile, setProfile] = useState(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [showFormula, setShowFormula] = useState(false);
  const [detailSalary, setDetailSalary] = useState(null);

  useEffect(() => { loadData(); }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salaryData, formulaData, profileData] = await Promise.all([
        staffService.getMySalaries({ year: year || undefined }),
        staffService.getSalaryFormula(),
        staffService.getProfile()
      ]);
      const sals = salaryData.salaries || [];
      sals.forEach(s => {
        if (typeof s.calculation_details === 'string') {
          try { s.calculation_details = JSON.parse(s.calculation_details); } catch(e){}
        }
      });
      setSalaries(sals);
      setFormula(formulaData);
      setProfile(profileData?.employee || profileData || null);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const totalNet = salaries.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0);
  const totalBonus = salaries.reduce((s, r) => s + parseFloat(r.bonus || 0), 0);
  const totalDeductions = salaries.reduce((s, r) => s + parseFloat(r.deductions || 0), 0);

  const handlePrintMonthly = (salary) => {
    try {
      openSalaryPrintWindow(
        renderMonthlySalaryHtml(salary, profile, formula),
        `Phiếu lương T${salary.month}-${salary.year}`
      );
    } catch (err) {
      toast.error(err.message || 'Không thể mở cửa sổ in bảng lương tháng.');
    }
  };

  const handlePrintAnnual = () => {
    if (!salaries.length) {
      toast.info('Chưa có dữ liệu lương để in bảng tổng hợp năm.');
      return;
    }

    try {
      openSalaryPrintWindow(
        renderAnnualSalaryHtml(salaries, profile, formula, year),
        `Bảng lương năm ${year || 'tat-ca'}`
      );
    } catch (err) {
      toast.error(err.message || 'Không thể mở cửa sổ in bảng lương năm.');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng lương cá nhân</h1>
          <p>Xem phiếu lương và chi tiết tính toán</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handlePrintAnnual} disabled={!salaries.length}>
            In bảng lương năm
          </button>
          <button className="btn btn-outline" onClick={() => setShowFormula(!showFormula)}>
            📐 {showFormula ? 'Ẩn công thức' : 'Cách tính lương'}
          </button>
        </div>
      </div>

      {showFormula && formula && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #f59e0b' }}>
          <div className="card-header"><h3>📐 Công thức tính lương</h3></div>
          <div className="card-body">
            <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1', marginBottom: 12, fontFamily: 'monospace' }}>{formula.formula}</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(formula.details || []).map((d, i) => <li key={i} style={{ padding: '4px 0', color: '#475569' }}>{d}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <select className="form-control" style={{ width: 120 }} value={year} onChange={e => setYear(e.target.value)}>
              <option value="">Tất cả năm</option>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span style={{ color: '#64748b', fontSize: 14 }}>
              Tổng thực nhận: <strong style={{ color: '#2563eb' }}>{fmt(totalNet)}đ</strong>
            </span>
            <span style={{ color: '#64748b', fontSize: 14 }}>
              Thưởng: <strong style={{ color: '#059669' }}>{fmt(totalBonus)}đ</strong>
            </span>
            <span style={{ color: '#64748b', fontSize: 14 }}>
              Khấu trừ: <strong style={{ color: '#ef4444' }}>{fmt(totalDeductions)}đ</strong>
            </span>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tháng</th><th>Ngày công</th><th>NP có lương</th><th>NP k.lương</th>
                <th>Trễ</th><th>OT</th><th>Lương CB</th><th>Gross</th>
                <th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th><th>TT</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map(s => (
                <tr key={s.salary_id}>
                  <td style={{ fontWeight: 600 }}>{s.month}/{s.year}</td>
                  <td>{s.work_days_actual}/{s.work_days_standard}</td>
                  <td>{s.paid_leave_days || 0}</td>
                  <td>{s.unpaid_leave_days || 0}</td>
                  <td>{s.total_late_minutes || 0}ph</td>
                  <td>{s.total_overtime_minutes || 0}ph</td>
                  <td>{fmt(s.base_salary)}</td>
                  <td>{fmt(s.gross_salary)}</td>
                  <td style={{ color: '#059669' }}>{Number(s.bonus) > 0 ? `+${fmt(s.bonus)}` : '—'}</td>
                  <td style={{ color: '#ef4444' }}>{Number(s.deductions) > 0 ? `-${fmt(s.deductions)}` : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{fmt(s.net_salary)}đ</td>
                  <td><Badge status={s.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setDetailSalary(s)}>Chi tiết</button>
                      <button className="btn btn-sm btn-primary" onClick={() => handlePrintMonthly(s)}>In tháng</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!salaries.length && <tr><td colSpan={13} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có bảng lương</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailSalary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             onClick={() => setDetailSalary(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 28 }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Phiếu lương T{detailSalary.month}/{detailSalary.year}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-primary" onClick={() => handlePrintMonthly(detailSalary)}>In phiếu tháng</button>
                <button className="btn btn-sm btn-outline" onClick={() => setDetailSalary(null)}>✕</button>
              </div>
            </div>

            {detailSalary.calculation_details ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#334155' }}>Cơ sở tính toán</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Lương cơ bản hiệu lực:</span>
                      <span style={{ fontWeight: 600 }}>{fmt(detailSalary.calculation_details.base_rates.effective_base_salary)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Công chuẩn:</span>
                      <span style={{ fontWeight: 600 }}>{detailSalary.calculation_details.base_rates.standard_working_days} ngày</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Đơn giá ngày:</span>
                      <span style={{ fontWeight: 600 }}>{fmt(detailSalary.calculation_details.base_rates.daily_rate)}đ/ngày</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Đơn giá giờ:</span>
                      <span style={{ fontWeight: 600 }}>{fmt(detailSalary.calculation_details.base_rates.hourly_rate)}đ/giờ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Công thực tế:</span>
                      <span style={{ fontWeight: 600 }}>{detailSalary.calculation_details.attendance.work_days_actual} ngày</span>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#334155' }}>Các khoản Cộng / Trừ</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Tăng ca ({detailSalary.calculation_details.additions.overtime_minutes}p × {detailSalary.calculation_details.additions.overtime_multiplier}):</span>
                      <span style={{ fontWeight: 600, color: '#059669' }}>+{fmt(detailSalary.calculation_details.additions.overtime_amount)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Nghỉ không lương ({detailSalary.calculation_details.leaves.unpaid_leave_days} ngày):</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{fmt(detailSalary.calculation_details.leaves.unpaid_leave_deduction)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Vắng không phép ({detailSalary.calculation_details.attendance.absent_days} ngày):</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{fmt(detailSalary.calculation_details.attendance.absence_deduction)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Phạt trễ ({detailSalary.calculation_details.penalties.late_minutes} phút):</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{fmt(detailSalary.calculation_details.penalties.late_penalty_amount)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Phạt về sớm ({detailSalary.calculation_details.penalties.early_leave_minutes} phút):</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{fmt(detailSalary.calculation_details.penalties.early_leave_penalty_amount)}đ</span>
                    </div>
                  </div>
                </div>

                {detailSalary.notes && (
                  <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#92400e', border: '1px solid #fde68a' }}>
                    📝 Ghi chú: {detailSalary.notes}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                  <div><div style={{ color: '#64748b', fontSize: 12 }}>GROSS (Base + OT)</div><div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(detailSalary.calculation_details.summary.gross_salary)}đ</div></div>
                  <div><div style={{ color: '#64748b', fontSize: 12 }}>THƯỞNG KHÁC</div><div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>+{fmt(detailSalary.bonus)}đ</div></div>
                  <div><div style={{ color: '#64748b', fontSize: 12 }}>TỔNG TRỪ</div><div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>-{fmt(detailSalary.calculation_details.summary.total_deductions)}đ</div></div>
                  <div><div style={{ color: '#64748b', fontSize: 12 }}>THỰC NHẬN</div><div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{fmt(detailSalary.net_salary)}đ</div></div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {[
                  ['Trạng thái', <Badge key="s" status={detailSalary.status} />],
                  ['Lương cơ bản', `${fmt(detailSalary.base_salary)}đ`],
                  ['Ngày công chuẩn', `${detailSalary.work_days_standard} ngày`],
                  ['Ngày công thực tế', `${detailSalary.work_days_actual} ngày`],
                  ['Nghỉ có lương', `${detailSalary.paid_leave_days || 0} ngày`],
                  ['Nghỉ không lương', `${detailSalary.unpaid_leave_days || 0} ngày`],
                  ['Vắng', `${detailSalary.absent_days || 0} ngày`],
                  ['Đi trễ', `${detailSalary.total_late_minutes || 0} phút`],
                  ['Về sớm', `${detailSalary.total_early_leave_minutes || 0} phút`],
                  ['Tăng ca', `${detailSalary.total_overtime_minutes || 0} phút`],
                  ['Tiền tăng ca', `${fmt(detailSalary.overtime_amount)}đ`],
                  ['Phụ cấp', `${fmt(detailSalary.allowance_amount)}đ`],
                  ['Phạt đi trễ', `${fmt(detailSalary.late_penalty_amount)}đ`],
                  ['Phạt về sớm', `${fmt(detailSalary.early_leave_penalty_amount)}đ`],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {!detailSalary.calculation_details && (
              <div style={{ display: 'flex', justifyContent: 'space-around', padding: 16, background: '#eff6ff', borderRadius: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>GROSS</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(detailSalary.gross_salary)}đ</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>THƯỞNG</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>+{fmt(detailSalary.bonus)}đ</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>KHẤU TRỪ</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>-{fmt(detailSalary.deductions)}đ</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: 12 }}>THỰC NHẬN</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{fmt(detailSalary.net_salary)}đ</div>
                </div>
              </div>
            )}

            {!detailSalary.calculation_details && detailSalary.notes && (
              <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}>
                📝 {detailSalary.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
