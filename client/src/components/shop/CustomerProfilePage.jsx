import { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  FiUser, FiShoppingBag, FiAward, FiLogOut, FiArrowLeft,
  FiClock, FiMapPin, FiMail, FiPhone, FiChevronDown, FiChevronUp,
  FiPackage, FiTag, FiStar, FiGift
} from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { getProductImage } from '../../utils/productImages';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const TIER_CONFIG = {
  standard: { label: 'Tiêu Chuẩn', emoji: '🥈', color: '#94a3b8', bg: '#f1f5f9', discount: 0, next: 'silver', nextPts: 100 },
  silver:   { label: 'Bạc',        emoji: '✨', color: '#64748b', bg: '#e2e8f0', discount: 2, next: 'gold',   nextPts: 500 },
  gold:     { label: 'Vàng',       emoji: '👑', color: '#d4a017', bg: '#fef9e7', discount: 5, next: null,     nextPts: null },
};

const STATUS_CONFIG = {
  draft:     { label: 'Bản nháp',      color: '#94a3b8', bg: '#f1f5f9' },
  confirmed: { label: 'Đã xác nhận',   color: '#0ea5e9', bg: '#e0f2fe' },
  paid:      { label: 'Đã thanh toán', color: '#10b981', bg: '#d1fae5' },
  completed: { label: 'Hoàn thành',    color: '#10b981', bg: '#d1fae5' },
  refunded:  { label: 'Hoàn tiền',     color: '#f59e0b', bg: '#fef3c7' },
  cancelled: { label: 'Đã hủy',        color: '#ef4444', bg: '#fee2e2' },
};

const PAY_LABELS = {
  cash:   '💵 Tiền mặt',
  card:   '💳 Thẻ ngân hàng',
  transfer: '📱 Chuyển khoản',
};

