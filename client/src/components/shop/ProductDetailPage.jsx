import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiArrowLeft, FiMinus, FiPlus } from 'react-icons/fi';
import publicService from '../../services/publicService';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    setLoading(true);
    publicService.getProduct(id)
      .then(setProduct)
      .catch(() => toast.error('Không tìm thấy sản phẩm'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    addToCart(product, qty);
    toast.success(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`);
  };

  if (loading) return <div className="shop-container"><div className="loading-container"><div className="spinner" /></div></div>;
  if (!product) return <div className="shop-container"><div className="empty-state"><h3>Sản phẩm không tồn tại</h3></div></div>;

  return (
    <div className="shop-container">
      <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', marginBottom: 16, fontSize: 14 }}>
        <FiArrowLeft /> Quay lại
      </Link>

      <div className="product-detail">
        <div className="product-detail-image">
          <img src={product.image_url} alt={product.product_name} onError={e => { e.target.src = 'https://via.placeholder.com/400x400.png?text=Julie+Cosmetics'; }} />
        </div>
        <div className="product-detail-info">
          <span className="product-detail-brand">{product.brand_name}</span>
          <h1>{product.product_name}</h1>
          <div className="product-detail-price">{fmt(product.sell_price)}đ</div>

          <p className="product-detail-desc">{product.description}</p>

          <div className="product-detail-meta">
            <div><span>Thương hiệu</span><span>{product.brand_name}</span></div>
            <div><span>Danh mục</span><span>{product.category_name}</span></div>
            {product.volume && <div><span>Dung tích</span><span>{product.volume}</span></div>}
            {product.skin_type && <div><span>Loại da</span><span>{product.skin_type}</span></div>}
            <div><span>Tình trạng</span><span style={{ color: product.stock_quantity > 0 ? '#059669' : '#ef4444' }}>{product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}</span></div>
          </div>

          <div className="product-detail-actions">
            <div className="qty-selector">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus /></button>
              <input type="number" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
              <button onClick={() => setQty(q => q + 1)}><FiPlus /></button>
            </div>
            <button className="btn-add-cart-lg" onClick={handleAdd} disabled={product.stock_quantity <= 0}>
              <FiShoppingCart /> Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
