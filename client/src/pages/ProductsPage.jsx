import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { productService, brandService, categoryService } from '../services/dataService';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const limit = 10;

  useEffect(() => { loadProducts(); }, [page, search]);
  useEffect(() => {
    brandService.getAll().then(setBrands).catch(() => {});
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll({ page, limit, search: search || undefined });
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

  const handleDelete = async (id) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try { await productService.delete(id); toast.success('Đã xóa'); loadProducts(); } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Sản phẩm</h1><p>{total} sản phẩm trong hệ thống</p></div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Thêm sản phẩm</button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <div className="search-input">
              <FiSearch className="search-icon" />
              <input placeholder="Tìm sản phẩm..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Sản phẩm</th><th>Thương hiệu</th><th>Danh mục</th><th>Giá nhập</th><th>Giá bán</th><th>Tồn kho</th><th>Thao tác</th></tr>
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
                  <td><button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}><FiEdit2 /></button> <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.product_id)}><FiTrash2 /></button></td>
                </tr>
              ))}
              {!products.length && <tr><td colSpan={7} className="empty-state">Không có sản phẩm</td></tr>}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="pagination">
            <div className="pagination-info">Trang {page} / {Math.ceil(total / limit)}</div>
            <div className="pagination-buttons">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
              <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Sau</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group"><label>Tên sản phẩm *</label><input className="form-control" required value={form.product_name || ''} onChange={e => setForm({...form, product_name: e.target.value})} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Thương hiệu *</label><select className="form-control" required value={form.brand_id || ''} onChange={e => setForm({...form, brand_id: e.target.value})}><option value="">Chọn...</option>{brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}</select></div>
                  <div className="form-group"><label>Danh mục *</label><select className="form-control" required value={form.category_id || ''} onChange={e => setForm({...form, category_id: e.target.value})}><option value="">Chọn...</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Giá nhập</label><input className="form-control" type="number" value={form.import_price || ''} onChange={e => setForm({...form, import_price: e.target.value})} /></div>
                  <div className="form-group"><label>Giá bán *</label><input className="form-control" type="number" required value={form.sell_price || ''} onChange={e => setForm({...form, sell_price: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Tồn kho</label><input className="form-control" type="number" value={form.stock_quantity || ''} onChange={e => setForm({...form, stock_quantity: e.target.value})} /></div>
                  <div className="form-group"><label>Dung tích</label><input className="form-control" placeholder="VD: 50ml, 30g" value={form.volume || ''} onChange={e => setForm({...form, volume: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Loại da</label><input className="form-control" placeholder="VD: Da dầu, Mọi loại da" value={form.skin_type || ''} onChange={e => setForm({...form, skin_type: e.target.value})} /></div>
                <div className="form-group"><label>Mô tả</label><textarea className="form-control" rows={3} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button><button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
