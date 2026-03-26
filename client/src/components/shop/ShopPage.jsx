import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiShoppingCart } from 'react-icons/fi';
import publicService from '../../services/publicService';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    publicService.getCategories().then(setCategories).catch(() => {});
    loadProducts();
  }, []);

  useEffect(() => { loadProducts(); }, [selectedCat, search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await publicService.getProducts({
        limit: 40,
        category_id: selectedCat || undefined,
        search: search || undefined
      });
      setProducts(data.products || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success('Đã thêm vào giỏ hàng!');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="shop-hero">
        <h1>Mỹ Phẩm <span>Chính Hãng</span></h1>
        <p>Khám phá bộ sưu tập nước hoa & chăm sóc da cao cấp từ các thương hiệu hàng đầu thế giới</p>
        <div className="shop-hero-search">
          <FiSearch className="search-icon" />
          <input
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </section>

      <div className="shop-container">
        {/* Category Filter */}
        <div className="category-chips">
          <button className={`category-chip${!selectedCat ? ' active' : ''}`} onClick={() => setSelectedCat(null)}>
            Tất cả
          </button>
          {categories.map(c => (
            <button
              key={c.category_id}
              className={`category-chip${selectedCat === c.category_id ? ' active' : ''}`}
              onClick={() => setSelectedCat(c.category_id)}
            >
              {c.category_name}
            </button>
          ))}
        </div>

        <h2 className="shop-section-title">
          {selectedCat ? categories.find(c => c.category_id === selectedCat)?.category_name : 'Sản phẩm nổi bật'}
        </h2>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <Link to={`/shop/product/${p.product_id}`} key={p.product_id} className="product-card">
                <div className="product-card-image">
                  <img src={p.image_url} alt={p.product_name} onError={e => { e.target.src = 'https://via.placeholder.com/300x300.png?text=Julie+Cosmetics'; }} />
                  <span className="product-card-brand">{p.brand_name}</span>
                </div>
                <div className="product-card-body">
                  <div className="product-card-name">{p.product_name}</div>
                  <div className="product-card-category">{p.category_name}</div>
                  <div className="product-card-footer">
                    <div className="product-card-price">{fmt(p.sell_price)}<small>đ</small></div>
                    <button className="btn-add-cart" onClick={e => handleAddCart(e, p)}>
                      <FiShoppingCart /> Thêm
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !products.length && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Không tìm thấy sản phẩm</h3>
            <p>Hãy thử tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </div>
    </div>
  );
}
