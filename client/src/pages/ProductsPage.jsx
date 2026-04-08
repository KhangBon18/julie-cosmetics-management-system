import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import { productService, brandService, categoryService } from '../services/dataService';
import { downloadCSV } from '../services/exportService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sort, setSort] = useState('');
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const limit = 10;
  
  const { canCreate, canUpdate, canDelete, canExport } = usePermission();
  const _canCreate = canCreate('products');
  const _canUpdate = canUpdate('products');
  const _canDelete = canDelete('products');
  const _canExport = canExport('products');

  useEffect(() => { loadProducts(); }, [page, search, filterBrand, filterCategory, sort]);
  useEffect(() => {
    // async-parallel: load independent data in parallel
    Promise.all([
      brandService.getAll().catch(() => []),
      categoryService.getAll().catch(() => [])
    ]).then(([b, c]) => { setBrands(b); setCategories(c); });
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll({
        page, limit,
        search: search || undefined,
        brand_id: filterBrand || undefined,
        category_id: filterCategory || undefined,
        sort: sort || undefined
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) { toast.error(err.message); }
  };

  const openCreate = () => { setEditing(null); setForm({ product_name: '', brand_id: '', category_id: '', sell_price: '', import_price: '', stock_quantity: '', skin_type: '', volume: '', description: '', is_active: 1 }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await productService.update(editing.product_id, form); toast.success('Cập nhật thành công'); }
      else { await productService.create(form); toast.success('Thêm sản phẩm thành công'); }
      setShowModal(false); loadProducts();
    } catch (err) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await productService.delete(deleteTarget.product_id); toast.success('Đã xóa'); loadProducts(); } catch (err) { toast.error(err.message); }
    finally { setDeleteTarget(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Sản phẩm</h1><p>{total} sản phẩm trong hệ thống</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {_canExport && (
            <button className="btn btn-outline" onClick={() => downloadCSV('/reports/export-products', 'san-pham.csv').then(() => toast.success('Đã tải xuống!')).catch(e => toast.error(e.message))} style={{ fontSize: 13 }}>
              📥 Xuất CSV
            </button>
          )}
          {_canCreate && (
            <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Thêm sản phẩm</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div className="search-input">
              <FiSearch className="search-icon" />
              <input placeholder="Tìm sản phẩm…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} aria-label="Tìm kiếm sản phẩm" />
            </div>
            <select className="form-control" style={{ width: 150 }} value={filterBrand} onChange={e => { setFilterBrand(e.target.value); setPage(1); }}>
              <option value="">Tất cả thương hiệu</option>
              {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
            </select>
            <select className="form-control" style={{ width: 150 }} value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
              <option value="">Tất cả danh mục</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
            <select className="form-control" style={{ width: 140 }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="">Mới nhất</option>
              <option value="name">Tên A-Z</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="stock_asc">Tồn kho thấp</option>
            </select>
            {(search || filterBrand || filterCategory || sort) ? (
              <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={() => { setSearch(''); setFilterBrand(''); setFilterCategory(''); setSort(''); setPage(1); }}>
                ✕ Xóa bộ lọc
              </button>
            ) : null}
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Sản phẩm</th><th>Thương hiệu</th><th>Danh mục</th><th>Giá nhập</th><th>Giá bán</th><th>Tồn kho</th>
              {(_canUpdate || _canDelete) && <th>Thao tác</th>}</tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.product_id}>
                  <td><div style={{ fontWeight: 600 }}>{p.product_name}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{p.volume} {p.skin_type ? `· ${p.skin_type}` : ''}</div></td>
                  <td>{p.brand_name}</td>
                  <td>{p.category_name}</td>
                  <td>{fmt(p.import_price)}đ</td>
                  <td style={{ fontWeight: 600 }}>{fmt(p.sell_price)}đ</td>
                  <td><span className={`badge ${p.stock_quantity <= 10 ? 'badge-danger' : 'badge-success'}`}>{p.stock_quantity}</span></td>
                  {(_canUpdate || _canDelete) && (
                    <td>
                      {_canUpdate && <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)} aria-label="Sửa sản phẩm"><FiEdit2 aria-hidden="true" /></button>}{' '}
                      {_canDelete && <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(p)} aria-label="Xóa sản phẩm"><FiTrash2 aria-hidden="true" /></button>}
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 ? <tr><td colSpan={7} className="empty-state">Không có sản phẩm</td></tr> : null}
            </tbody>
          </table>
        </div>
        {total > limit ? (
          <nav className="pagination" aria-label="Phân trang">
            <div className="pagination-info">Trang {page} / {Math.ceil(total / limit)}</div>
            <div className="pagination-buttons">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
              <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Sau</button>
            </div>
          </nav>
        ) : null}
      </div>

      {showModal ? (
        <div className="modal-overlay" onClick={() => setShowModal(false)} role="dialog" aria-modal="true" aria-label={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ overscrollBehavior: 'contain' }}>
            <div className="modal-header"><h3>{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3><button className="modal-close" onClick={() => setShowModal(false)} aria-label="Đóng">×</button></div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group"><label htmlFor="prd-name">Tên sản phẩm *</label><input id="prd-name" className="form-control" required value={form.product_name || ''} onChange={e => setForm({...form, product_name: e.target.value})} autoComplete="off" /></div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="prd-brand">Thương hiệu *</label><select id="prd-brand" className="form-control" required value={form.brand_id || ''} onChange={e => setForm({...form, brand_id: e.target.value})}><option value="">Chọn…</option>{brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}</select></div>
                  <div className="form-group"><label htmlFor="prd-cat">Danh mục *</label><select id="prd-cat" className="form-control" required value={form.category_id || ''} onChange={e => setForm({...form, category_id: e.target.value})}><option value="">Chọn…</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="prd-import">Giá nhập</label><input id="prd-import" className="form-control" type="number" inputMode="numeric" value={form.import_price || ''} onChange={e => setForm({...form, import_price: e.target.value})} autoComplete="off" /></div>
                  <div className="form-group"><label htmlFor="prd-sell">Giá bán *</label><input id="prd-sell" className="form-control" type="number" inputMode="numeric" required value={form.sell_price || ''} onChange={e => setForm({...form, sell_price: e.target.value})} autoComplete="off" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="prd-stock">Tồn kho</label><input id="prd-stock" className="form-control" type="number" inputMode="numeric" value={form.stock_quantity || ''} onChange={e => setForm({...form, stock_quantity: e.target.value})} autoComplete="off" /></div>
                  <div className="form-group"><label htmlFor="prd-volume">Dung tích</label><input id="prd-volume" className="form-control" placeholder="VD: 50ml, 30g…" value={form.volume || ''} onChange={e => setForm({...form, volume: e.target.value})} autoComplete="off" /></div>
                </div>
                <div className="form-group"><label htmlFor="prd-skin">Loại da</label><input id="prd-skin" className="form-control" placeholder="VD: Da dầu, Mọi loại da…" value={form.skin_type || ''} onChange={e => setForm({...form, skin_type: e.target.value})} autoComplete="off" /></div>
                <div className="form-group"><label htmlFor="prd-desc">Mô tả</label><textarea id="prd-desc" className="form-control" rows={3} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button><button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button></div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog-icon"><FiAlertTriangle /></div>
            <h3 className="confirm-dialog-title">Xác nhận xóa</h3>
            <p className="confirm-dialog-message">Bạn có chắc chắn muốn xóa sản phẩm "{deleteTarget.product_name}"? Hành động này không thể hoàn tác.</p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
