import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiArrowRight, FiShield, FiTruck, FiRefreshCw, FiHeadphones } from 'react-icons/fi';
import { motion } from 'framer-motion';
import publicService from '../../services/publicService';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';

const fadeUpVar = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

function StarRating({ rating, count }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="product-card-rating">
      <div className="stars">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i <= full ? '' : (i === full + 1 && half ? '' : 'stars-empty')}>★</span>
        ))}
      </div>
      {count > 0 && <span className="rating-count">({count})</span>}
    </div>
  );
}

function ProductCard({ product, addToCart }) {
  const isNew = product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 30 * 86400000;
  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const outOfStock = product.stock_quantity <= 0;
  const isBestseller = product.total_sold > 5;

  return (
    <motion.div variants={fadeUpVar} className="product-card">
      <div className="product-card-image">
        <img src={product.image_url} alt={product.product_name}
          onError={e => { e.target.src = 'https://via.placeholder.com/400x400.png?text=Julie'; }} />
        <div className="product-card-badges">
          {isNew && <span className="card-badge card-badge-new">Mới</span>}
          {isBestseller && <span className="card-badge card-badge-bestseller">Bán chạy</span>}
          {lowStock && <span className="card-badge card-badge-low-stock">Sắp hết</span>}
          {outOfStock && <span className="card-badge card-badge-out">Hết hàng</span>}
        </div>
        {!outOfStock && (
          <div className="product-card-quick">
            <button className="btn-quick-add" onClick={(e) => { e.preventDefault(); addToCart(product, 1); toast.success('Đã thêm vào giỏ!'); }}>
              <FiShoppingCart size={14} /> Thêm vào giỏ
            </button>
          </div>
        )}
      </div>
      <div className="product-card-body">
        <div className="product-card-brand">{product.brand_name}</div>
        <div className="product-card-title">
          <Link to={`/shop/product/${product.product_id}`}>{product.product_name}</Link>
        </div>
        {product.avg_rating > 0 && <StarRating rating={Number(product.avg_rating)} count={product.review_count || 0} />}
        <div className="product-card-price">{fmt(product.sell_price)}đ</div>
      </div>
    </motion.div>
  );
}

function SkeletonGrid({ count = 4 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image" />
          <div className="skeleton-body">
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line skeleton-line-medium" />
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line skeleton-line-price" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StorefrontHome() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    Promise.all([
      publicService.getFeatured({ limit: 8 }).catch(() => []),
      publicService.getNewArrivals({ limit: 8 }).catch(() => []),
      publicService.getCategories().catch(() => []),
      publicService.getBrands().catch(() => [])
    ]).then(([feat, newArr, cats, brds]) => {
      setFeatured(feat);
      setNewArrivals(newArr);
      setCategories(cats);
      setBrands(brds);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="hero-section" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7)), url('/hero-banner.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <motion.span 
            className="hero-badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            ✦ Mỹ phẩm chính hãng
          </motion.span>
          <h1 className="hero-title">Khám Phá Vẻ Đẹp Đích Thực</h1>
          <p className="hero-subtitle">
            Hơn 100 thương hiệu mỹ phẩm cao cấp thế giới. Cam kết 100% chính hãng, giao hàng nhanh, đổi trả dễ dàng.
          </p>
          <motion.div className="hero-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <Link to="/shop/products" className="btn-hero btn-hero-primary">
              Mua sắm ngay <FiArrowRight />
            </Link>
            <Link to="/shop/products?sort=price_asc" className="btn-hero btn-hero-outline">
              Giá tốt nhất
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SERVICE STRIP ═══ */}
      <motion.div 
        className="service-strip"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="service-strip-inner">
          <div className="service-item">
            <div className="service-icon"><FiShield /></div>
            <div className="service-text"><h5>100% Chính hãng</h5><p>Cam kết sản phẩm từ hãng</p></div>
          </div>
          <div className="service-item">
            <div className="service-icon"><FiTruck /></div>
            <div className="service-text"><h5>Miễn phí vận chuyển</h5><p>Đơn hàng từ 500.000đ</p></div>
          </div>
          <div className="service-item">
            <div className="service-icon"><FiRefreshCw /></div>
            <div className="service-text"><h5>Đổi trả 7 ngày</h5><p>Hoàn tiền nếu không hài lòng</p></div>
          </div>
          <div className="service-item">
            <div className="service-icon"><FiHeadphones /></div>
            <div className="service-text"><h5>Hỗ trợ 24/7</h5><p>Tư vấn mọi lúc mọi nơi</p></div>
          </div>
        </div>
      </motion.div>

      {/* ═══ FEATURED CATEGORIES ═══ */}
      {categories.length > 0 && (
        <section className="shop-section shop-section-alt">
          <div className="shop-section-inner">
            <div className="section-header">
              <span className="section-badge">Khám phá</span>
              <h2 className="section-title">Danh Mục Sản Phẩm</h2>
            </div>
            <motion.div 
              className="category-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {categories.slice(0, 8).map(cat => (
                <motion.div key={cat.category_id} variants={fadeUpVar}>
                  <Link to={`/shop/products?category=${cat.category_id}`} className="category-card-premium">
                    <div className="cat-premium-content">
                      <h3 className="cat-premium-name">{cat.category_name}</h3>
                      <span className="cat-premium-count">Khám phá {cat.product_count || 0} sản phẩm</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══ BEST SELLERS ═══ */}
      <section className="shop-section">
        <div className="shop-section-inner">
          <div className="section-header">
            <span className="section-badge">Yêu thích nhất</span>
            <h2 className="section-title">Sản Phẩm Bán Chạy</h2>
            <p className="section-subtitle">Những sản phẩm được khách hàng tin dùng và yêu thích nhất</p>
          </div>
          {loading ? <SkeletonGrid count={4} /> : (
            <motion.div 
              className="product-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {featured.slice(0, 8).map(p => <ProductCard key={p.product_id} product={p} addToCart={addToCart} />)}
            </motion.div>
          )}
          <div className="section-cta">
            <Link to="/shop/products" className="btn-section">Xem tất cả sản phẩm <FiArrowRight /></Link>
          </div>
        </div>
      </section>

      {/* ═══ NEW ARRIVALS ═══ */}
      {newArrivals.length > 0 && (
        <section className="shop-section shop-section-alt">
          <div className="shop-section-inner">
            <div className="section-header">
              <span className="section-badge">Mới nhất</span>
              <h2 className="section-title">Hàng Mới Về</h2>
              <p className="section-subtitle">Sản phẩm vừa cập nhật, chưa bao giờ dễ dàng trải nghiệm đến thế</p>
            </div>
            {loading ? <SkeletonGrid count={4} /> : (
              <motion.div 
                className="product-grid"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {newArrivals.slice(0, 8).map(p => <ProductCard key={p.product_id} product={p} addToCart={addToCart} />)}
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ═══ BRAND SHOWCASE ═══ */}
      {brands.length > 0 && (
        <section className="shop-section">
          <div className="shop-section-inner">
            <div className="section-header">
              <span className="section-badge">Thương hiệu</span>
              <h2 className="section-title">Thương Hiệu Nổi Bật</h2>
            </div>
            <motion.div 
              className="brand-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {brands.slice(0, 16).map(b => (
                <motion.div key={b.brand_id} variants={fadeUpVar}>
                  <Link to={`/shop/products?brand=${b.brand_id}`} className="brand-pill">
                    {b.brand_name}
                    {b.product_count > 0 && <span className="brand-pill-count">{b.product_count}</span>}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}