export default function CustomerProfilePage() {
  const { customerUser, customerLogout, refreshCustomer } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    if (!customerUser) return;
    Promise.all([
      refreshCustomer(),
      authService.customerOrders().then(setOrders)
    ])
    .catch(err => { if (err) toast.error(err.message || 'Lỗi khi tải thông tin'); })
    .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  if (!customerUser) return <Navigate to="/shop/auth?redirect=/shop/profile" replace />;

  const handleLogout = () => { customerLogout(); toast.info('Đã đăng xuất'); };
  const toggleOrder = (id) => setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));

  const currentPoints = customerUser.total_points || 0;
  const currentTier = customerUser.membership_tier || 'standard';
  const tier = TIER_CONFIG[currentTier] || TIER_CONFIG.standard;

  // Progress bar calc
  let progressPct = 100;
  let ptsToNext = 0;
  if (currentTier === 'standard') {
    progressPct = Math.min(100, (currentPoints / 100) * 100);
    ptsToNext = Math.max(0, 100 - currentPoints);
  } else if (currentTier === 'silver') {
    progressPct = Math.min(100, ((currentPoints - 100) / 400) * 100);
    ptsToNext = Math.max(0, 500 - currentPoints);
  }

  const initials = customerUser.full_name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'JC';

  return (
    <div className="profile-page">
      {/* ── TOP NAV BAR ── */}
      <div className="profile-topbar">
        <Link to="/shop" className="profile-back-link">
          <FiArrowLeft size={15} /> Quay lại cửa hàng
        </Link>
        <button className="profile-logout-btn" onClick={handleLogout}>
          <FiLogOut size={14} /> Đăng xuất
        </button>
      </div>

      {/* ── HERO PROFILE HEADER ── */}
      <div className="profile-hero">
        <div className="profile-hero-inner">
          {/* Avatar */}
          <div className="profile-avatar">
            <span>{initials}</span>
            <div className="profile-tier-badge" style={{ background: tier.bg, color: tier.color }}>
              {tier.emoji}
            </div>
          </div>

          {/* Name block */}
          <div className="profile-hero-info">
            <h1 className="profile-name">{customerUser.full_name}</h1>
            <div className="profile-meta-row">
              {customerUser.phone && <span><FiPhone size={13} /> {customerUser.phone}</span>}
              {customerUser.email && <span><FiMail size={13} /> {customerUser.email}</span>}
              {customerUser.address && <span><FiMapPin size={13} /> {customerUser.address}</span>}
              <span><FiClock size={13} /> Thành viên từ {new Date(customerUser.created_at).getFullYear()}</span>
            </div>
          </div>

          {/* Points chip */}
          <div className="profile-points-chip">
            <div className="ppc-label">Điểm tích lũy</div>
            <div className="ppc-value">{fmt(currentPoints)}</div>
            <div className="ppc-tier" style={{ color: tier.color }}>{tier.emoji} {tier.label}</div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="profile-body">
        {/* LEFT: Loyalty details */}
        <div className="profile-sidebar">

          {/* Tier card */}
          <div className="profile-card loyalty-card">
            <div className="pc-header">
              <FiAward size={18} /> Hạng thành viên
            </div>

            <div className="loyalty-tier-row">
              <div className="ltr-tier" style={{ background: tier.bg, color: tier.color }}>
                {tier.emoji} {tier.label}
              </div>
              {tier.discount > 0 && (
                <div className="ltr-discount">
                  <FiTag size={12} /> Giảm {tier.discount}% mỗi đơn
                </div>
              )}
            </div>

            {currentTier !== 'gold' && (
              <>
                {/* Progress bar */}
                <div className="loyalty-progress-wrap">
                  <div className="lpw-labels">
                    <span>{currentTier === 'standard' ? 'Tiêu Chuẩn' : 'Bạc'}</span>
                    <span>{currentTier === 'standard' ? 'Bạc' : 'Vàng'}</span>
                  </div>
                  <div className="lpw-track">
                    <div className="lpw-fill" style={{ width: `${progressPct}%` }} />
                    <div className="lpw-dot" style={{ left: `${progressPct}%` }} />
                  </div>
                  <div className="lpw-pts">
                    <span>{fmt(currentPoints)} điểm</span>
                    <span>{fmt(currentTier === 'standard' ? 100 : 500)} điểm</span>
                  </div>
                </div>

                <p className="loyalty-hint">
                  Cần thêm <strong>{fmt(ptsToNext)} điểm</strong> để lên hạng{' '}
                  <strong style={{ color: tier.color }}>
                    {TIER_CONFIG[tier.next]?.label}
                    {tier.next === 'gold' ? ' 👑' : ' ✨'}
                  </strong>
                </p>
              </>
            )}

            {currentTier === 'gold' && (
              <p className="loyalty-hint" style={{ textAlign: 'center' }}>
                🎉 Bạn đang ở hạng cao nhất! Tận hưởng ưu đãi <strong>-5%</strong> mọi đơn hàng.
              </p>
            )}

            {/* Tier table */}
            <div className="loyalty-tier-table">
              {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                <div key={key} className={`ltt-row ${key === currentTier ? 'ltt-active' : ''}`}>
                  <span>{cfg.emoji} {cfg.label}</span>
                  <span>{key === 'standard' ? '0–99 đ' : key === 'silver' ? '100–499 đ' : '≥ 500 đ'}</span>
                  <span style={{ color: cfg.discount > 0 ? '#b76e79' : '#94a3b8' }}>
                    {cfg.discount > 0 ? `-${cfg.discount}%` : '—'}
                  </span>
                </div>
              ))}
            </div>

            <p className="loyalty-footnote">
              * 1 điểm / 10.000đ chi tiêu. Điểm bị hoàn lại nếu đơn hàng bị hủy.
            </p>
          </div>

          {/* Stats card */}
          <div className="profile-card stats-card">
            <div className="pc-header"><FiStar size={18} /> Thống kê</div>
            <div className="stats-grid">
              <div className="stats-item">
                <div className="si-val">{orders.length}</div>
                <div className="si-label">Đơn hàng</div>
              </div>
              <div className="stats-item">
                <div className="si-val">
                  {fmt(orders.reduce((s, o) => s + Number(o.final_total || 0), 0))}đ
                </div>
                <div className="si-label">Tổng chi tiêu</div>
              </div>
              <div className="stats-item">
                <div className="si-val">{fmt(currentPoints)}</div>
                <div className="si-label">Điểm tích lũy</div>
              </div>
              <div className="stats-item">
                <div className="si-val">
                  {orders.filter(o => ['paid', 'completed'].includes(o.status)).length}
                </div>
                <div className="si-label">Đã hoàn thành</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Order history */}
        <div className="profile-orders">
          <div className="profile-card orders-card">
            <div className="pc-header">
              <FiShoppingBag size={18} /> Lịch sử đơn hàng
              {orders.length > 0 && (
                <span className="orders-count-badge">{orders.length}</span>
              )}
            </div>

            {loading ? (
              <div className="orders-loading"><div className="spinner" /></div>
            ) : orders.length === 0 ? (
              <div className="orders-empty">
                <FiGift size={44} />
                <p>Bạn chưa có đơn hàng nào</p>
                <Link to="/shop/products" className="btn-section">Mua sắm ngay</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => {
                  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
                  const isExpanded = expandedOrders[order.invoice_id];
                  const discountPct = Number(order.discount_percent) || 0;
                  const discountAmt = Number(order.discount_amount) || 0;
                  const hasDiscount = discountPct > 0 || discountAmt > 0;

                  return (
                    <div key={order.invoice_id} className="order-card">
                      {/* Order header row */}
                      <div className="oc-header" onClick={() => toggleOrder(order.invoice_id)}>
                        <div className="oc-header-left">
                          <div className="oc-id">#{order.invoice_id}</div>
                          <span className="oc-status-badge" style={{ color: status.color, background: status.bg }}>
                            {status.label}
                          </span>
                          {hasDiscount && (
                            <span className="oc-discount-badge">
                              <FiTag size={10} />
                              {discountPct > 0 ? `-${discountPct}%` : `-${fmt(discountAmt)}đ`}
                            </span>
                          )}
                        </div>
                        <div className="oc-header-right">
                          <div className="oc-total">{fmt(order.final_total)}đ</div>
                          {order.points_earned > 0 && (
                            <div className="oc-points">+{order.points_earned} điểm</div>
                          )}
                          <button className="oc-toggle">
                            {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Order meta */}
                      <div className="oc-meta">
                        <span><FiClock size={12} /> {fmtDate(order.created_at)} lúc {fmtTime(order.created_at)}</span>
                        <span><FiPackage size={12} /> {order.item_count} sản phẩm</span>
                        {order.payment_method && (
                          <span>{PAY_LABELS[order.payment_method] || order.payment_method}</span>
                        )}
                      </div>

                      {/* Expanded: pricing breakdown */}
                      {isExpanded && (
                        <div className="oc-detail">
                          {/* Items list */}
                          {order.items?.length > 0 && (
                            <div className="oc-items">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="oc-item">
                                  <img
                                    src={getProductImage({ ...item, product_name: item.product_name, category_id: item.category_id })}
                                    alt={item.product_name}
                                    className="oc-item-img"
                                    onError={e => { e.target.src = '/products/serum-1.jpg'; }}
                                  />
                                  <div className="oc-item-info">
                                    <div className="oc-item-brand">{item.brand_name}</div>
                                    <div className="oc-item-name">{item.product_name}</div>
                                    <div className="oc-item-qty">x{item.quantity}</div>
                                  </div>
                                  <div className="oc-item-price">{fmt(item.unit_price)}đ</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Price breakdown */}
                          <div className="oc-pricing">
                            <div className="ocp-row">
                              <span>Tạm tính</span>
                              <span>{fmt(order.subtotal)}đ</span>
                            </div>
                            {hasDiscount && (
                              <div className="ocp-row ocp-discount">
                                <span>
                                  Giảm giá{discountPct > 0 ? ` (${discountPct}%)` : ''}
                                </span>
                                <span>−{fmt(discountAmt || Math.round(order.subtotal * discountPct / 100))}đ</span>
                              </div>
                            )}
                            <div className="ocp-row ocp-total">
                              <span>Tổng thanh toán</span>
                              <span>{fmt(order.final_total)}đ</span>
                            </div>
                            {order.points_earned > 0 && (
                              <div className="ocp-row ocp-points-row">
                                <span>Điểm tích lũy</span>
                                <span>+{order.points_earned} điểm</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
