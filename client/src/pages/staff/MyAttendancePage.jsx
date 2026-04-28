import { useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiEdit2, FiLogIn, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-toastify';
import staffService from '../../services/staffService';

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
  incomplete: 'Đã chấm vào, chưa chấm ra'
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

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthStartString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
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

const formatMinutes = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

export default function MyAttendancePage() {
  const today = getTodayString();
  const monthStart = getMonthStartString();
  const [linkedError, setLinkedError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    from_date: monthStart,
    to_date: today
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    work_date: today,
    requested_check_in_at: '',
    requested_check_out_at: '',
    reason: ''
  });

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!linkedError) {
      loadHistoryAndAdjustments();
    }
  }, [historyFilters]);

  const loadAll = async () => {
    setLoading(true);
    setLinkedError('');
    try {
      const todayResponse = await staffService.getTodayAttendance();
      setTodayData(todayResponse);
      await loadHistoryAndAdjustments();
    } catch (error) {
      if (String(error.message || '').includes('liên kết nhân viên')) {
        setLinkedError(error.message);
      } else {
        toast.error(error.message || 'Không thể tải dữ liệu chấm công');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryAndAdjustments = async () => {
    try {
      const [attendanceData, adjustmentData] = await Promise.all([
        staffService.getMyAttendances({ ...historyFilters, limit: 20, page: 1 }),
        staffService.getMyAttendanceAdjustments({ ...historyFilters, limit: 20, page: 1 })
      ]);
      setAttendances(attendanceData.attendances || []);
      setAdjustments(adjustmentData.adjustments || []);
    } catch (error) {
      if (!String(error.message || '').includes('liên kết nhân viên')) {
        toast.error(error.message || 'Không thể tải lịch sử chấm công');
      }
    }
  };

  const reloadAfterAction = async () => {
    try {
      const todayResponse = await staffService.getTodayAttendance();
      setTodayData(todayResponse);
      await loadHistoryAndAdjustments();
    } catch (error) {
      toast.error(error.message || 'Không thể làm mới dữ liệu chấm công');
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const response = await staffService.checkIn({});
      toast.success(response.message || 'Đã chấm vào');
      await reloadAfterAction();
    } catch (error) {
      toast.error(error.message || 'Không thể chấm vào');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const response = await staffService.checkOut({});
      toast.success(response.message || 'Đã chấm ra');
      await reloadAfterAction();
    } catch (error) {
      toast.error(error.message || 'Không thể chấm ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitAdjustment = async (event) => {
    event.preventDefault();
    setSubmittingAdjustment(true);
    try {
      const payload = {
        work_date: adjustmentForm.work_date,
        requested_check_in_at: adjustmentForm.requested_check_in_at || null,
        requested_check_out_at: adjustmentForm.requested_check_out_at || null,
        reason: adjustmentForm.reason
      };
      await staffService.createAttendanceAdjustment(payload);
      toast.success('Đã gửi yêu cầu điều chỉnh công');
      setAdjustmentForm({
        work_date: today,
        requested_check_in_at: '',
        requested_check_out_at: '',
        reason: ''
      });
      await reloadAfterAction();
    } catch (error) {
      toast.error(error.message || 'Không thể gửi yêu cầu điều chỉnh công');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (linkedError) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Chấm công của tôi</h1>
            <p>Tài khoản chưa thể sử dụng chức năng chấm công tự phục vụ</p>
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <div className="card-body" style={{ color: '#92400e' }}>
            {linkedError}
          </div>
        </div>
      </div>
    );
  }

  const attendance = todayData?.attendance;
  const approvedLeave = todayData?.approved_leave;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Chấm công của tôi</h1>
          <p>Theo dõi trạng thái hôm nay và lịch sử công cá nhân</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><FiClock /></div>
          <div className="stat-content">
            <h4>Trạng thái hôm nay</h4>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {statusLabels[attendance?.status] || 'Chưa chấm công'}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiLogIn /></div>
          <div className="stat-content">
            <h4>Giờ vào</h4>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {attendance?.check_in_at ? toDisplayDateTime(attendance.check_in_at) : 'Chưa có'}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiLogOut /></div>
          <div className="stat-content">
            <h4>Giờ ra</h4>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {attendance?.check_out_at ? toDisplayDateTime(attendance.check_out_at) : 'Chưa có'}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiCheckCircle /></div>
          <div className="stat-content">
            <h4>Phút làm hôm nay</h4>
            <div className="stat-value">{formatMinutes(attendance?.work_minutes)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Trạng thái hôm nay</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ marginBottom: 10 }}>
                <strong>Ngày công:</strong> {toDisplayDate(todayData?.work_date)}
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>Trạng thái:</strong>{' '}
                <span className={`badge ${statusClasses[attendance?.status] || 'badge-info'}`}>
                  {statusLabels[attendance?.status] || 'Chưa chấm công'}
                </span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>Ca làm:</strong> {attendance?.shift_name || 'Ca mặc định'}
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>Đi trễ:</strong> {formatMinutes(attendance?.minutes_late)} phút
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>Về sớm:</strong> {formatMinutes(attendance?.minutes_early_leave)} phút
              </div>
              {approvedLeave ? (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8' }}>
                  Hôm nay bạn đang có nghỉ phép đã duyệt. Lý do: {approvedLeave.reason}
                </div>
              ) : null}
              {todayData?.is_period_locked && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b' }}>
                  ⚠️ Kỳ công tháng này đã chốt. Không thể chấm công hoặc điều chỉnh.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={handleCheckIn}
                disabled={actionLoading || !todayData?.can_check_in}
              >
                <FiLogIn /> Chấm vào
              </button>
              <button
                className="btn btn-outline"
                onClick={handleCheckOut}
                disabled={actionLoading || !todayData?.can_check_out}
              >
                <FiLogOut /> Chấm ra
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Lịch sử chấm công</h3>
        </div>
        <div className="card-body">
          <div className="toolbar" style={{ gap: 12, flexWrap: 'wrap' }}>
            <input
              className="form-control"
              type="date"
              value={historyFilters.from_date}
              onChange={(event) => setHistoryFilters({ ...historyFilters, from_date: event.target.value })}
            />
            <input
              className="form-control"
              type="date"
              value={historyFilters.to_date}
              onChange={(event) => setHistoryFilters({ ...historyFilters, to_date: event.target.value })}
            />
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ngày công</th>
                <th>Ca làm</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Phút làm</th>
                <th>Tăng ca</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {!attendances.length ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Chưa có lịch sử chấm công trong phạm vi đã chọn
                  </td>
                </tr>
              ) : null}
              {attendances.map((item) => (
                <tr key={item.attendance_id}>
                  <td>{toDisplayDate(item.work_date)}</td>
                  <td>{item.shift_name || 'Ca mặc định'}</td>
                  <td>{toDisplayDateTime(item.check_in_at)}</td>
                  <td>{toDisplayDateTime(item.check_out_at)}</td>
                  <td>{formatMinutes(item.work_minutes)}</td>
                  <td>{formatMinutes(item.overtime_minutes)}</td>
                  <td>
                    <span className={`badge ${statusClasses[item.status] || 'badge-info'}`}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Gửi yêu cầu điều chỉnh công</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmitAdjustment}>
            <div className="form-row">
              <div className="form-group">
                <label>Ngày công *</label>
                <input
                  className="form-control"
                  type="date"
                  value={adjustmentForm.work_date}
                  onChange={(event) => setAdjustmentForm({ ...adjustmentForm, work_date: event.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giờ vào đề nghị</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={toDateTimeInputValue(adjustmentForm.requested_check_in_at)}
                  onChange={(event) => setAdjustmentForm({ ...adjustmentForm, requested_check_in_at: event.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Giờ ra đề nghị</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={toDateTimeInputValue(adjustmentForm.requested_check_out_at)}
                  onChange={(event) => setAdjustmentForm({ ...adjustmentForm, requested_check_out_at: event.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Lý do điều chỉnh *</label>
              <textarea
                className="form-control"
                rows={4}
                value={adjustmentForm.reason}
                onChange={(event) => setAdjustmentForm({ ...adjustmentForm, reason: event.target.value })}
                placeholder="Ví dụ: Quên chấm công vì đi gặp khách, đã có xác nhận từ quản lý"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submittingAdjustment || todayData?.is_period_locked}>
                <FiEdit2 /> {submittingAdjustment ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Yêu cầu chỉnh công của tôi</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ngày công</th>
                <th>Giờ vào đề nghị</th>
                <th>Giờ ra đề nghị</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Người xử lý</th>
              </tr>
            </thead>
            <tbody>
              {!adjustments.length ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Chưa có yêu cầu điều chỉnh công nào
                  </td>
                </tr>
              ) : null}
              {adjustments.map((item) => (
                <tr key={item.request_id}>
                  <td>{toDisplayDate(item.work_date)}</td>
                  <td>{toDisplayDateTime(item.requested_check_in_at)}</td>
                  <td>{toDisplayDateTime(item.requested_check_out_at)}</td>
                  <td style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>
                    {item.reason}
                    {item.status === 'rejected' && item.reject_reason ? (
                      <div style={{ color: '#dc2626', marginTop: 6, fontSize: 12 }}>
                        Lý do từ chối: {item.reject_reason}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className={`badge ${adjustmentStatusClasses[item.status] || 'badge-info'}`}>
                      {adjustmentStatusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td>{item.reviewed_by_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
