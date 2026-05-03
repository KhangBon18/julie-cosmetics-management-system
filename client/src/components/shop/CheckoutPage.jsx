import { useState, useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiShield, FiTruck, FiUser } from 'react-icons/fi';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import publicService from '../../services/publicService';
import { toast } from 'react-toastify';
import { buildCartSignature, summarizeCartIssues } from '../../utils/cartValidation';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

const PAYMENT_METHODS = [
  { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi nhận hàng', icon: '💵' },
  { id: 'transfer', name: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản trước khi giao hàng', icon: '🏦' },
  { id: 'cash', name: 'Thanh toán tại cửa hàng', desc: 'Trả tiền tại quầy khi đến nhận', icon: '🏪' }
];

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, replaceCart } = useContext(CartContext);
  const { customerUser } = useContext(AuthContext);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', shipping_address: '', note: '' });
  const [payment, setPayment] = useState('cod');
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [errors, setErrors] = useState({});
  const [settings, setSettings] = useState({});
  const lastValidatedSignature = useRef('');

  useEffect(() => {
    publicService.getSettings().then(setSettings).catch(console.error);
  }, []);

  // Auto-fill from customer profile
  useEffect(() => {
    if (customerUser) {
      setForm(prev => ({
        ...prev,
        customer_name: customerUser.full_name || prev.customer_name,
        customer_phone: customerUser.phone || prev.customer_phone,
        customer_email: customerUser.email || prev.customer_email,
        shipping_address: customerUser.address || prev.shipping_address
      }));
    }
  }, [customerUser]);

  useEffect(() => {
    const syncCart = async () => {
      if (!cart.length) {
        lastValidatedSignature.current = '';
        return;
      }

      const currentSignature = buildCartSignature(cart);
      if (currentSignature === lastValidatedSignature.current) return;

      try {
        const snapshot = await publicService.validateCart({
          items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
        });
        lastValidatedSignature.current = buildCartSignature(snapshot.items || []);

        if (snapshot.summary?.changed) {
          replaceCart(snapshot.items || []);
          toast.warn(summarizeCartIssues(snapshot.issues));
        }
      } catch (error) {
        console.error(error);
      }
    };

    syncCart();
  }, [cart, replaceCart]);

  const silverDiscount = settings['crm.silver_discount'] || 2;
  const goldDiscount = settings['crm.gold_discount'] || 5;
  let discountPct = 0;
  if (customerUser) {
    if (customerUser.membership_tier === 'gold') discountPct = goldDiscount;
    else if (customerUser.membership_tier === 'silver') discountPct = silverDiscount;
  }
  
  const discountAmount = Math.round(cartTotal * discountPct / 100);
  const totalAfterDiscount = cartTotal - discountAmount;
  const total = totalAfterDiscount;

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Vui lòng nhập họ tên';
    if (!form.customer_phone.trim()) e.customer_phone = 'Vui lòng nhập số điện thoại';
    else if (!/^(0\d{9,10})$/.test(form.customer_phone.trim())) e.customer_phone = 'Số điện thoại không hợp lệ';
    if (form.customer_email && !/^[^\s@]+@[^\s@]+$/.test(form.customer_email)) e.customer_email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const snapshot = await publicService.validateCart({
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
      });
      lastValidatedSignature.current = buildCartSignature(snapshot.items || []);

      if (!snapshot.items?.length) {
        replaceCart([]);
        toast.error(snapshot.issues?.[0]?.message || 'Giỏ hàng không còn sản phẩm hợp lệ');
        return;
      }

      if (snapshot.summary?.changed) {
        replaceCart(snapshot.items || []);
        toast.warn(`${summarizeCartIssues(snapshot.issues)} Vui lòng kiểm tra lại đơn hàng rồi đặt lại.`);
        return;
      }

      const result = await publicService.checkout({
        items: snapshot.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        ...form,
        payment_method: payment
      });
      setOrder(result.order);
      clearCart();
      toast.success('Đặt hàng thành công!');
    } catch (err) {
      const snapshot = err?.cart_snapshot;
      if (snapshot?.items) {
        replaceCart(snapshot.items);
        lastValidatedSignature.current = buildCartSignature(snapshot.items);
      }
      toast.error(err?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ═══ ORDER SUCCESS ═══
  if (order) {
    return (
      <div className="shop-container">
        <div className="order-success">
          <div className="order-success-icon"><FiCheck size={32} /></div>
          <h1>Đặt hàng thành công!</h1>
          <p>Cảm ơn bạn đã mua sắm tại Julie Cosmetics. Đơn hàng của bạn đã được xác nhận.</p>
          <div className="order-details">
            <div><div className="order-detail-label">Mã đơn hàng</div><div className="order-detail-value">#{order.order_id}</div></div>
            <div><div className="order-detail-label">Tổng tiền</div><div className="order-detail-value">{fmt(order.total)}đ</div></div>
            <div><div className="order-detail-label">Thanh toán</div><div className="order-detail-value">{PAYMENT_METHODS.find(m => m.id === payment)?.name || payment}</div></div>
            <div><div className="order-detail-label">Số sản phẩm</div><div className="order-detail-value">{order.items_count} sản phẩm</div></div>
          </div>
          <Link to="/shop" className="btn-section">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  // (Guest checkout is now allowed, so no login blocker here)

  // ═══ EMPTY CART REDIRECT ═══
  if (cart.length === 0) {
    return (
      <div className="shop-container">
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Giỏ hàng trống</h2>
          <p>Bạn cần thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
          <Link to="/shop/products" className="btn-section">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-container">
      <Link to="/shop/cart" className="back-link"><FiArrowLeft /> Quay lại giỏ hàng</Link>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'var(--shop-text-dark)', marginBottom: 24 }}>
        Thanh toán
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          {/* ─── LEFT: FORM ─── */}
          <div>
            {/* Customer info */}
            <div className="checkout-section">
              <h2>Thông tin khách hàng</h2>
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Họ và tên *</label>
                  <input value={form.customer_name} onChange={onChange('customer_name')} placeholder="Nguyễn Văn A"
                    style={errors.customer_name ? { borderColor: 'var(--shop-danger)' } : {}} />
                  {errors.customer_name && <p style={{ color: 'var(--shop-danger)', fontSize: 12, marginTop: 4 }}>{errors.customer_name}</p>}
                </div>
                <div className="checkout-form-group">
                  <label>Số điện thoại *</label>
                  <input value={form.customer_phone} onChange={onChange('customer_phone')} placeholder="0901234567"
                    style={errors.customer_phone ? { borderColor: 'var(--shop-danger)' } : {}} />
                  {errors.customer_phone && <p style={{ color: 'var(--shop-danger)', fontSize: 12, marginTop: 4 }}>{errors.customer_phone}</p>}
                </div>
              </div>
              <div className="checkout-form-group">
                <label>Email</label>
                <input value={form.customer_email} onChange={onChange('customer_email')} placeholder="email@example.com" type="email"
                  style={errors.customer_email ? { borderColor: 'var(--shop-danger)' } : {}} />
                {errors.customer_email && <p style={{ color: 'var(--shop-danger)', fontSize: 12, marginTop: 4 }}>{errors.customer_email}</p>}
              </div>
              <div className="checkout-form-group">
                <label>Địa chỉ giao hàng</label>
                <textarea value={form.shipping_address} onChange={onChange('shipping_address')} placeholder="Số nhà, tên đường, quận/huyện, tỉnh/thành phố" rows={2} />
              </div>
            </div>

            {/* Payment method */}
            <div className="checkout-section">
              <h2>Phương thức thanh toán</h2>
              <div className="payment-methods">
                {PAYMENT_METHODS.map(m => (
                  <div key={m.id} className={`payment-method ${payment === m.id ? 'active' : ''}`} onClick={() => setPayment(m.id)}>
                    <div className="payment-method-radio" />
                    <div style={{ fontSize: 24 }}>{m.icon}</div>
                    <div className="payment-method-info">
                      <h4>{m.name}</h4>
                      <p>{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="checkout-section">
              <h2>Ghi chú</h2>
              <div className="checkout-form-group">
                <textarea value={form.note} onChange={onChange('note')} placeholder="Ghi chú cho đơn hàng (tùy chọn)..." rows={3} />
              </div>
            </div>
          </div>

          {/* ─── RIGHT: ORDER SUMMARY ─── */}
          <div className="checkout-order-summary">
            <div className="cart-summary">
              <h3>Đơn hàng của bạn</h3>
              {cart.map(item => (
                <div key={item.product_id} className="cart-summary-row" style={{ gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 13 }}>{item.product_name} <span style={{ color: 'var(--shop-text-muted)' }}>×{item.quantity}</span></span>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(item.sell_price * item.quantity)}đ</span>
                </div>
              ))}
              <div className="cart-summary-row" style={{ borderTop: '1px solid var(--shop-border-light)', marginTop: 8, paddingTop: 12 }}>
                <span>Tạm tính</span>
                <span>{fmt(cartTotal)}đ</span>
              </div>
              <div className="cart-summary-row">
                <span>Vận chuyển</span>
                <span style={{ color: 'var(--shop-success)' }}>Miễn phí</span>
              </div>
              {discountAmount > 0 && customerUser && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--shop-bg-light)', borderRadius: 6, border: '1px solid var(--shop-border-light)' }}>
                  <div className="cart-summary-row" style={{ marginBottom: 4 }}>
                    <span style={{ color: 'var(--shop-primary-dark)', fontSize: 13, fontWeight: 600 }}>Cấp bậc thành viên</span>
                    <span style={{ color: 'var(--shop-primary-dark)', fontWeight: 600 }}>−{fmt(discountAmount)}đ</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--shop-text-muted)', lineHeight: 1.4 }}>
                    Áp dụng mức giảm <strong>{discountPct}%</strong> dành cho thành viên <strong>{customerUser.membership_tier === 'gold' ? 'Vàng (Gold)' : customerUser.membership_tier === 'silver' ? 'Bạc (Silver)' : 'Tiêu chuẩn'}</strong>.
                  </div>
                </div>
              )}
              <div className="cart-summary-row cart-summary-total">
                <span>Tổng cộng</span>
                <span style={{ color: 'var(--shop-primary-dark)' }}>{fmt(total)}đ</span>
              </div>

              <button type="submit" className="btn-place-order" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : `Đặt hàng — ${fmt(total)}đ`}
              </button>

              <div className="cart-trust">
                <div className="cart-trust-item"><FiShield size={14} /> Thanh toán được bảo mật</div>
                <div className="cart-trust-item"><FiTruck size={14} /> Giao hàng nhanh chóng</div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
