import { useEffect, useMemo, useState } from 'react';
import { employeeService, salaryService } from '../services/dataService';
import { toast } from 'react-toastify';
import api from '../services/api';
import usePermission from '../hooks/usePermission';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);
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
          .note.bonus{color:#059669}
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

const normalizeNote = (value) => String(value || '').trim();

const getSupplementalNotes = (salary) => {
  const notes = [];
  const mainNote = normalizeNote(salary.notes);
  const bonusReason = normalizeNote(salary.bonus_reason);

  if (mainNote) {
    notes.push({ text: mainNote, tone: 'default' });
  }
  if (bonusReason && bonusReason !== mainNote) {
    notes.push({ text: `Thưởng: ${bonusReason}`, tone: 'bonus' });
  }

  return notes;
};

export default function SalariesPage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [salaries, setSalaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(String(currentYear));
  const [generating, setGenerating] = useState(false);
  const [genMonth, setGenMonth] = useState(currentMonth);
  const [genYear, setGenYear] = useState(currentYear);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showBonusManager, setShowBonusManager] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [loadingBonuses, setLoadingBonuses] = useState(false);
  const [savingBonus, setSavingBonus] = useState(false);
  const [bonusFeatureEnabled, setBonusFeatureEnabled] = useState(true);
  const [bonusMonth, setBonusMonth] = useState(currentMonth);
  const [bonusYear, setBonusYear] = useState(currentYear);
  const [editingBonusId, setEditingBonusId] = useState(null);
  const [bonusForm, setBonusForm] = useState({
    employee_id: '',
    month: currentMonth,
    year: currentYear,
    amount: '',
    reason: ''
  });

  const { canCreate, canExport, canUpdate, canDelete } = usePermission();
  const _canCreate = canCreate('salaries');
  const _canExport = canExport('salaries');
  const canManageBonus = _canCreate || canUpdate('salaries');
  const canRemoveBonus = canDelete('salaries') || canUpdate('salaries');

  useEffect(() => { loadData(); }, [month, year]);
  useEffect(() => {
    if (canManageBonus) {
      loadEmployees();
    }
  }, [canManageBonus]);
  useEffect(() => {
    if (canManageBonus) {
      loadBonuses();
    }
  }, [bonusMonth, bonusYear, canManageBonus]);

  const loadData = async () => {
    try {
      const d = await salaryService.getAll({ limit: 50, month: month || undefined, year: year || undefined });
      setSalaries(d.salaries || []);
      setTotal(d.total || 0);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll({ limit: 200, status: 'active' });
      setEmployees(data.employees || []);
    } catch (error) {
      toast.error(error.message || 'Không thể tải danh sách nhân viên');
    }
  };

  const loadBonuses = async (filters = {}) => {
    const targetMonth = filters.month || bonusMonth;
    const targetYear = filters.year || bonusYear;
    try {
      setLoadingBonuses(true);
      const data = await salaryService.getBonuses({ month: targetMonth, year: targetYear });
      setBonusFeatureEnabled(data.bonus_feature_enabled !== false);
      setBonuses(data.bonuses || []);
    } catch (error) {
      toast.error(error.message || 'Không thể tải danh sách thưởng');
    } finally {
      setLoadingBonuses(false);
    }
  };

  const resetBonusForm = (nextMonth = bonusMonth, nextYear = bonusYear) => {
    setEditingBonusId(null);
    setBonusForm({
      employee_id: '',
      month: nextMonth,
      year: nextYear,
      amount: '',
      reason: ''
    });
  };

  const handleToggleBonusManager = () => {
    if (!bonusFeatureEnabled) return;
    const nextMonth = Number(month || genMonth || currentMonth);
    const nextYear = Number(year || genYear || currentYear);
    setBonusMonth(nextMonth);
    setBonusYear(nextYear);
    resetBonusForm(nextMonth, nextYear);
    setShowBonusManager(value => !value);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await api.post('/salaries/generate', { month: genMonth, year: genYear });
      toast.success(result.message);
      setShowGenerate(false);
      setMonth(String(genMonth));
      setYear(String(genYear));
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi tạo bảng lương');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveBonus = async (event) => {
    event.preventDefault();
    setSavingBonus(true);
    try {
      const targetMonth = Number(bonusForm.month);
      const targetYear = Number(bonusForm.year);
      await salaryService.upsertBonus({
        employee_id: Number(bonusForm.employee_id),
        month: targetMonth,
        year: targetYear,
        amount: Number(bonusForm.amount || 0),
        reason: bonusForm.reason
      });
      toast.success(editingBonusId ? 'Đã cập nhật thưởng kỳ lương' : 'Đã lưu thưởng kỳ lương');
      resetBonusForm(targetMonth, targetYear);
      setBonusMonth(targetMonth);
      setBonusYear(targetYear);
      await Promise.all([loadBonuses({ month: targetMonth, year: targetYear }), loadData()]);
    } catch (error) {
      toast.error(error.message || 'Không thể lưu cấu hình thưởng');
    } finally {
      setSavingBonus(false);
    }
  };

  const handleEditBonus = (bonus) => {
    setEditingBonusId(bonus.bonus_id);
    setBonusMonth(Number(bonus.month));
    setBonusYear(Number(bonus.year));
    setBonusForm({
      employee_id: String(bonus.employee_id),
      month: Number(bonus.month),
      year: Number(bonus.year),
      amount: Number(bonus.amount || 0),
      reason: bonus.reason || ''
    });
    if (!showBonusManager) setShowBonusManager(true);
  };

  const handleDeleteBonus = async (bonus) => {
    if (!window.confirm(`Xóa thưởng của ${bonus.employee_name} cho kỳ ${bonus.month}/${bonus.year}?`)) {
      return;
    }

    try {
      await salaryService.deleteBonus(bonus.bonus_id);
      toast.success('Đã xóa thưởng kỳ lương');
      if (editingBonusId === bonus.bonus_id) {
        resetBonusForm();
      }
      await Promise.all([loadBonuses(), loadData()]);
    } catch (error) {
      toast.error(error.message || 'Không thể xóa thưởng');
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

  const renderSalaryRows = (rows, startIndex = 1) => rows.map((salary, index) => {
    const notes = getSupplementalNotes(salary).map(note => (
      `<div class="note${note.tone === 'bonus' ? ' bonus' : ''}">${note.text}</div>`
    )).join('');

    return `
      <tr>
        <td class="text-center">${startIndex + index}</td>
        <td class="text-left">
          <div style="font-weight:700">${salary.employee_name}</div>
          ${notes}
        </td>
        <td class="text-center">${salary.month}/${salary.year}</td>
        <td class="text-center">${salary.work_days_actual}/${salary.work_days_standard}</td>
        <td>${fmt(salary.base_salary)}đ</td>
        <td>${fmt(salary.gross_salary)}đ</td>
        <td>${salary.bonus > 0 ? `+${fmt(salary.bonus)}đ` : '—'}</td>
        <td>${salary.deductions > 0 ? `-${fmt(salary.deductions)}đ` : '—'}</td>
        <td style="font-weight:700;color:#2563eb">${fmt(salary.net_salary)}đ</td>
      </tr>
    `;
  }).join('');

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

  const bonusSummary = useMemo(() => ({
    totalAmount: bonuses.reduce((sum, bonus) => sum + Number(bonus.amount || 0), 0),
    employeeCount: bonuses.length
  }), [bonuses]);

  const salarySummary = useMemo(() => ({
    totalNet: salaries.reduce((sum, row) => sum + Number(row.net_salary || 0), 0),
    totalBonus: salaries.reduce((sum, row) => sum + Number(row.bonus || 0), 0)
  }), [salaries]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng lương</h1>
          <p>{total} bản ghi • Tổng thưởng hiển thị: <strong style={{ color: '#059669' }}>{fmt(salarySummary.totalBonus)}đ</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canManageBonus && bonusFeatureEnabled && (
            <button className="btn btn-outline" onClick={handleToggleBonusManager}>
              {showBonusManager ? '✕ Đóng thưởng kỳ lương' : '🎁 Quản lý thưởng'}
            </button>
          )}
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

      {(_canExport && salaries.length > 0) ? (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #0ea5e9', background: '#eff6ff' }}>
          <div className="card-body" style={{ color: '#0f172a' }}>
            Khi in bảng lương theo tháng hoặc năm, hãy cho phép <strong>popup / pop-up windows</strong> cho trình duyệt. Nếu popup bị chặn, hệ thống sẽ báo lỗi mềm để tránh fail demo.
          </div>
        </div>
      ) : null}

      {canManageBonus && !bonusFeatureEnabled ? (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <div className="card-body" style={{ color: '#92400e' }}>
            Chức năng thưởng đang tạm ẩn vì CSDL demo chưa chạy migration bonus mới nhất. Các flow lương cơ bản vẫn hoạt động; nếu cần demo thưởng, hãy chạy migration `032_create_salary_bonus_adjustments.sql` trước.
          </div>
        </div>
      ) : null}

      {showBonusManager && canManageBonus && bonusFeatureEnabled && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #059669' }}>
          <div className="card-header">
            <h3>🎁 Quản lý thưởng theo kỳ lương</h3>
          </div>
          <div className="card-body">
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              Quản lý nhân sự cấu hình thưởng theo nhân viên/tháng/năm, lưu lý do thưởng và hệ thống sẽ tự đồng bộ vào bảng lương đã phát sinh. Khi bấm tính lương, các thưởng của kỳ tương ứng sẽ được áp dụng tự động.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 20 }}>
              <form onSubmit={handleSaveBonus} className="card" style={{ margin: 0 }}>
                <div className="card-header">
                  <h3>{editingBonusId ? 'Cập nhật thưởng' : 'Tạo thưởng kỳ lương'}</h3>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label>Nhân viên</label>
                    <select
                      className="form-control"
                      required
                      value={bonusForm.employee_id}
                      onChange={event => setBonusForm({ ...bonusForm, employee_id: event.target.value })}
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map(employee => (
                        <option key={employee.employee_id} value={employee.employee_id}>
                          {employee.full_name} {employee.position_name ? `• ${employee.position_name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tháng</label>
                      <select
                        className="form-control"
                        value={bonusForm.month}
                        onChange={event => setBonusForm({ ...bonusForm, month: Number(event.target.value) })}
                      >
                        {[...Array(12)].map((_, index) => (
                          <option key={index + 1} value={index + 1}>Tháng {index + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Năm</label>
                      <select
                        className="form-control"
                        value={bonusForm.year}
                        onChange={event => setBonusForm({ ...bonusForm, year: Number(event.target.value) })}
                      >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Số tiền thưởng</label>
                    <input
                      className="form-control input-number"
                      type="text"
                      required
                      value={bonusForm.amount ? fmt(bonusForm.amount) : ''}
                      onChange={event => {
                        const num = parseInt(event.target.value.replace(/\D/g, ''), 10);
                        setBonusForm({ ...bonusForm, amount: isNaN(num) ? '' : num });
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Lý do thưởng</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      required
                      value={bonusForm.reason}
                      onChange={event => setBonusForm({ ...bonusForm, reason: event.target.value })}
                      placeholder="Ví dụ: Thưởng doanh số vượt chỉ tiêu quý 1"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" type="submit" disabled={savingBonus}>
                      {savingBonus ? 'Đang lưu...' : editingBonusId ? '💾 Lưu cập nhật' : '➕ Lưu thưởng'}
                    </button>
                    {editingBonusId ? (
                      <button className="btn btn-outline" type="button" onClick={() => resetBonusForm()}>
                        Hủy chỉnh sửa
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>

              <div className="card" style={{ margin: 0 }}>
                <div className="card-header">
                  <h3>Thưởng đã cấu hình kỳ {bonusMonth}/{bonusYear}</h3>
                </div>
                <div className="card-body">
                  <div className="stats-grid" style={{ marginBottom: 16 }}>
                    <div className="stat-card">
                      <div className="stat-icon green">🎁</div>
                      <div className="stat-content">
                        <h4>Tổng thưởng kỳ</h4>
                        <div className="stat-value">{fmt(bonusSummary.totalAmount)}đ</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon blue">👥</div>
                      <div className="stat-content">
                        <h4>Số nhân viên được thưởng</h4>
                        <div className="stat-value">{bonusSummary.employeeCount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="toolbar" style={{ marginBottom: 12 }}>
                    <select className="form-control" style={{ width: 130 }} value={bonusMonth} onChange={event => setBonusMonth(Number(event.target.value))}>
                      {[...Array(12)].map((_, index) => <option key={index + 1} value={index + 1}>Tháng {index + 1}</option>)}
                    </select>
                    <select className="form-control" style={{ width: 100 }} value={bonusYear} onChange={event => setBonusYear(Number(event.target.value))}>
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Nhân viên</th>
                          <th>Kỳ</th>
                          <th>Thưởng</th>
                          <th>Lý do</th>
                          <th>Cập nhật</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingBonuses ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28 }}>Đang tải dữ liệu thưởng...</td></tr>
                        ) : bonuses.length ? bonuses.map(bonus => (
                          <tr key={bonus.bonus_id}>
                            <td style={{ fontWeight: 600 }}>{bonus.employee_name}</td>
                            <td>{bonus.month}/{bonus.year}</td>
                            <td style={{ color: '#059669', fontWeight: 700 }}>+{fmt(bonus.amount)}đ</td>
                            <td style={{ minWidth: 220, textAlign: 'left' }}>{bonus.reason}</td>
                            <td>{new Date(bonus.updated_at || bonus.created_at).toLocaleString('vi-VN')}</td>
                            <td>
                              <button className="btn btn-sm btn-outline" onClick={() => handleEditBonus(bonus)}>✏️</button>{' '}
                              {canRemoveBonus ? <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBonus(bonus)}>🗑️</button> : null}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>Chưa có thưởng nào cho kỳ này</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerate && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
          <div className="card-header"><h3>⚡ Tính lương tự động cho tất cả nhân viên</h3></div>
          <div className="card-body">
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              Hệ thống sẽ tự động tính lương cho tất cả nhân viên đang hoạt động dựa trên: lịch sử chức vụ theo ngày hiệu lực, ngày công chuẩn trong cấu hình hệ thống, số ngày nghỉ không lương đã duyệt trong tháng và các khoản thưởng đã được HR cấu hình cho đúng kỳ lương. Nếu đổi chức vụ giữa tháng, lương sẽ được prorate theo từng giai đoạn chức vụ.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group">
                <label>Tháng</label>
                <select className="form-control" value={genMonth} onChange={e => setGenMonth(parseInt(e.target.value, 10))}>
                  {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Năm</label>
                <select className="form-control" value={genYear} onChange={e => setGenYear(parseInt(e.target.value, 10))}>
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
            <span style={{ color: '#64748b', fontSize: 14 }}>
              Tổng thực nhận: <strong style={{ color: '#2563eb' }}>{fmt(salarySummary.totalNet)}đ</strong>
            </span>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Nhân viên</th><th>Tháng/Năm</th><th>Ngày công</th><th>Lương CB</th><th>Lương thực</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th></tr></thead>
            <tbody>
              {salaries.map(salary => (
                <tr key={salary.salary_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{salary.employee_name}</div>
                    {getSupplementalNotes(salary).map(note => (
                      <div
                        key={`${salary.salary_id}-${note.tone}-${note.text}`}
                        style={{
                          fontSize: 12,
                          color: note.tone === 'bonus' ? '#059669' : '#64748b',
                          marginTop: 4
                        }}
                      >
                        {note.text}
                      </div>
                    ))}
                  </td>
                  <td>{salary.month}/{salary.year}</td>
                  <td>{salary.work_days_actual}/{salary.work_days_standard}</td>
                  <td>{fmt(salary.base_salary)}đ</td>
                  <td>{fmt(salary.gross_salary)}đ</td>
                  <td style={{ color: '#059669' }}>{salary.bonus > 0 ? `+${fmt(salary.bonus)}đ` : '—'}</td>
                  <td style={{ color: '#ef4444' }}>{salary.deductions > 0 ? `-${fmt(salary.deductions)}đ` : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{fmt(salary.net_salary)}đ</td>
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
