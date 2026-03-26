import { Outlet, NavLink, Link } from 'react-router-dom';
import { useContext } from 'react';
import { FiShoppingBag, FiSearch } from 'react-icons/fi';
import { CartContext } from '../../context/CartContext';

export default function ShopLayout() {
  const { cartCount } = useContext(CartContext);

  return (
    <div>
      <header className="shop-header">
        <div className="shop-header-inner">
          <Link to="/shop" className="shop-logo">
            <div className="shop-logo-icon">💄</div>
            <div className="shop-logo-text">
              Julie Cosmetics
              <span>Mỹ phẩm chính hãng</span>
            </div>
          </Link>
          <nav className="shop-nav">
            <NavLink to="/shop" end>Trang chủ</NavLink>
            <NavLink to="/shop/products">Sản phẩm</NavLink>
          </nav>
          <Link to="/shop/cart" className="shop-cart-btn">
            <FiShoppingBag />
            Giỏ hàng
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="shop-footer">
        <div className="shop-footer-inner">
          <div>
            <h4>💄 Julie Cosmetics</h4>
            <p>Cửa hàng mỹ phẩm chính hãng uy tín. Cam kết 100% sản phẩm chính hãng từ các thương hiệu nổi tiếng thế giới.</p>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <p>📍 123 Nguyễn Huệ, Q.1, TP.HCM</p>
            <p>📞 0901 234 567</p>
            <p>✉️ info@juliecosmetics.vn</p>
          </div>
          <div>
            <h4>Chính sách</h4>
            <p>Đổi trả trong 7 ngày</p>
            <p>Miễn phí vận chuyển từ 500k</p>
            <p>Thanh toán an toàn</p>
          </div>
        </div>
        <div className="shop-footer-bottom">
          © 2026 Julie Cosmetics. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
