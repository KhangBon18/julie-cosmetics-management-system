import { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiUser, FiShoppingBag, FiAward, FiLogOut, FiArrowLeft, FiClock, FiMapPin, FiMail, FiPhone } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

const TIER_THRESHOLDS = {
  standard: 0,
  silver: 100,
  gold: 500
};

const TIER_LABELS = {
  standard: 'Tiêu chuẩn',
  silver: 'Bạc (Silver)',
  gold: 'Vàng (Gold)'
};

const STATUS_LABELS = {
  draft: 'Bản nháp',
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
  completed: 'Hoàn thành',
  refunded: 'Hoàn tiền',
  cancelled: 'Đã hủy'
};

const STATUS_COLORS = {
  draft: '#64748b',
  confirmed: '#0ea5e9',
  paid: '#22c55e',
  completed: '#22c55e',
  refunded: '#64748b',
  cancelled: '#ef4444'
};

export default function CustomerProfilePage() {
  const { customerUser, customerLogout, refreshCustomer } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerUser) return;
    
    // Fetch fresh profile and orders parallel
    Promise.all([
      refreshCustomer(),
      authService.customerOrders().then(setOrders)
    ])
    .catch(err => {
      console.error('Profile fetch error:', err);
      // Only toast if it's truly an error, not just a cancelled request
      if (err) toast.error(err.message || 'Lỗi khi tải thông tin tài khoản');
    })
    .finally(() => setLoading(false));
    
    // eslint-disable-next-line
  }, []);

  if (!customerUser) {
    return <Navigate to="/shop/auth?redirect=/shop/profile" replace />;
  }

  const handleLogout = () => {
    customerLogout();
    toast.info('Đã đăng xuất');
  };

  const currentPoints = customerUser.total_points || 0;
  const currentTier = customerUser.membership_tier || 'standard';
  
  let nextTier = 'silver';
  let nextPoints = TIER_THRESHOLDS.silver;
  let progressPct = 0;
  
  if (currentTier === 'standard') {
    nextTier = 'silver';
    nextPoints = TIER_THRESHOLDS.silver;
    progressPct = Math.min(100, (currentPoints / nextPoints) * 100);
  } else if (currentTier === 'silver') {
    nextTier = 'gold';
    nextPoints = TIER_THRESHOLDS.gold;
    progressPct = Math.min(100, ((currentPoints - TIER_THRESHOLDS.silver) / (TIER_THRESHOLDS.gold - TIER_THRESHOLDS.silver)) * 100);
  } else {
    nextTier = 'gold'; // Max tier
    nextPoints = currentPoints;
    progressPct = 100;
  }

  return (
    <div className="shop-container" style={{ padding: '40px 20px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Link to="/shop" className="back-link"><FiArrowLeft /> Quay lại cửa hàng</Link>
        <button onClick={handleLogout} className="btn-section" style={{ background: 'transparent', color: 'var(--shop-danger)', border: '1px solid var(--shop-danger)', padding: '6px 12px' }}>
          <FiLogOut /> Đăng xuất
        </button>
      </div>

      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'var(--shop-text-dark)', marginBottom: 24 }}>
        Thành viên Julie Cosmetics
      </h1>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LEFT COLUMN: Profile info & points */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Profile Card */}
          <div style={{ padding: 24, borderRadius: 16, background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--shop-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--shop-primary), var(--shop-primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 }}>
                {customerUser.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: 18, margin: '0 0 4px 0' }}>{customerUser.full_name}</h2>
                <div style={{ fontSize: 13, color: 'var(--shop-text-muted)' }}>Tham gia từ {new Date(customerUser.created_at).getFullYear()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--shop-text-dark)' }}>
                <FiPhone color="var(--shop-text-muted)" /> {customerUser.phone}
              </div>
              {customerUser.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--shop-text-dark)' }}>
                  <FiMail color="var(--shop-text-muted)" /> {customerUser.email}
                </div>
              )}
              {customerUser.address && (
                <div style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--shop-text-dark)', alignItems: 'flex-start' }}>
                  <FiMapPin color="var(--shop-text-muted)" style={{ marginTop: 4, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.4 }}>{customerUser.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Points Card */}
          <div style={{ padding: 24, borderRadius: 16, background: 'linear-gradient(to bottom, #fff, var(--shop-bg-light))', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--shop-border-light)' }}>
            <h3 style={{ fontSize: 16, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiAward size={20} color="var(--shop-primary-dark)" /> Điểm thành viên
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--shop-text-muted)', marginBottom: 4 }}>Hạng hiện tại</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--shop-primary-dark)' }}>{TIER_LABELS[currentTier]}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--shop-text-muted)', marginBottom: 4 }}>Điểm tích lũy</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{fmt(currentPoints)}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: '#e2e8f0', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 4, transition: 'width 1s ease' }} />
            </div>

            <div style={{ fontSize: 13, color: 'var(--shop-text-muted)', textAlign: 'center' }}>
              {currentTier !== 'gold' ? (
                <>Cần tích thêm <strong>{nextPoints - currentPoints} điểm</strong> để thăng hạng <strong>{TIER_LABELS[nextTier]}</strong>.</>
              ) : (
                <>Bạn đang ở hạng cao nhất. Tiếp tục mua sắm để duy trì mức giảm giá tốt nhất!</>
              )}
            </div>
            
            <p style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--shop-border-light)', fontSize: 12, color: 'var(--shop-text-muted)', lineHeight: 1.5, marginBottom: 0 }}>
              * 1 điểm sẽ được tích lũy cho mỗi 10.000đ chi tiêu. Giao dịch mua hàng bị hoàn trả hoặc hủy sẽ bị khấu trừ lại số điểm tương ứng.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Order History */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ padding: 24, borderRadius: 16, background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--shop-border-light)' }}>
            <h3 style={{ fontSize: 16, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiShoppingBag size={20} /> Lịch sử đơn hàng hiện tại
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : orders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map(order => (
                  <div key={order.invoice_id} style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: 'var(--shop-bg-light)', borderRadius: 10, border: '1px solid var(--shop-border-light)', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700 }}>#{order.invoice_id}</span>
                        <span style={{ fontSize: 12, color: '#fff', background: STATUS_COLORS[order.status] || '#64748b', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--shop-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiClock size={12} /> {new Date(order.created_at).toLocaleDateString('vi-VN')} lúc {new Date(order.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--shop-text-muted)', marginTop: 4 }}>
                        {order.item_count} sản phẩm
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--shop-primary-dark)' }}>{fmt(order.final_total)}đ</div>
                      {order.points_earned > 0 && (
                        <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>
                          +{order.points_earned} điểm
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', background: 'var(--shop-bg-light)', borderRadius: 10, border: '1px dashed var(--shop-border-light)' }}>
                <FiShoppingBag size={48} color="var(--shop-border-light)" style={{ marginBottom: 16 }} />
                <p style={{ color: 'var(--shop-text-muted)', fontSize: 14 }}>Bạn chưa có đơn hàng nào.</p>
                <Link to="/shop/products" className="btn-section" style={{ marginTop: 12, display: 'inline-block' }}>Mua sắm ngay</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
