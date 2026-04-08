import { useState, useEffect } from 'react';
import { importService, supplierService, productService } from '../services/dataService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function ImportsPage() {
  const [imports, setImports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [showForm, setShowForm] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);

  // Form
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [note, setNote] = useState('');
  const [importItems, setImportItems] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { canCreate } = usePermission();
  const _canCreate = canCreate('imports');

  useEffect(() => { loadData(); }, [page]);
  const loadData = async () => {
    try {
      const d = await importService.getAll({ page, limit });
      setImports(d.imports || []); setTotal(d.total || 0);
    } catch (e) { toast.error(e.message); }
  };

  const openForm = async () => {
    try {
      const [supData, prodData] = await Promise.all([
        supplierService.getAll({ limit: 200 }),
        productService.getAll({ limit: 500 })
      ]);
      setSuppliers(supData.suppliers || supData || []);
      setProducts(prodData.products || []);
      setShowForm(true);
    } catch (err) { toast.error(err.message); }
  };

  const addItem = (product) => {
    const existing = importItems.find(i => i.product_id === product.product_id);
    if (existing) {
      setImportItems(importItems.map(i =>
        i.product_id === product.product_id ? { ...i, quantity: i.quantity + 10 } : i
      ));
    } else {
      setImportItems([...importItems, {
        product_id: product.product_id,
        product_name: product.product_name,
        unit_price: parseFloat(product.import_price) || 0,
        quantity: 10
      }]);
    }
  };

  const updateItem = (productId, field, value) => {
    setImportItems(importItems.map(i =>
      i.product_id === productId ? { ...i, [field]: value } : i
    ));
  };

  const removeItem = (productId) => {
    setImportItems(importItems.filter(i => i.product_id !== productId));
  };

  const totalAmount = importItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedSupplier) return toast.error('Vui lòng chọn nhà cung cấp');
    if (!importItems.length) return toast.error('Vui lòng thêm sản phẩm');
    setSubmitting(true);
    try {
      await importService.create({
        supplier_id: selectedSupplier,
        note: note || null,
        items: importItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      });
      toast.success('Tạo phiếu nhập kho thành công!');
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi tạo phiếu nhập');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setImportItems([]);
    setSelectedSupplier('');
    setNote('');
    setSearchProduct('');
  };

  const viewDetail = async (id) => {
    try {
      const data = await importService.getById(id);
      setViewReceipt(data);
    } catch (err) { toast.error(err.message); }
  };

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div><h1>Phiếu nhập kho</h1><p>{total} phiếu nhập</p></div>
        {_canCreate && (
          <button className="btn btn-primary" onClick={() => showForm ? resetForm() : openForm()}>
            {showForm ? '✕ Đóng' : '+ Tạo phiếu nhập'}
          </button>
        )}
      </div>

      {/* ═══ FORM NHẬP KHO ═══ */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #f59e0b' }}>
          <div className="card-header"><h3>📦 Lập phiếu nhập kho</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label>Nhà cung cấp *</label>
                <select className="form-control" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} required>
                  <option value="">— Chọn nhà cung cấp —</option>
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <input className="form-control" value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tùy chọn)" />
              </div>
            </div>

            {/* Tìm SP */}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Tìm sản phẩm để thêm</label>
              <input className="form-control" value={searchProduct} onChange={e => setSearchProduct(e.target.value)} placeholder="Nhập tên sản phẩm..." />
            </div>

            {searchProduct && (
              <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 16 }}>
                {filteredProducts.slice(0, 20).map(p => (
                  <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => addItem(p)}>
                    <div>
                      <strong>{p.product_name}</strong>
                      <span style={{ color: '#64748b', marginLeft: 8, fontSize: 12 }}>Tồn: {p.stock_quantity}</span>
                    </div>
                    <div style={{ color: '#f59e0b', fontWeight: 600 }}>{fmt(p.import_price)}đ</div>
                  </div>
                ))}
              </div>
            )}

            {/* Danh sách SP nhập */}
            {importItems.length > 0 && (
              <div className="table-container" style={{ marginBottom: 16 }}>
                <table>
                  <thead><tr><th>Sản phẩm</th><th>Giá nhập</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr></thead>
                  <tbody>
                    {importItems.map(item => (
                      <tr key={item.product_id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td>
                          <input type="number" className="form-control" style={{ width: 120 }} value={item.unit_price}
                            onChange={e => updateItem(item.product_id, 'unit_price', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td>
                          <input type="number" className="form-control" style={{ width: 80 }} value={item.quantity} min={1}
                            onChange={e => updateItem(item.product_id, 'quantity', parseInt(e.target.value) || 1)} />
                        </td>
                        <td style={{ fontWeight: 600 }}>{fmt(item.unit_price * item.quantity)}đ</td>
                        <td><button className="btn btn-outline" style={{ color: '#ef4444', padding: '2px 8px' }} onClick={() => removeItem(item.product_id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {importItems.length > 0 && (
              <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 700, color: '#f59e0b', marginBottom: 16 }}>
                Tổng phiếu nhập: {fmt(totalAmount)}đ
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !importItems.length || !selectedSupplier}>
                {submitting ? 'Đang tạo...' : '✅ Xác nhận nhập kho'}
              </button>
              <button className="btn btn-outline" onClick={resetForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHI TIẾT PHIẾU NHẬP ═══ */}
      {viewReceipt && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>📄 Phiếu nhập #{viewReceipt.receipt_id}</h3>
            <button className="btn btn-outline" onClick={() => setViewReceipt(null)}>✕ Đóng</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16, fontSize: 14 }}>
              <div><strong>NCC:</strong> {viewReceipt.supplier_name}</div>
              <div><strong>Người tạo:</strong> {viewReceipt.created_by_name || '—'}</div>
              <div><strong>Ngày:</strong> {new Date(viewReceipt.created_at).toLocaleString('vi-VN')}</div>
            </div>
            <table>
              <thead><tr><th>Sản phẩm</th><th>Giá nhập</th><th>SL</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {(viewReceipt.items || []).map((it, i) => (
                  <tr key={i}><td>{it.product_name}</td><td>{fmt(it.unit_price)}đ</td><td>{it.quantity}</td><td style={{ fontWeight: 600 }}>{fmt(it.unit_price * it.quantity)}đ</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 12, fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>
              Tổng: {fmt(viewReceipt.total_amount)}đ
            </div>
          </div>
        </div>
      )}

      {/* ═══ DANH SÁCH ═══ */}
      <div className="card"><div className="table-container">
        <table>
          <thead><tr><th>Mã</th><th>Nhà cung cấp</th><th>Người tạo</th><th>Tổng tiền</th><th>Ghi chú</th><th>Ngày nhập</th><th></th></tr></thead>
          <tbody>
            {imports.map(i => (
              <tr key={i.receipt_id}>
                <td>#{i.receipt_id}</td>
                <td style={{ fontWeight: 600 }}>{i.supplier_name}</td>
                <td>{i.created_by_name || '—'}</td>
                <td style={{ fontWeight: 600, color: '#f59e0b' }}>{fmt(i.total_amount)}đ</td>
                <td>{i.note || '—'}</td>
                <td>{new Date(i.created_at).toLocaleDateString('vi-VN')}</td>
                <td><button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => viewDetail(i.receipt_id)}>👁</button></td>
              </tr>
            ))}
            {!imports.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có phiếu nhập nào</td></tr>}
          </tbody>
        </table>
      </div></div>
      {total > limit && <div className="pagination"><div className="pagination-info">Trang {page}/{Math.ceil(total / limit)}</div><div className="pagination-buttons"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button><button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Sau</button></div></div>}
      </div>
  );
}
