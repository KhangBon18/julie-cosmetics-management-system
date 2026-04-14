import { useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiArrowRight, FiShield, FiTruck, FiRefreshCw, FiShoppingBag } from 'react-icons/fi';
import { CartContext } from '../../context/CartContext';
import publicService from '../../services/publicService';
import { toast } from 'react-toastify';
import { buildCartSignature, summarizeCartIssues } from '../../utils/cartValidation';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, replaceCart, cartTotal } = useContext(CartContext);
  const lastValidatedSignature = useRef('');

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

  if (cart.length === 0) {
    return (
      <div className="shop-container">
        <div className="cart-empty">
          <div className="cart-empty-icon"><FiShoppingBag /></div>
          <h2>Giỏ hàng trống</h2>
          <p>Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá những sản phẩm tuyệt vời của chúng tôi!</p>
          <Link to="/shop/products" className="btn-section">
            Tiếp tục mua sắm <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-container">
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'var(--shop-text-dark)', marginBottom: 8 }}>
        Giỏ hàng
      </h1>
      <p style={{ color: 'var(--shop-text-muted)', fontSize: 14, marginBottom: 24 }}>
        {cart.length} sản phẩm
      </p>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.product_id} className="cart-item">
              <div className="cart-item-image">
                <img src={item.image_url} alt={item.product_name}
                  onError={e => { e.target.src = 'https://via.placeholder.com/100x100.png?text=No+Image'; }} />
              </div>
              <div className="cart-item-info">
                <div className="cart-item-brand">{item.brand_name || 'Julie Cosmetics'}</div>
                <div className="cart-item-name">
                  <Link to={`/shop/product/${item.product_id}`}>{item.product_name}</Link>
                </div>
                <div className="cart-item-price">{fmt(item.sell_price)}đ</div>
                <div className="cart-item-actions">
                  <div className="qty-selector" style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}><FiMinus /></button>
                    <input type="number" value={item.quantity}
                      onChange={e => updateQuantity(item.product_id, parseInt(e.target.value) || 1)} />
                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}><FiPlus /></button>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.product_id)}>
                    <FiTrash2 size={13} /> Xóa
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: 'var(--shop-primary-dark)', whiteSpace: 'nowrap' }}>
                {fmt(item.sell_price * item.quantity)}đ
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Tóm tắt đơn hàng</h3>
          <div className="cart-summary-row">
            <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
            <span>{fmt(cartTotal)}đ</span>
          </div>
          <div className="cart-summary-row">
            <span>Vận chuyển</span>
            <span style={{ color: cartTotal >= 500000 ? 'var(--shop-success)' : 'inherit' }}>
              {cartTotal >= 500000 ? 'Miễn phí' : '30.000đ'}
            </span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Tổng cộng</span>
            <span>{fmt(cartTotal + (cartTotal >= 500000 ? 0 : 30000))}đ</span>
          </div>
          {cartTotal < 500000 && (
            <p style={{ fontSize: 12, color: 'var(--shop-primary)', marginTop: 8 }}>
              Mua thêm {fmt(500000 - cartTotal)}đ để được miễn phí vận chuyển!
            </p>
          )}
          <Link to="/shop/checkout" className="btn-checkout">
            Thanh toán <FiArrowRight />
          </Link>

          <div className="cart-trust">
            <div className="cart-trust-item"><FiShield size={14} /> sản phẩm chính hãng 100%</div>
            <div className="cart-trust-item"><FiTruck size={14} /> giao hàng nhanh toàn quốc</div>
            <div className="cart-trust-item"><FiRefreshCw size={14} /> đổi trả miễn phí trong 7 ngày</div>
          </div>
        </div>
      </div>
    </div>
  );
}
