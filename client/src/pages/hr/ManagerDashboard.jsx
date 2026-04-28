import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiDollarSign, FiFileText, FiUsers } from 'react-icons/fi';
import { employeeService, leaveService, salaryService } from '../../services/dataService';
import api from '../../services/api';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(n || 0));
const leaveTypeLabel = {
  annual: 'Phép năm',
  sick: 'Ốm đau',
  maternity: 'Thai sản',
  unpaid: 'Không lương',
  resignation: 'Nghỉ việc',
};

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employeeTotal: 0,
    pendingLeaveTotal: 0,
    payrollRows: 0,
    totalBonus: 0,
  });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [hrReport, setHrReport] = useState(null);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [employees, pendingLeaveData, salaryData, bonusData, hrData] = await Promise.all([
          employeeService.getAll({ limit: 1 }),
          leaveService.getAll({ limit: 5, status: 'pending' }),
          salaryService.getAll({ limit: 100, month: currentMonth, year: currentYear }).catch(() => ({ salaries: [] })),
          salaryService.getBonuses({ month: currentMonth, year: currentYear }).catch(() => ({ bonuses: [], bonus_feature_enabled: true })),
          api.get('/reports/hr', { params: { year: currentYear } }).catch(() => null),
        ]);

        const payrollRows = salaryData?.salaries || [];
        const bonuses = bonusData?.bonuses || [];

        setStats({
          employeeTotal: employees?.total || 0,
          pendingLeaveTotal: pendingLeaveData?.total || 0,
          payrollRows: payrollRows.length,
          totalBonus: bonuses.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        });
        setPendingLeaves(pendingLeaveData?.leaves || []);
        setHrReport(hrData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMonth, currentYear]);

  const monthlySalaryTotal = useMemo(() => {
    return (hrReport?.salary_monthly || []).find(item => Number(item.month) === currentMonth)?.total_salary || 0;
  }, [hrReport, currentMonth]);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard quản lý</h1>
          <p>Tổng quan nhanh về nhân sự, nghỉ phép và bảng lương kỳ hiện tại</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FiUsers /></div>
          <div className="stat-content">
            <h4>Nhân sự đang quản lý</h4>
            <div className="stat-value">{stats.employeeTotal}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiCalendar /></div>
          <div className="stat-content">
            <h4>Đơn chờ duyệt</h4>
            <div className="stat-value">{stats.pendingLeaveTotal}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiFileText /></div>
          <div className="stat-content">
            <h4>Dòng lương tháng {currentMonth}/{currentYear}</h4>
            <div className="stat-value">{stats.payrollRows}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiDollarSign /></div>
          <div className="stat-content">
            <h4>Tổng thưởng kỳ hiện tại</h4>
            <div className="stat-value">{fmt(stats.totalBonus)}đ</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3>Đơn nghỉ phép chờ duyệt</h3>
              <Link to="/hr/leaves" className="view-all-link">Mở màn duyệt</Link>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Loại đơn</th>
                    <th>Khoảng thời gian</th>
                    <th>Số ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.map(leave => (
                    <tr key={leave.request_id}>
                      <td style={{ fontWeight: 600 }}>{leave.employee_name}</td>
                      <td>{leaveTypeLabel[leave.leave_type] || leave.leave_type}</td>
                      <td>
                        {new Date(leave.start_date).toLocaleDateString('vi-VN')}
                        {' - '}
                        {new Date(leave.end_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td>{leave.total_days}</td>
                    </tr>
                  ))}
                  {!pendingLeaves.length && (
                    <tr>
                      <td colSpan={4} className="crud-empty">Hiện không có đơn nào chờ duyệt</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Thao tác nhanh</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/hr/employees" className="quick-action-btn primary">
                <FiUsers /> Quản lý nhân viên
              </Link>
              <Link to="/hr/leaves" className="quick-action-btn outline">
                <FiCalendar /> Duyệt nghỉ phép
              </Link>
              <Link to="/hr/salaries" className="quick-action-btn outline">
                <FiDollarSign /> Tính lương
              </Link>
              <Link to="/hr/reports" className="quick-action-btn outline">
                <FiFileText /> Báo cáo nhân sự
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Tổng quan kỳ hiện tại</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 12 }}>
                <div><strong>Tháng/Năm:</strong> {currentMonth}/{currentYear}</div>
                <div><strong>Tổng lương đã ghi nhận:</strong> {fmt(monthlySalaryTotal)}đ</div>
                <div><strong>Tổng thưởng kỳ này:</strong> {fmt(stats.totalBonus)}đ</div>
                <div><strong>Nhân viên đang hoạt động:</strong> {stats.employeeTotal}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
