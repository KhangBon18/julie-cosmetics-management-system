import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { FiShoppingBag, FiUser, FiChevronDown, FiLogOut, FiPackage } from 'react-icons/fi';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import publicService from '../../services/publicService';

export default function ShopLayout() {
  const { cartCount } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [megaOpen, setMegaOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const megaTimeout = useRef(null);

  useEffect(() => {
    publicService.getCategoriesTree().then(setCategoriesTree).catch(() => {});
  }, []);

  const handleMegaEnter = () => {
    clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  };
  const handleMegaLeave = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 200);
  };

  const handleCategoryClick = (categoryId) => {
    setMegaOpen(false);
    navigate(`/shop/products?category=${categoryId}`);
  };

  const isProductsActive = location.pathname.startsWith('/shop/products');

  // Category icons mapping
  const categoryIcons = {
    'Skincare': '🧴',
    'Makeup': '💄',
    'Perfume': '🌸',
    'Haircare': '💇‍♀️',
    'Body Care': '🛁',
    "Men's Care": '🧔',
  };

  return (
    <div style={{ background: 'var(--shop-bg)', minHeight: '100vh' }}>
      <header className="shop-header">
        <div className="shop-header-inner">
          <Link to="/shop" className="shop-logo">
            <div className="shop-logo-icon">💄</div>
            <div className="shop-logo-text">
              Julie Cosmetics
              <span>Premium Beauty</span>
            </div>
          </Link>
          <nav className="shop-nav">
            <NavLink to="/shop" end>Trang chủ</NavLink>

            {/* Sản phẩm with mega menu */}
            <div
              className="shop-nav-dropdown"
              onMouseEnter={handleMegaEnter}
              onMouseLeave={handleMegaLeave}
            >
              <NavLink
                to="/shop/products"
                className={isProductsActive ? 'active' : ''}
              >
                Sản phẩm <FiChevronDown size={12} className={`nav-chevron ${megaOpen ? 'nav-chevron-open' : ''}`} />
              </NavLink>

              {/* Mega menu dropdown */}
              <div className={`mega-menu ${megaOpen ? 'mega-menu-open' : ''}`}>
                <div className="mega-menu-inner">
                  {categoriesTree.map(cat => (
                    <div key={cat.category_id} className="mega-menu-column">
                      <div
                        className="mega-menu-parent"
                        onClick={() => handleCategoryClick(cat.category_id)}
                      >
                        <span className="mega-menu-icon">{categoryIcons[cat.category_name] || '📦'}</span>
                        {cat.category_name}
                        <span className="mega-menu-count">{cat.total_product_count}</span>
                      </div>
                      {cat.children && cat.children.length > 0 && (
                        <ul className="mega-menu-subs">
                          {cat.children.map(sub => (
                            <li key={sub.category_id}>
                              <button onClick={() => handleCategoryClick(sub.category_id)}>
                                {sub.category_name}
                                <span className="mega-menu-sub-count">{sub.product_count}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mega-menu-footer">
                  <button onClick={() => { setMegaOpen(false); navigate('/shop/products'); }}>
                    Xem tất cả sản phẩm →
                  </button>
                </div>
              </div>
            </div>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/shop/cart" className="shop-cart-btn">
              <FiShoppingBag size={18} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {user ? (
              user.role === 'customer' ? (
                /* ── Customer account dropdown ── */
                <div className="shop-user-menu" ref={userMenuRef}>
                  <button className="shop-cart-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} title={user.full_name}>
                    <FiUser size={18} />
                  </button>
                  {userMenuOpen && (
                    <div className="shop-user-dropdown">
                      <div className="shop-user-info">
                        <div className="shop-user-name">{user.full_name}</div>
                        <div className="shop-user-phone">{user.phone}</div>
                        {user.membership_tier && user.membership_tier !== 'standard' && (
                          <span className="shop-user-tier">{user.membership_tier}</span>
                        )}
                      </div>
                      <button onClick={() => { setUserMenuOpen(false); logout(); navigate('/shop'); }} className="shop-user-logout">
                        <FiLogOut size={14} /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Staff/Admin dashboard link ── */
                <Link to={user.role === 'admin' || user.role === 'manager' ? '/admin' : '/staff'} className="shop-cart-btn" title="Dashboard">
                  <FiUser size={18} />
                </Link>
              )
            ) : (
              /* ── Not logged in — go to shop auth ── */
              <Link to="/shop/auth" className="shop-cart-btn" title="Đăng nhập">
                <FiUser size={18} />
              </Link>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="shop-footer">
        <div className="shop-footer-inner">
          <div>
            <h4>Julie Cosmetics</h4>
            <p>Cửa hàng mỹ phẩm chính hãng uy tín hàng đầu. Cam kết 100% sản phẩm chính hãng từ các thương hiệu nổi tiếng thế giới.</p>
            <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>✉️ info@juliecosmetics.vn</p>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <p>📍 123 Nguyễn Huệ, Q.1, TP.HCM</p>
            <p>📞 0901 234 567</p>
            <p>🕐 8:00 - 22:00 mỗi ngày</p>
          </div>
          <div>
            <h4>Chính sách</h4>
            <p>🛡️ Cam kết chính hãng 100%</p>
            <p>🚚 Miễn phí ship từ 500.000đ</p>
            <p>🔄 Đổi trả trong 7 ngày</p>
            <p>💳 Thanh toán an toàn</p>
          </div>
        </div>
        <div className="shop-footer-bottom">
          © 2026 Julie Cosmetics. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
