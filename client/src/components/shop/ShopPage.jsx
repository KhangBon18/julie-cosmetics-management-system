import { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import publicService from '../../services/publicService';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

const SORT_OPTIONS = [
  { value: '', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'name', label: 'Tên A-Z' }
];

const ITEMS_PER_PAGE = 12;

function StarRating({ rating, count }) {
  const full = Math.floor(rating);
  return (
    <div className="product-card-rating">
      <div className="stars">
        {[1,2,3,4,5].map(i => <span key={i} className={i <= full ? '' : 'stars-empty'}>★</span>)}
      </div>
      {count > 0 && <span className="rating-count">({count})</span>}
    </div>
  );
}

function SkeletonGrid({ count = 12 }) {
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

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  const search = searchParams.get('search') || '';
  const selectedCat = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    publicService.getCategoriesTree().then(setCategoriesTree).catch(() => {});
    publicService.getBrands().then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) updateParam('search', searchInput);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await publicService.getProducts({
        page, limit: ITEMS_PER_PAGE,
        category_id: selectedCat || undefined,
        brand_id: selectedBrand || undefined,
        search: search || undefined,
        sort: sort || undefined
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, selectedCat, selectedBrand, search, sort]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const updateParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  const clearFilters = () => { setSearchParams({}); setSearchInput(''); };
  const hasFilters = search || selectedCat || selectedBrand || sort;

  const handleAddCart = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    if (product.stock_quantity <= 0) { toast.error('Sản phẩm đã hết hàng'); return; }
    addToCart(product);
    toast.success('Đã thêm vào giỏ hàng!');
  };

  // Find the selected parent category to show subcategories
  const selectedParent = categoriesTree.find(c => String(c.category_id) === selectedCat);
  const subcategories = selectedParent?.children || [];

  // All categories flattened (parents only for the dropdown)
  const allCategories = categoriesTree;

  // Find labels for chips
  const findCategoryName = (id) => {
    for (const cat of categoriesTree) {
      if (String(cat.category_id) === id) return cat.category_name;
      const sub = cat.children?.find(c => String(c.category_id) === id);
      if (sub) return `${cat.category_name} › ${sub.category_name}`;
    }
    return '';
  };

  // Build active filter chips
  const chips = [];
  if (selectedCat) {
    const name = findCategoryName(selectedCat);
    if (name) chips.push({ label: name, key: 'category' });
  }
  if (selectedBrand) {
    const br = brands.find(b => String(b.brand_id) === selectedBrand);
    if (br) chips.push({ label: br.brand_name, key: 'brand' });
  }
  if (sort) {
    const s = SORT_OPTIONS.find(o => o.value === sort);
    if (s) chips.push({ label: s.label, key: 'sort' });
  }
  if (search) chips.push({ label: `"${search}"`, key: 'search' });

  return (
    <div style={{ background: 'var(--shop-bg)', minHeight: '60vh' }}>
      <div className="shop-container">
        {/* Section header */}
        <div className="listing-header" style={{ marginTop: 8 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'var(--shop-text-dark)', marginBottom: 4 }}>
              Sản phẩm
            </h1>
            <span className="listing-count">{total} sản phẩm</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="filter-search">
            <FiSearch className="filter-search-icon" />
            <input placeholder="Tìm kiếm sản phẩm, thương hiệu..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          </div>
          <select className="filter-select" value={selectedCat} onChange={e => updateParam('category', e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {allCategories.map(c => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name} ({c.total_product_count || c.product_count})
              </option>
            ))}
          </select>
          <select className="filter-select" value={selectedBrand} onChange={e => updateParam('brand', e.target.value)}>
            <option value="">Tất cả thương hiệu</option>
            {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
          </select>
          <select className="filter-select" value={sort} onChange={e => updateParam('sort', e.target.value)}>
            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {/* Subcategory chips — shown when a parent category is selected */}
        {subcategories.length > 0 && (
          <div className="filter-chips" style={{ marginTop: 0, marginBottom: 16 }}>
            <span
              className={`filter-chip ${!categoriesTree.some(c => c.children?.some(ch => String(ch.category_id) === selectedCat)) ? 'filter-chip-active' : ''}`}
              onClick={() => updateParam('category', selectedParent.category_id)}
              style={{ cursor: 'pointer' }}
            >
              Tất cả {selectedParent.category_name}
            </span>
            {subcategories.map(sub => (
              <span
                key={sub.category_id}
                className={`filter-chip ${String(sub.category_id) === selectedCat ? 'filter-chip-active' : ''}`}
                onClick={() => updateParam('category', sub.category_id)}
                style={{ cursor: 'pointer' }}
              >
                {sub.category_name} {sub.product_count > 0 && <span style={{ opacity: 0.6, fontSize: 11 }}>({sub.product_count})</span>}
              </span>
            ))}
          </div>
        )}

        {/* Active filter chips */}
        {chips.length > 0 && (
          <div className="filter-chips">
            {chips.map(c => (
              <span key={c.key} className="filter-chip" onClick={() => { updateParam(c.key, ''); if (c.key === 'search') setSearchInput(''); }}>
                {c.label} <FiX size={12} />
              </span>
            ))}
            <span className="filter-chip filter-chip-clear" onClick={clearFilters}>Xóa tất cả</span>
          </div>
        )}

        {/* Product grid */}
        {loading ? <SkeletonGrid count={8} /> : (
          <>
            <div className="product-grid">
              {products.map(p => {
                const isNew = p.created_at && (Date.now() - new Date(p.created_at).getTime()) < 30 * 86400000;
                const lowStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
                const outOfStock = p.stock_quantity <= 0;
                return (
                  <div key={p.product_id} className="product-card">
                    <div className="product-card-image">
                      <img src={p.image_url} alt={p.product_name}
                        onError={e => { e.target.src = 'https://via.placeholder.com/300x300.png?text=Julie'; }} />
                      <div className="product-card-badges">
                        {isNew && <span className="card-badge card-badge-new">Mới</span>}
                        {lowStock && <span className="card-badge card-badge-low-stock">Sắp hết</span>}
                        {outOfStock && <span className="card-badge card-badge-out">Hết hàng</span>}
                      </div>
                      {!outOfStock && (
                        <div className="product-card-quick">
                          <button className="btn-quick-add" onClick={e => handleAddCart(e, p)}>
                            <FiShoppingCart size={14} /> Thêm vào giỏ
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="product-card-body">
                      <div className="product-card-brand">{p.brand_name}</div>
                      <div className="product-card-title">
                        <Link to={`/shop/product/${p.product_id}`}>{p.product_name}</Link>
                      </div>
                      {p.volume && <div style={{ fontSize: 11, color: 'var(--shop-text-muted)', marginBottom: 4 }}>{p.volume}</div>}
                      {p.avg_rating > 0 && <StarRating rating={Number(p.avg_rating)} count={p.review_count || 0} />}
                      <div className="product-card-price">{fmt(p.sell_price)}đ</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="shop-pagination">
                <button disabled={page <= 1} onClick={() => updateParam('page', page - 1)}>
                  <FiChevronLeft /> Trước
                </button>
                <span className="page-info">Trang {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => updateParam('page', page + 1)}>
                  Sau <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !products.length && (
          <div className="cart-empty">
            <div className="cart-empty-icon">🔍</div>
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
            {hasFilters && <button className="btn-section" onClick={clearFilters} style={{ marginTop: 16 }}>Xóa bộ lọc</button>}
          </div>
        )}
      </div>
    </div>
  );
}
