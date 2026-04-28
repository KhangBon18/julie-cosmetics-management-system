import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import staffService from '../../services/staffService';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

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
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [showFormula, setShowFormula] = useState(false);
  const [detailSalary, setDetailSalary] = useState(null);

  useEffect(() => { loadData(); }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salaryData, formulaData] = await Promise.all([
        staffService.getMySalaries({ year: year || undefined }),
        staffService.getSalaryFormula()
      ]);
      const sals = salaryData.salaries || [];
      sals.forEach(s => {
        if (typeof s.calculation_details === 'string') {
          try { s.calculation_details = JSON.parse(s.calculation_details); } catch(e){}
        }
      });
      setSalaries(sals);
      setFormula(formulaData);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const totalNet = salaries.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng lương cá nhân</h1>
          <p>Xem phiếu lương và chi tiết tính toán</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
              {formula.details.map((d, i) => <li key={i} style={{ padding: '4px 0', color: '#475569' }}>{d}</li>)}
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
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tháng</th><th>Ngày công</th><th>NP có lương</th><th>NP k.lương</th>
                <th>Trễ</th><th>OT</th><th>Lương CB</th><th>Gross</th>
                <th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th><th>TT</th><th></th>
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
                    <button className="btn btn-sm btn-outline" onClick={() => setDetailSalary(s)}>📋</button>
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
              <button className="btn btn-sm btn-outline" onClick={() => setDetailSalary(null)}>✕</button>
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
