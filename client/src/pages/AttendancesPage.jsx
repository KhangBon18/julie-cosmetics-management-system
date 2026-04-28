import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiCheck,
  FiClock,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiTrendingUp,
  FiUserCheck,
  FiUserX,
  FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { attendanceService, employeeService, payrollService } from '../services/dataService';
import usePermission from '../hooks/usePermission';

const statusLabels = {
  present: 'Đủ công',
  late: 'Đi trễ',
  early_leave: 'Về sớm',
  late_and_early: 'Trễ & về sớm',
  absent: 'Vắng',
  half_day: 'Nửa ngày',
  leave: 'Nghỉ phép',
  holiday: 'Ngày nghỉ',
  pending: 'Chờ công',
  incomplete: 'Chưa chấm ra'
};

const statusClasses = {
  present: 'badge-success',
  late: 'badge-warning',
  early_leave: 'badge-warning',
  late_and_early: 'badge-warning',
  absent: 'badge-danger',
  half_day: 'badge-info',
  leave: 'badge-info',
  holiday: 'badge-info',
  pending: 'badge-warning',
  incomplete: 'badge-warning'
};

const adjustmentStatusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối'
};

const adjustmentStatusClasses = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger'
};

const manualStatusOptions = [
  { value: 'pending', label: 'Chờ công' },
  { value: 'absent', label: 'Vắng' },
  { value: 'leave', label: 'Nghỉ phép' },
  { value: 'holiday', label: 'Ngày nghỉ' }
];

const formatMinutes = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const getApiErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
  if (error?.errors?.length) {
    return error.errors.map((item) => item.msg).join('; ');
  }
  return error?.message || fallback;
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateTimeInputValue = (value) => {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
};

const toDisplayDate = (value) => {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
};

const toDisplayDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? value
    : `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const createDefaultForm = (fallbackDate = getTodayString()) => ({
  employee_id: '',
  work_date: fallbackDate,
  check_in_at: '',
  check_out_at: '',
  status: 'pending',
  note: ''
});

export default function AttendancesPage() {
  const today = getTodayString();
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employee_id: '',
    from_date: today,
    to_date: today,
    status: ''
  });
  const [attendances, setAttendances] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [form, setForm] = useState(createDefaultForm(today));
  const [submitting, setSubmitting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingAdjustmentId, setProcessingAdjustmentId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [attPeriod, setAttPeriod] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);

  const { canCreate, canUpdate, canDelete, canExport } = usePermission();
  const canCreateAttendance = canCreate('attendances');
  const canUpdateAttendance = canUpdate('attendances');
  const canDeleteAttendance = canDelete('attendances');
  const canExportAttendance = canExport('attendances');

  useEffect(() => {
    loadEmployees();
    loadAttPeriod();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll({ limit: 200, status: 'active' });
      setEmployees(data.employees || []);
    } catch (error) {
      toast.error(error.message || 'Không thể tải danh sách nhân viên');
    }
  };

  const loadAttPeriod = async () => {
    try {
      const data = await payrollService.getAttendancePeriods();
      const now = new Date();
      const curMonth = now.getMonth() + 1;
      const curYear = now.getFullYear();
      const current = (data.periods || []).find(p => p.month === curMonth && p.year === curYear);
      setAttPeriod(current || null);
    } catch { /* ignore */ }
  };

  const handleCreateAttPeriod = async () => {
    setPeriodLoading(true);
    try {
      const now = new Date();
      await payrollService.createAttendancePeriod({ month: now.getMonth() + 1, year: now.getFullYear() });
      toast.success('Tạo kỳ công thành công');
      await loadAttPeriod();
    } catch (e) { toast.error(e.message); }
    finally { setPeriodLoading(false); }
  };

  const handleLockPeriod = async () => {
    if (!attPeriod || !window.confirm(`Chốt công tháng ${attPeriod.month}/${attPeriod.year}? Sau khi chốt sẽ không thể sửa/xóa/tạo công.`)) return;
    setPeriodLoading(true);
    try {
      await payrollService.lockAttendancePeriod(attPeriod.period_id);
      toast.success('Đã chốt kỳ công');
      await loadAttPeriod();
    } catch (e) { toast.error(e.message); }
    finally { setPeriodLoading(false); }
  };

  const handleUnlockPeriod = async () => {
    if (!attPeriod || !window.confirm('Mở chốt kỳ công?')) return;
    setPeriodLoading(true);
    try {
      await payrollService.unlockAttendancePeriod(attPeriod.period_id);
      toast.success('Đã mở chốt kỳ công');
      await loadAttPeriod();
    } catch (e) { toast.error(e.message); }
    finally { setPeriodLoading(false); }
  };

  const isPeriodLocked = attPeriod?.status === 'locked';

  const loadData = async () => {
    setLoading(true);
    try {
      const [attendanceData, summaryData, adjustmentData] = await Promise.all([
        attendanceService.getAll(filters),
        attendanceService.getSummary(filters),
        attendanceService.getAdjustments({ ...filters, limit: 20, page: 1 })
      ]);
      setAttendances(attendanceData.attendances || []);
      setTotal(attendanceData.total || 0);
      setSummary(summaryData.summary || null);
      setAdjustments(adjustmentData.adjustments || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải dữ liệu chấm công'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAttendance(null);
    setForm(createDefaultForm(filters.from_date && filters.from_date === filters.to_date ? filters.from_date : today));
    setShowModal(true);
  };

  const openEditModal = (attendance) => {
    setEditingAttendance(attendance);
    setForm({
      employee_id: String(attendance.employee_id || ''),
      work_date: attendance.work_date || today,
      check_in_at: toDateTimeInputValue(attendance.check_in_at),
      check_out_at: toDateTimeInputValue(attendance.check_out_at),
      status: manualStatusOptions.some((option) => option.value === attendance.status) ? attendance.status : 'pending',
      note: attendance.note || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAttendance(null);
    setForm(createDefaultForm(today));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        employee_id: Number(form.employee_id),
        work_date: form.work_date,
        check_in_at: form.check_in_at || null,
        check_out_at: form.check_out_at || null,
        status: form.status || 'pending',
        note: form.note || null
      };

      if (editingAttendance) {
        await attendanceService.update(editingAttendance.attendance_id, payload);
        toast.success('Cập nhật chấm công thành công');
      } else {
        await attendanceService.manual(payload);
        toast.success('Tạo chấm công thủ công thành công');
      }

      closeModal();
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu chấm công'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (attendance) => {
    if (!window.confirm(`Xóa bản ghi chấm công của ${attendance.employee_name} ngày ${attendance.work_date}?`)) {
      return;
    }
    try {
      await attendanceService.delete(attendance.attendance_id);
      toast.success('Đã xóa bản ghi chấm công');
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xóa bản ghi chấm công'));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await attendanceService.export(filters);
      toast.success('Đã xuất CSV chấm công');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xuất CSV'));
    } finally {
      setExporting(false);
    }
  };

  const handleApproveAdjustment = async (requestId) => {
    setProcessingAdjustmentId(requestId);
    try {
      await attendanceService.approveAdjustment(requestId);
      toast.success('Đã duyệt yêu cầu điều chỉnh');
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể duyệt yêu cầu điều chỉnh'));
    } finally {
      setProcessingAdjustmentId(null);
    }
  };

  const handleRejectAdjustment = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setProcessingAdjustmentId(rejectTarget.request_id);
    try {
      await attendanceService.rejectAdjustment(rejectTarget.request_id, { reject_reason: rejectReason.trim() });
      toast.success('Đã từ chối yêu cầu điều chỉnh');
      setRejectTarget(null);
      setRejectReason('');
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể từ chối yêu cầu điều chỉnh'));
    } finally {
      setProcessingAdjustmentId(null);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      employee_id: '',
      from_date: today,
      to_date: today,
      status: ''
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Chấm công</h1>
          <p>{total} bản ghi trong phạm vi lọc hiện tại</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canExportAttendance && (
            <button className="btn btn-outline" onClick={handleExport} disabled={exporting}>
              <FiDownload /> {exporting ? 'Đang xuất...' : 'Xuất CSV'}
            </button>
          )}
          {canCreateAttendance && (
            <button className="btn btn-primary" onClick={openCreateModal} disabled={isPeriodLocked}>
              <FiPlus /> Tạo chấm công
            </button>
          )}
        </div>
      </div>

      {/* Attendance Period Status */}
      <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid ${isPeriodLocked ? '#dc2626' : '#0ea5e9'}` }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>Kỳ công tháng {new Date().getMonth()+1}/{new Date().getFullYear()}: </strong>
            {!attPeriod ? (
              <span style={{ color: '#94a3b8' }}>Chưa tạo</span>
            ) : isPeriodLocked ? (
              <span style={{ color: '#dc2626', fontWeight: 700 }}>🔒 Đã chốt{attPeriod.locked_by_name ? ` bởi ${attPeriod.locked_by_name}` : ''}</span>
            ) : (
              <span style={{ color: '#0ea5e9', fontWeight: 600 }}>🔓 Đang mở</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!attPeriod && canCreateAttendance && (
              <button className="btn btn-sm btn-primary" onClick={handleCreateAttPeriod} disabled={periodLoading}>
                ➕ Tạo kỳ công
              </button>
            )}
            {attPeriod && !isPeriodLocked && canUpdateAttendance && (
              <button className="btn btn-sm btn-outline" style={{ borderColor: '#dc2626', color: '#dc2626' }} onClick={handleLockPeriod} disabled={periodLoading}>
                🔒 Chốt công
              </button>
            )}
            {attPeriod && isPeriodLocked && canUpdateAttendance && (
              <button className="btn btn-sm btn-outline" onClick={handleUnlockPeriod} disabled={periodLoading}>
                🔓 Mở chốt
              </button>
            )}
          </div>
        </div>
        {isPeriodLocked && (
          <div style={{ padding: '8px 16px', background: '#fee2e2', color: '#991b1b', fontSize: 13, borderTop: '1px solid #fca5a5' }}>
            ⚠️ Kỳ công đã chốt, không thể tạo/sửa/xóa bản ghi chấm công trực tiếp.
          </div>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><FiUserCheck /></div>
          <div className="stat-content">
            <h4>Tổng nhân viên có công</h4>
            <div className="stat-value">{summary?.total_employees_with_attendance || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiClock /></div>
          <div className="stat-content">
            <h4>Tổng đi trễ</h4>
            <div className="stat-value">{summary?.total_late || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink"><FiUserX /></div>
          <div className="stat-content">
            <h4>Tổng vắng</h4>
            <div className="stat-value">{summary?.total_absent || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiActivity /></div>
          <div className="stat-content">
            <h4>Tổng phút làm</h4>
            <div className="stat-value">{formatMinutes(summary?.total_work_minutes)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiTrendingUp /></div>
          <div className="stat-content">
            <h4>Tổng tăng ca</h4>
            <div className="stat-value">{formatMinutes(summary?.total_overtime_minutes)}</div>
          </div>
        </div>
      </div>

      {summary?.inferred_absent ? (
        <div className="card" style={{ marginBottom: 20, background: '#fff7ed', color: '#9a3412' }}>
          <div className="card-body">
            Tổng vắng đang được suy luận theo ngày đã chọn, vì hệ thống không tạo hàng loạt bản ghi `absent` tự động nếu chưa có sự kiện chấm công.
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="toolbar" style={{ gap: 12, flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ minWidth: 220 }}
              value={filters.employee_id}
              onChange={(event) => setFilters({ ...filters, employee_id: event.target.value })}
            >
              <option value="">Tất cả nhân viên</option>
              {employees.map((employee) => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
            <input
              className="form-control"
              type="date"
              value={filters.from_date}
              onChange={(event) => setFilters({ ...filters, from_date: event.target.value })}
            />
            <input
              className="form-control"
              type="date"
              value={filters.to_date}
              onChange={(event) => setFilters({ ...filters, to_date: event.target.value })}
            />
            <select
              className="form-control"
              style={{ minWidth: 180 }}
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button className="btn btn-outline" onClick={handleResetFilters}>
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Danh sách chấm công</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Ngày công</th>
                <th>Ca làm</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Đi trễ</th>
                <th>Về sớm</th>
                <th>Phút làm</th>
                <th>Tăng ca</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                {(canUpdateAttendance || canDeleteAttendance) && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {!loading && !attendances.length ? (
                <tr>
                  <td colSpan={canUpdateAttendance || canDeleteAttendance ? 12 : 11} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Chưa có bản ghi chấm công phù hợp bộ lọc
                  </td>
                </tr>
              ) : null}
              {attendances.map((attendance) => (
                <tr key={attendance.attendance_id}>
                  <td style={{ fontWeight: 600 }}>{attendance.employee_name}</td>
                  <td>{toDisplayDate(attendance.work_date)}</td>
                  <td>{attendance.shift_name || attendance.shift_code || 'Ca mặc định'}</td>
                  <td>{toDisplayDateTime(attendance.check_in_at)}</td>
                  <td>{toDisplayDateTime(attendance.check_out_at)}</td>
                  <td>{formatMinutes(attendance.minutes_late)}</td>
                  <td>{formatMinutes(attendance.minutes_early_leave)}</td>
                  <td>{formatMinutes(attendance.work_minutes)}</td>
                  <td>{formatMinutes(attendance.overtime_minutes)}</td>
                  <td>
                    <span className={`badge ${statusClasses[attendance.status] || 'badge-info'}`}>
                      {statusLabels[attendance.status] || attendance.status}
                    </span>
                  </td>
                  <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{attendance.note || '—'}</td>
                  {(canUpdateAttendance || canDeleteAttendance) && (
                    <td>
                      {canUpdateAttendance && (
                        <button className="btn btn-sm btn-outline" onClick={() => openEditModal(attendance)} title="Chỉnh sửa" disabled={isPeriodLocked}>
                          <FiEdit2 />
                        </button>
                      )}{' '}
                      {canDeleteAttendance && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(attendance)} title="Xóa" disabled={isPeriodLocked}>
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Yêu cầu điều chỉnh công</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Ngày công</th>
                <th>Giờ vào đề nghị</th>
                <th>Giờ ra đề nghị</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Xử lý bởi</th>
                {canUpdateAttendance && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {!loading && !adjustments.length ? (
                <tr>
                  <td colSpan={canUpdateAttendance ? 8 : 7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Chưa có yêu cầu điều chỉnh công
                  </td>
                </tr>
              ) : null}
              {adjustments.map((adjustment) => (
                <tr key={adjustment.request_id}>
                  <td style={{ fontWeight: 600 }}>{adjustment.employee_name}</td>
                  <td>{toDisplayDate(adjustment.work_date)}</td>
                  <td>{toDisplayDateTime(adjustment.requested_check_in_at)}</td>
                  <td>{toDisplayDateTime(adjustment.requested_check_out_at)}</td>
                  <td style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>
                    {adjustment.reason}
                    {adjustment.status === 'rejected' && adjustment.reject_reason ? (
                      <div style={{ color: '#dc2626', marginTop: 6, fontSize: 12 }}>
                        Lý do từ chối: {adjustment.reject_reason}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className={`badge ${adjustmentStatusClasses[adjustment.status] || 'badge-info'}`}>
                      {adjustmentStatusLabels[adjustment.status] || adjustment.status}
                    </span>
                  </td>
                  <td>{adjustment.reviewed_by_name || '—'}</td>
                  {canUpdateAttendance && (
                    <td>
                      {adjustment.status === 'pending' ? (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApproveAdjustment(adjustment.request_id)}
                            disabled={processingAdjustmentId === adjustment.request_id}
                            title="Duyệt"
                          >
                            <FiCheck />
                          </button>{' '}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              setRejectTarget(adjustment);
                              setRejectReason('');
                            }}
                            disabled={processingAdjustmentId === adjustment.request_id}
                            title="Từ chối"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>{editingAttendance ? 'Chỉnh sửa chấm công' : 'Tạo chấm công thủ công'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nhân viên *</label>
                    <select
                      className="form-control"
                      value={form.employee_id}
                      onChange={(event) => setForm({ ...form, employee_id: event.target.value })}
                      required
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map((employee) => (
                        <option key={employee.employee_id} value={employee.employee_id}>
                          {employee.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ngày công *</label>
                    <input
                      className="form-control"
                      type="date"
                      value={form.work_date}
                      onChange={(event) => setForm({ ...form, work_date: event.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ vào</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      value={form.check_in_at}
                      onChange={(event) => setForm({ ...form, check_in_at: event.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ ra</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      value={form.check_out_at}
                      onChange={(event) => setForm({ ...form, check_out_at: event.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Trạng thái thủ công khi không có giờ vào/ra</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                  >
                    {manualStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
                    Nếu nhập đủ giờ vào và giờ ra, hệ thống sẽ tự tính trạng thái thực tế và bỏ qua lựa chọn thủ công này.
                  </div>
                </div>
                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={form.note}
                    onChange={(event) => setForm({ ...form, note: event.target.value })}
                    placeholder="Ví dụ: Quên chấm vân tay, cập nhật theo xác nhận của quản lý"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : editingAttendance ? 'Cập nhật' : 'Lưu chấm công'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>Từ chối yêu cầu điều chỉnh</h3>
              <button className="modal-close" onClick={() => setRejectTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', marginTop: 0 }}>
                {rejectTarget.employee_name} - {toDisplayDate(rejectTarget.work_date)}
              </p>
              <div className="form-group">
                <label>Lý do từ chối *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Nhập lý do từ chối để lưu vào hồ sơ xét duyệt"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setRejectTarget(null)}>Hủy</button>
                <button type="button" className="btn btn-danger" onClick={handleRejectAdjustment}>
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
