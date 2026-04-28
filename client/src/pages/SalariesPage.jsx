import { useEffect, useMemo, useState } from 'react';
import { payrollService, salaryService, employeeService } from '../services/dataService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

const STATUS_LABELS = {
  draft: { label: 'Nháp', color: '#64748b', bg: '#f1f5f9' },
  calculated: { label: 'Đã tính', color: '#0ea5e9', bg: '#e0f2fe' },
  approved: { label: 'Đã duyệt', color: '#8b5cf6', bg: '#f3e8ff' },
  paid: { label: 'Đã thanh toán', color: '#059669', bg: '#d1fae5' },
  locked: { label: 'Đã khóa', color: '#dc2626', bg: '#fee2e2' },
};

const Badge = ({ status }) => {
  const s = STATUS_LABELS[status] || STATUS_LABELS.draft;
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
};

const ADJ_TYPES = [
  { value: 'allowance', label: 'Phụ cấp' },
  { value: 'bonus', label: 'Thưởng' },
  { value: 'deduction', label: 'Khấu trừ' },
  { value: 'fine', label: 'Phạt' },
  { value: 'other', label: 'Khác' },
];

export default function SalariesPage() {
  const now = new Date();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  // Detail modal
  const [detailRecord, setDetailRecord] = useState(null);
  const [detailAdjs, setDetailAdjs] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  // Adjustment form
  const [adjForm, setAdjForm] = useState({ type: 'bonus', title: '', amount: '', note: '' });
  const [savingAdj, setSavingAdj] = useState(false);

  const { canCreate, canUpdate, canDelete, canExport } = usePermission();
  const _canCreate = canCreate('salaries');
  const _canUpdate = canUpdate('salaries');
  const _canExport = canExport('salaries');

  useEffect(() => { loadPeriods(); }, []);

  const loadPeriods = async () => {
    try {
      const data = await payrollService.getPayrollPeriods();
      setPeriods(data.periods || []);
      // Auto-select latest
      if (data.periods?.length && !selectedPeriod) {
        const latest = data.periods[0];
        setSelectedPeriod(latest);
        loadRecords(latest.period_id);
      }
    } catch (e) { toast.error(e.message); }
  };

  const loadRecords = async (periodId) => {
    if (!periodId) return;
    setLoading(true);
    try {
      const data = await payrollService.getRecords(periodId);
      setRecords(data.records || []);
      if (data.period) setSelectedPeriod(data.period);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleCreatePeriod = async () => {
    setCreating(true);
    try {
      const data = await payrollService.createPayrollPeriod({ month: genMonth, year: genYear });
      toast.success(data.message);
      await loadPeriods();
      setSelectedPeriod(data.period);
      loadRecords(data.period.period_id);
    } catch (e) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const handleCalculate = async () => {
    if (!selectedPeriod) return;
    setCalculating(true);
    try {
      const data = await payrollService.calculatePayroll(selectedPeriod.period_id);
      toast.success(data.message);
      if (data.warnings?.length) data.warnings.forEach(w => toast.warn(w));
      if (data.errors?.length) toast.error(`${data.errors.length} lỗi khi tính lương`);
      await loadPeriods();
      loadRecords(selectedPeriod.period_id);
    } catch (e) { toast.error(e.message); }
    finally { setCalculating(false); }
  };

  const handleTransition = async (action, label) => {
    if (!selectedPeriod) return;
    if (!window.confirm(`Xác nhận: ${label} kỳ lương ${selectedPeriod.month}/${selectedPeriod.year}?`)) return;
    setTransitioning(true);
    try {
      let data;
      if (action === 'approve') data = await payrollService.approvePayroll(selectedPeriod.period_id);
      else if (action === 'markPaid') data = await payrollService.markPaid(selectedPeriod.period_id);
      else if (action === 'lock') data = await payrollService.lockPayroll(selectedPeriod.period_id);
      toast.success(data.message);
      await loadPeriods();
      loadRecords(selectedPeriod.period_id);
    } catch (e) { toast.error(e.message); }
    finally { setTransitioning(false); }
  };

  const openDetail = async (record) => {
    try {
      const data = await payrollService.getRecordById(record.salary_id);
      if (typeof data.record.calculation_details === 'string') {
        try { data.record.calculation_details = JSON.parse(data.record.calculation_details); } catch(e){}
      }
      setDetailRecord(data.record);
      setDetailAdjs(data.adjustments || []);
      setShowDetail(true);
      setAdjForm({ type: 'bonus', title: '', amount: '', note: '' });
    } catch (e) { toast.error(e.message); }
  };

  const handleAddAdj = async (e) => {
    e.preventDefault();
    if (!detailRecord) return;
    setSavingAdj(true);
    try {
      await payrollService.createAdjustment(detailRecord.salary_id, {
        type: adjForm.type, title: adjForm.title,
        amount: Number(String(adjForm.amount).replace(/\D/g, '')),
        note: adjForm.note,
      });
      toast.success('Đã thêm khoản cộng/trừ');
      const data = await payrollService.getRecordById(detailRecord.salary_id);
      if (typeof data.record.calculation_details === 'string') {
        try { data.record.calculation_details = JSON.parse(data.record.calculation_details); } catch(e){}
      }
      setDetailRecord(data.record);
      setDetailAdjs(data.adjustments || []);
      setAdjForm({ type: 'bonus', title: '', amount: '', note: '' });
      loadRecords(selectedPeriod.period_id);
    } catch (e2) { toast.error(e2.message); }
    finally { setSavingAdj(false); }
  };

  const handleDeleteAdj = async (adjId) => {
    if (!window.confirm('Xóa khoản cộng/trừ này?')) return;
    try {
      await payrollService.deleteAdjustment(adjId);
      toast.success('Đã xóa');
      const data = await payrollService.getRecordById(detailRecord.salary_id);
      if (typeof data.record.calculation_details === 'string') {
        try { data.record.calculation_details = JSON.parse(data.record.calculation_details); } catch(e){}
      }
      setDetailRecord(data.record);
      setDetailAdjs(data.adjustments || []);
      loadRecords(selectedPeriod.period_id);
    } catch (e) { toast.error(e.message); }
  };

  const periodSummary = useMemo(() => ({
    totalGross: records.reduce((s, r) => s + Number(r.gross_salary || 0), 0),
    totalNet: records.reduce((s, r) => s + Number(r.net_salary || 0), 0),
    totalBonus: records.reduce((s, r) => s + Number(r.bonus || 0), 0),
    count: records.length,
  }), [records]);

  const sp = selectedPeriod;
  const isDraft = sp?.status === 'draft';
  const isCalc = sp?.status === 'calculated';
  const canCalc = isDraft || isCalc;
  const canApprove = isCalc;
  const canPay = sp?.status === 'approved';
  const canLock = sp?.status === 'paid';
  const isEditable = isDraft || isCalc;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng lương</h1>
          <p>Quản lý kỳ lương, tính lương, phê duyệt và thanh toán</p>
        </div>
      </div>

      {/* Period selector + create */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3>📅 Kỳ lương</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Tháng</label>
              <select className="form-control" style={{ width: 120 }} value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Năm</label>
              <select className="form-control" style={{ width: 100 }} value={genYear} onChange={e => setGenYear(Number(e.target.value))}>
                {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {_canCreate && (
              <button className="btn btn-primary" onClick={handleCreatePeriod} disabled={creating} style={{ height: 40 }}>
                {creating ? 'Đang tạo...' : '➕ Tạo kỳ lương'}
              </button>
            )}
          </div>

          {periods.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Kỳ</th><th>Trạng thái</th><th>Nhân viên</th><th>Tổng Gross</th><th>Tổng Net</th><th>Người tính</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                  {periods.map(p => (
                    <tr key={p.period_id} style={{ background: sp?.period_id === p.period_id ? '#eff6ff' : undefined, cursor: 'pointer' }}
                        onClick={() => { setSelectedPeriod(p); loadRecords(p.period_id); }}>
                      <td style={{ fontWeight: 600 }}>T{p.month}/{p.year}</td>
                      <td><Badge status={p.status} /></td>
                      <td>{p.total_employees}</td>
                      <td>{fmt(p.total_gross)}đ</td>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{fmt(p.total_net)}đ</td>
                      <td>{p.calculated_by_name || '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setSelectedPeriod(p); loadRecords(p.period_id); }}>
                          👁 Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!periods.length && <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Chưa có kỳ lương nào. Tạo kỳ lương để bắt đầu.</div>}
        </div>
      </div>

      {/* Selected period actions */}
      {sp && (
        <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid ${(STATUS_LABELS[sp.status] || {}).color || '#6366f1'}` }}>
          <div className="card-header">
            <h3>Kỳ lương T{sp.month}/{sp.year} — <Badge status={sp.status} /></h3>
          </div>
          <div className="card-body">
            <div className="stats-grid" style={{ marginBottom: 16 }}>
              <div className="stat-card"><div className="stat-icon blue">👥</div><div className="stat-content"><h4>Nhân viên</h4><div className="stat-value">{periodSummary.count}</div></div></div>
              <div className="stat-card"><div className="stat-icon green">💰</div><div className="stat-content"><h4>Tổng Gross</h4><div className="stat-value">{fmt(periodSummary.totalGross)}đ</div></div></div>
              <div className="stat-card"><div className="stat-icon blue">💵</div><div className="stat-content"><h4>Tổng Net</h4><div className="stat-value">{fmt(periodSummary.totalNet)}đ</div></div></div>
              <div className="stat-card"><div className="stat-icon green">🎁</div><div className="stat-content"><h4>Tổng thưởng</h4><div className="stat-value">{fmt(periodSummary.totalBonus)}đ</div></div></div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canCalc && _canCreate && (
                <button className="btn btn-primary" onClick={handleCalculate} disabled={calculating}>
                  {calculating ? '⏳ Đang tính...' : '⚡ Tính lương'}
                </button>
              )}
              {canApprove && _canUpdate && (
                <button className="btn btn-outline" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }} onClick={() => handleTransition('approve', 'Duyệt')} disabled={transitioning}>
                  ✅ Duyệt
                </button>
              )}
              {canPay && _canUpdate && (
                <button className="btn btn-outline" style={{ borderColor: '#059669', color: '#059669' }} onClick={() => handleTransition('markPaid', 'Đánh dấu đã thanh toán')} disabled={transitioning}>
                  💳 Đã thanh toán
                </button>
              )}
              {canLock && _canUpdate && (
                <button className="btn btn-outline" style={{ borderColor: '#dc2626', color: '#dc2626' }} onClick={() => handleTransition('lock', 'Khóa')} disabled={transitioning}>
                  🔒 Khóa kỳ
                </button>
              )}
              {_canExport && (
                <button className="btn btn-outline" onClick={() => payrollService.export(sp.period_id)}>
                  📥 Xuất CSV
                </button>
              )}
            </div>

            {sp.attendance_period_status === 'open' && (
              <div style={{ marginTop: 12, padding: '8px 16px', background: '#fffbeb', borderRadius: 8, color: '#92400e', fontSize: 13 }}>
                ⚠️ Kỳ công tháng này chưa chốt. Nên chốt công trước khi tính lương.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payroll Records Table */}
      {sp && (
        <div className="card">
          <div className="card-header"><h3>Bảng lương T{sp.month}/{sp.year}</h3></div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Lương CB</th>
                  <th>Ngày công</th>
                  <th>NP có lương</th>
                  <th>NP k.lương</th>
                  <th>Vắng</th>
                  <th>Trễ (ph)</th>
                  <th>Sớm (ph)</th>
                  <th>OT (ph)</th>
                  <th>OT (đ)</th>
                  <th>Thưởng</th>
                  <th>Khấu trừ</th>
                  <th>Gross</th>
                  <th>Net</th>
                  <th>TT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={16} style={{ textAlign: 'center', padding: 40 }}>Đang tải...</td></tr>
                ) : records.length ? records.map(r => (
                  <tr key={r.salary_id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.employee_name}</td>
                    <td>{fmt(r.base_salary)}</td>
                    <td>{r.work_days_actual}/{r.work_days_standard}</td>
                    <td>{r.paid_leave_days || 0}</td>
                    <td>{r.unpaid_leave_days || 0}</td>
                    <td>{r.absent_days || 0}</td>
                    <td>{r.total_late_minutes || 0}</td>
                    <td>{r.total_early_leave_minutes || 0}</td>
                    <td>{r.total_overtime_minutes || 0}</td>
                    <td>{fmt(r.overtime_amount)}</td>
                    <td style={{ color: '#059669' }}>{Number(r.bonus) > 0 ? `+${fmt(r.bonus)}` : '—'}</td>
                    <td style={{ color: '#ef4444' }}>{Number(r.deductions) > 0 ? `-${fmt(r.deductions)}` : '—'}</td>
                    <td>{fmt(r.gross_salary)}</td>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>{fmt(r.net_salary)}đ</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => openDetail(r)}>📋</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={16} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    {sp.status === 'draft' ? 'Kỳ lương chưa tính. Bấm "Tính lương" để bắt đầu.' : 'Không có bản ghi lương.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && detailRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             onClick={() => setShowDetail(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto', padding: 28 }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Phiếu lương — {detailRecord.employee_name}</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowDetail(false)}>✕</button>
            </div>

            {detailRecord.calculation_details ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Cột trái */}
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#334155' }}>Cơ sở tính toán</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Lương cơ bản hiệu lực:</span>
                      <span style={{ fontWeight: 600 }}>{fmt(detailRecord.calculation_details.base_rates.effective_base_salary)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Công chuẩn:</span>
                      <span style={{ fontWeight: 600 }}>{detailRecord.calculation_details.base_rates.standard_working_days} ngày</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Đơn giá ngày:</span>
                      <span style={{ fontWeight: 600 }}>{fmt(detailRecord.calculation_details.base_rates.daily_rate)}đ/ngày</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Đơn giá giờ:</span>
                      <span style={{ fontWeight: 600 }}>{fmt(detailRecord.calculation_details.base_rates.hourly_rate)}đ/giờ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Công thực tế:</span>
                      <span style={{ fontWeight: 600 }}>{detailRecord.calculation_details.attendance.work_days_actual} ngày</span>
                    </div>
                  </div>

                  {/* Cột phải */}
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#334155' }}>Các khoản Cộng / Trừ</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Tăng ca ({detailRecord.calculation_details.additions.overtime_minutes}p × {detailRecord.calculation_details.additions.overtime_multiplier}):</span>
                      <span style={{ fontWeight: 600, color: '#059669' }}>+{fmt(detailRecord.calculation_details.additions.overtime_amount)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Nghỉ không lương ({detailRecord.calculation_details.leaves.unpaid_leave_days} ngày):</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{fmt(detailRecord.calculation_details.leaves.unpaid_leave_deduction)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Vắng không phép ({detailRecord.calculation_details.attendance.absent_days} ngày):</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{fmt(detailRecord.calculation_details.attendance.absence_deduction)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Phạt trễ ({detailRecord.calculation_details.penalties.late_minutes} phút):</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{fmt(detailRecord.calculation_details.penalties.late_penalty_amount)}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Phạt về sớm ({detailRecord.calculation_details.penalties.early_leave_minutes} phút):</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>-{fmt(detailRecord.calculation_details.penalties.early_leave_penalty_amount)}đ</span>
                    </div>
                  </div>
                </div>

                {detailRecord.notes && (
                  <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#92400e', border: '1px solid #fde68a' }}>
                    📝 Ghi chú: {detailRecord.notes}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                  <div><div style={{ color: '#64748b', fontSize: 12 }}>GROSS (Base + OT)</div><div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(detailRecord.calculation_details.summary.gross_salary)}đ</div></div>
                  <div><div style={{ color: '#64748b', fontSize: 12 }}>THƯỞNG KHÁC</div><div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>+{fmt(detailRecord.bonus)}đ</div></div>
                  <div><div style={{ color: '#64748b', fontSize: 12 }}>TỔNG TRỪ</div><div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>-{fmt(detailRecord.calculation_details.summary.total_deductions)}đ</div></div>
                  <div><div style={{ color: '#64748b', fontSize: 12 }}>THỰC NHẬN</div><div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{fmt(detailRecord.net_salary)}đ</div></div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['Kỳ', `T${detailRecord.month}/${detailRecord.year}`],
                  ['Trạng thái', <Badge key="s" status={detailRecord.status} />],
                  ['Lương cơ bản', `${fmt(detailRecord.base_salary)}đ`],
                  ['Ngày công', `${detailRecord.work_days_actual}/${detailRecord.work_days_standard}`],
                  ['Nghỉ có lương', `${detailRecord.paid_leave_days || 0} ngày`],
                  ['Nghỉ không lương', `${detailRecord.unpaid_leave_days || 0} ngày`],
                  ['Vắng', `${detailRecord.absent_days || 0} ngày`],
                  ['Đi trễ', `${detailRecord.total_late_minutes || 0} phút`],
                  ['Về sớm', `${detailRecord.total_early_leave_minutes || 0} phút`],
                  ['Tăng ca', `${detailRecord.total_overtime_minutes || 0} phút → ${fmt(detailRecord.overtime_amount)}đ`],
                  ['Phụ cấp', `${fmt(detailRecord.allowance_amount)}đ`],
                  ['Phạt trễ', `${fmt(detailRecord.late_penalty_amount)}đ`],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {!detailRecord.calculation_details && detailRecord.notes && (
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#475569' }}>
                📝 {detailRecord.notes}
              </div>
            )}

            {!detailRecord.calculation_details && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: '#eff6ff', borderRadius: 12, marginBottom: 20 }}>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>GROSS</div><div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(detailRecord.gross_salary)}đ</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>THƯỞNG</div><div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>+{fmt(detailRecord.bonus)}đ</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>KHẤU TRỪ</div><div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>-{fmt(detailRecord.deductions)}đ</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>THỰC NHẬN</div><div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{fmt(detailRecord.net_salary)}đ</div></div>
              </div>
            )}

            {/* Adjustments list */}
            <h3 style={{ marginBottom: 8 }}>Khoản cộng/trừ ({detailAdjs.length})</h3>
            {detailAdjs.length > 0 && (
              <table style={{ marginBottom: 16 }}>
                <thead><tr><th>Loại</th><th>Tiêu đề</th><th>Số tiền</th><th>Ghi chú</th><th></th></tr></thead>
                <tbody>
                  {detailAdjs.map(a => (
                    <tr key={a.adjustment_id}>
                      <td>{ADJ_TYPES.find(t => t.value === a.type)?.label || a.type}</td>
                      <td>{a.title}</td>
                      <td style={{ fontWeight: 600, color: ['deduction','fine'].includes(a.type) ? '#ef4444' : '#059669' }}>
                        {['deduction','fine'].includes(a.type) ? '-' : '+'}{fmt(a.amount)}đ
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{a.note || '—'}</td>
                      <td>
                        {isEditable && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteAdj(a.adjustment_id)}>🗑</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Add adjustment form (only when editable) */}
            {isEditable && _canUpdate && (
              <form onSubmit={handleAddAdj} style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                <h4 style={{ marginBottom: 12 }}>➕ Thêm khoản cộng/trừ</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 8, marginBottom: 8 }}>
                  <select className="form-control" value={adjForm.type} onChange={e => setAdjForm({...adjForm, type: e.target.value})}>
                    {ADJ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input className="form-control" placeholder="Tiêu đề" required value={adjForm.title} onChange={e => setAdjForm({...adjForm, title: e.target.value})} />
                  <input className="form-control" placeholder="Số tiền" required value={adjForm.amount ? fmt(adjForm.amount) : ''}
                    onChange={e => { const n = parseInt(e.target.value.replace(/\D/g,''),10); setAdjForm({...adjForm, amount: isNaN(n) ? '' : n}); }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-control" placeholder="Ghi chú (tùy chọn)" style={{ flex: 1 }} value={adjForm.note} onChange={e => setAdjForm({...adjForm, note: e.target.value})} />
                  <button className="btn btn-primary" type="submit" disabled={savingAdj}>{savingAdj ? '...' : '💾 Lưu'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
