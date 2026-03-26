import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import { CartContext } from '../../context/CartContext';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useContext(CartContext);

  if (!cart.length) {
    return (
      <div className="shop-container">
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Giỏ hàng trống</h3>
          <p style={{ marginBottom: 24 }}>Hãy thêm sản phẩm yêu thích vào giỏ hàng</p>
          <Link to="/shop" className="btn btn-primary" style={{ display: 'inline-flex', gap: 8 }}>
            <FiArrowLeft /> Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-container cart-page">
      <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', marginBottom: 24, fontSize: 14 }}>
        <FiArrowLeft /> Tiếp tục mua sắm
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
        <FiShoppingBag style={{ verticalAlign: 'middle' }} /> Giỏ hàng ({cart.length} sản phẩm)
      </h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => (
            <div className="cart-item" key={item.product_id}>
              <div className="cart-item-image">
                <img src={item.image_url} alt={item.product_name} onError={e => { e.target.src = 'https://via.placeholder.com/80x80.png?text=SP'; }} />
              </div>
              <div className="cart-item-info">
                <h4>{item.product_name}</h4>
                <span className="cart-item-brand">{item.brand_name}</span>
              </div>
              <div className="qty-selector" style={{ transform: 'scale(0.85)' }}>
                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}><FiMinus /></button>
                <input value={item.quantity} readOnly />
                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}><FiPlus /></button>
              </div>
              <div className="cart-item-price">{fmt(item.sell_price * item.quantity)}đ</div>
              <button className="cart-item-remove" onClick={() => removeFromCart(item.product_id)}><FiTrash2 /></button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Tóm tắt đơn hàng</h3>
          <div className="cart-summary-row">
            <span>Tạm tính</span>
            <span>{fmt(cartTotal)}đ</span>
          </div>
          <div className="cart-summary-row">
            <span>Vận chuyển</span>
            <span style={{ color: cartTotal >= 500000 ? '#059669' : undefined }}>
              {cartTotal >= 500000 ? 'Miễn phí' : `${fmt(30000)}đ`}
            </span>
          </div>
          <div className="cart-summary-row total">
            <span>Tổng cộng</span>
            <span>{fmt(cartTotal + (cartTotal >= 500000 ? 0 : 30000))}đ</span>
          </div>
          <button className="btn-checkout" onClick={() => { alert('Chức năng thanh toán đang phát triển! Vui lòng liên hệ cửa hàng để đặt hàng.'); }}>
            Tiến hành thanh toán
          </button>
          <button className="btn btn-outline" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} onClick={clearCart}>
            Xóa giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
}
