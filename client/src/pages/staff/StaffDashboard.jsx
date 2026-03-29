import { useState, useEffect } from 'react';
import { FiCalendar, FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import staffService from '../../services/staffService';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const d = await staffService.getDashboard();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Xin chào, {data?.employee?.full_name || 'Nhân viên'}! 👋</h1>
          <p>Tổng quan thông tin cá nhân</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FiClock /></div>
          <div className="stat-content">
            <h4>Đơn nghỉ chờ duyệt</h4>
            <div className="stat-value">{data?.pending_leaves || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiCheckCircle /></div>
          <div className="stat-content">
            <h4>Đơn đã duyệt</h4>
            <div className="stat-value">{data?.approved_leaves || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiDollarSign /></div>
          <div className="stat-content">
            <h4>Lương gần nhất</h4>
            <div className="stat-value">
              {data?.latest_salary ? `${fmt(data.latest_salary.net_salary)}đ` : 'Chưa có'}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiCalendar /></div>
          <div className="stat-content">
            <h4>Chức vụ hiện tại</h4>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {data?.employee?.position_name || 'Chưa gán'}
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin nhanh */}
      <div className="card">
        <div className="card-header"><h3>Thông tin cá nhân</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingBottom: 8 }}>
            <div><strong>Họ tên:</strong> {data?.employee?.full_name}</div>
            <div><strong>Email:</strong> {data?.employee?.email}</div>
            <div><strong>Số điện thoại:</strong> {data?.employee?.phone || '—'}</div>
            <div><strong>Giới tính:</strong> {data?.employee?.gender}</div>
            <div><strong>Ngày nhận việc:</strong> {data?.employee?.hire_date ? new Date(data.employee.hire_date).toLocaleDateString('vi-VN') : '—'}</div>
            <div><strong>Lương cơ bản:</strong> {fmt(data?.employee?.base_salary || 0)}đ</div>
          </div>
        </div>
      </div>

      {data?.latest_salary && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h3>Bảng lương tháng {data.latest_salary.month}/{data.latest_salary.year}</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div><strong>Ngày công:</strong> {data.latest_salary.work_days_actual}/{data.latest_salary.work_days_standard}</div>
              <div><strong>Lương cơ bản:</strong> {fmt(data.latest_salary.base_salary)}đ</div>
              <div><strong>Lương thực:</strong> {fmt(data.latest_salary.gross_salary)}đ</div>
              <div style={{ color: '#059669' }}><strong>Thưởng:</strong> {data.latest_salary.bonus > 0 ? `+${fmt(data.latest_salary.bonus)}đ` : '—'}</div>
              <div style={{ color: '#ef4444' }}><strong>Khấu trừ:</strong> {data.latest_salary.deductions > 0 ? `-${fmt(data.latest_salary.deductions)}đ` : '—'}</div>
              <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 18 }}><strong>Thực nhận:</strong> {fmt(data.latest_salary.net_salary)}đ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
