import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiArrowLeft, FiMinus, FiPlus, FiShield, FiTruck, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import publicService from '../../services/publicService';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';
import { getProductImage } from '../../utils/productImages';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

function StarRating({ rating, size = 14 }) {
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? '' : 'stars-empty'}>★</span>
      ))}
    </div>
  );
}

function SkeletonPDP() {
  return (
    <div className="product-detail">
      <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 16 }} />
      <div>
        <div className="skeleton" style={{ width: '30%', height: 14, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '80%', height: 28, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '40%', height: 24, marginBottom: 20 }} />
        <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 100, marginBottom: 20 }} />
        <div className="skeleton" style={{ width: '60%', height: 48 }} />
      </div>
    </div>
  );
}

function RelatedCard({ product }) {
  return (
    <div className="product-card product-card-v2">
      <Link to={`/shop/product/${product.product_id}`} className="product-card-image-link">
        <div className="product-card-image">
          <img
            src={getProductImage(product)}
            alt={product.product_name}
            loading="lazy"
            onError={e => { e.target.src = '/products/serum-1.jpg'; }}
          />
        </div>
      </Link>
      <div className="product-card-body">
        <div className="product-card-brand">{product.brand_name}</div>
        <div className="product-card-title">
          <Link to={`/shop/product/${product.product_id}`}>{product.product_name}</Link>
        </div>
        {product.avg_rating > 0 && (
          <div className="product-card-rating">
            <StarRating rating={Number(product.avg_rating)} />
            <span className="rating-count">({product.review_count})</span>
          </div>
        )}
        <div className="product-card-footer">
          <div className="product-card-price">{fmt(product.sell_price)}đ</div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState({ reviews: [], total: 0, avg_rating: 0 });
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    setLoading(true);
    setQty(1);
    window.scrollTo(0, 0);
    Promise.all([
      publicService.getProduct(id),
      publicService.getProductReviews(id, { limit: 5 }).catch(() => ({ reviews: [], total: 0, avg_rating: 0 })),
      publicService.getRelatedProducts(id, { limit: 4 }).catch(() => [])
    ]).then(([prod, rev, rel]) => {
      setProduct(prod);
      setReviews(rev);
      setRelated(rel);
    }).catch(() => toast.error('Không tìm thấy sản phẩm'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    addToCart(product, qty);
    toast.success(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`);
  };

  if (loading) return <div className="shop-container"><SkeletonPDP /></div>;
  if (!product) return (
    <div className="shop-container">
      <div className="cart-empty">
        <div className="cart-empty-icon">🔍</div>
        <h2>Sản phẩm không tồn tại</h2>
        <p>Sản phẩm bạn tìm kiếm có thể đã bị xóa hoặc không tồn tại.</p>
        <Link to="/shop/products" className="btn-section">Xem sản phẩm khác</Link>
      </div>
    </div>
  );

  const inStock = product.stock_quantity > 0;
  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className="shop-container">
      <Link to="/shop/products" className="back-link">
        <FiArrowLeft /> Quay lại sản phẩm
      </Link>

      <div className="product-detail">
        <div className="product-detail-image">
          <img src={getProductImage(product)} alt={product.product_name}
            loading="eager"
            onError={e => { e.target.src = '/products/serum-1.jpg'; }} />
        </div>
        <div className="product-detail-info">
          <span className="product-detail-brand">{product.brand_name}</span>
          <h1>{product.product_name}</h1>

          {/* Rating summary */}
          {reviews.avg_rating > 0 && (
            <div className="product-detail-rating">
              <StarRating rating={reviews.avg_rating} size={16} />
              <span className="rating-count" style={{ fontSize: 14 }}>
                {reviews.avg_rating} ({reviews.total} đánh giá)
              </span>
            </div>
          )}

          <div className="product-detail-price">{fmt(product.sell_price)}đ</div>

          {/* Stock status */}
          <div className={`stock-status ${inStock ? (lowStock ? 'stock-status-low' : 'stock-status-in') : 'stock-status-out'}`}>
            {inStock ? (
              lowStock ? (
                <><FiCheckCircle /> Chỉ còn {product.stock_quantity} sản phẩm — Mua ngay!</>
              ) : (
                <><FiCheckCircle /> Còn hàng</>
              )
            ) : '✕ Hết hàng'}
          </div>

          {product.description && (
            <p className="product-detail-desc">{product.description}</p>
          )}

          <div className="product-detail-meta">
            <div><span>Thương hiệu</span><span>{product.brand_name}</span></div>
            <div><span>Danh mục</span><span>{product.category_name}</span></div>
            {product.volume && <div><span>Dung tích</span><span>{product.volume}</span></div>}
            {product.skin_type && <div><span>Loại da</span><span>{product.skin_type}</span></div>}
          </div>

          {/* Add to cart */}
          <div className="product-detail-actions">
            <div className="qty-selector">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus /></button>
              <input type="number" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
              <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}><FiPlus /></button>
            </div>
            <button className="btn-add-cart-lg" onClick={handleAdd} disabled={!inStock}>
              <FiShoppingCart /> {inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>
          </div>

          {/* Trust blocks */}
          <div className="trust-blocks">
            <div className="trust-block">
              <div className="trust-block-icon"><FiShield /></div>
              <div><h6>100% Chính hãng</h6><p>Cam kết sản phẩm chính hãng từ nhà phân phối</p></div>
            </div>
            <div className="trust-block">
              <div className="trust-block-icon"><FiTruck /></div>
              <div><h6>Giao hàng nhanh</h6><p>Miễn phí vận chuyển đơn từ 500.000đ</p></div>
            </div>
            <div className="trust-block">
              <div className="trust-block-icon"><FiRefreshCw /></div>
              <div><h6>Đổi trả dễ dàng</h6><p>Đổi trả trong vòng 7 ngày</p></div>
            </div>
            <div className="trust-block">
              <div className="trust-block-icon"><FiCheckCircle /></div>
              <div><h6>Thanh toán an toàn</h6><p>Bảo mật thông tin khách hàng</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ REVIEWS SECTION ═══ */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Đánh giá sản phẩm</h2>
        </div>

        {reviews.total > 0 ? (
          <>
            <div className="reviews-summary">
              <div className="reviews-avg">
                <div className="reviews-avg-number">{reviews.avg_rating}</div>
                <StarRating rating={reviews.avg_rating} size={16} />
                <div className="reviews-avg-count">{reviews.total} đánh giá</div>
              </div>
            </div>
            {reviews.reviews.map(r => (
              <div key={r.review_id} className="review-card">
                <div className="review-card-header">
                  <div>
                    <span className="review-author">{r.customer_name || 'Khách hàng'}</span>
                    <div style={{ marginTop: 4 }}><StarRating rating={r.rating} size={12} /></div>
                  </div>
                  <span className="review-date">
                    {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(r.created_at))}
                  </span>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--shop-text-muted)' }}>
            <p style={{ fontSize: 14 }}>Chưa có đánh giá nào cho sản phẩm này.</p>
          </div>
        )}
      </div>

      {/* ═══ RELATED PRODUCTS ═══ */}
      {related.length > 0 && (
        <div className="related-section">
          <h2>Sản phẩm liên quan</h2>
          <div className="product-grid">
            {related.map(p => <RelatedCard key={p.product_id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
