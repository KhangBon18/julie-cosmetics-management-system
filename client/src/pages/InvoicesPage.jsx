import { useState, useEffect } from 'react';
import { invoiceService, customerService, productService, publicSettingService } from '../services/dataService';
import { downloadCSV } from '../services/exportService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';
import { calculateLoyaltyPoints, formatPointsRule } from '../utils/crmRules';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [showForm, setShowForm] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);

  // Form states
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [crmSettings, setCrmSettings] = useState({});

  const { canCreate, canExport } = usePermission();
  const _canCreate = canCreate('invoices');
  const _canExport = canExport('invoices');

  useEffect(() => { loadData(); }, [page]);

  const loadData = async () => {
    try {
      const data = await invoiceService.getAll({ page, limit });
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch (err) { toast.error(err.message); }
  };

  const openForm = async () => {
    try {
      const [custData, prodData] = await Promise.all([
        customerService.getAll({ limit: 200 }),
        productService.getAll({ limit: 500 })
      ]);
      const publicSettings = await publicSettingService.getAll().catch(() => null);
      setCustomers(custData.customers || []);
      setProducts((prodData.products || []).filter(p => p.is_active && p.stock_quantity > 0));
      setCrmSettings(publicSettings || {});
      setShowForm(true);
    } catch (err) { toast.error(err.message); }
  };

  const handleCustomerChange = (customerId) => {
    setSelectedCustomer(customerId);
    if (customerId) {
      const c = customers.find(c => c.customer_id == customerId);
      setCustomerInfo(c || null);
    } else {
      setCustomerInfo(null);
    }
  };

  const getDiscount = () => {
    if (!customerInfo) return 0;
    if (customerInfo.membership_tier === 'gold') return Number(crmSettings['crm.gold_discount'] || 5);
    if (customerInfo.membership_tier === 'silver') return Number(crmSettings['crm.silver_discount'] || 2);
    return 0;
  };

  const addToCart = (product) => {
    const existing = cartItems.find(i => i.product_id === product.product_id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        return toast.warning('Vượt quá số lượng tồn kho');
      }
      setCartItems(cartItems.map(i =>
        i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.product_id,
        product_name: product.product_name,
        unit_price: parseFloat(product.sell_price),
        quantity: 1,
        stock: product.stock_quantity
      }]);
    }
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) {
      setCartItems(cartItems.filter(i => i.product_id !== productId));
    } else {
      setCartItems(cartItems.map(i =>
        i.product_id === productId ? { ...i, quantity: Math.min(qty, i.stock) } : i
      ));
    }
  };

  const subtotal = cartItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const discountPct = getDiscount();
  const discountAmount = Math.round(subtotal * discountPct / 100);
  const finalTotal = subtotal - discountAmount;
  const pointsEarned = customerInfo ? calculateLoyaltyPoints(finalTotal, crmSettings) : 0;
  const pointsRuleLabel = formatPointsRule(crmSettings);

  const handleSubmit = async () => {
    if (!cartItems.length) return toast.error('Vui lòng thêm sản phẩm');
    setSubmitting(true);
    try {
      await invoiceService.create({
        customer_id: selectedCustomer || null,
        payment_method: paymentMethod,
        note: note || null,
        items: cartItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity
        }))
      });
      toast.success('Tạo hóa đơn thành công!');
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi tạo hóa đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setCartItems([]);
    setSelectedCustomer('');
    setCustomerInfo(null);
    setPaymentMethod('cash');
    setNote('');
    setSearchProduct('');
  };

  const viewDetail = async (id) => {
    try {
      const data = await invoiceService.getById(id);
      setViewInvoice(data);
    } catch (err) { toast.error(err.message); }
  };

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const tierLabels = { standard: 'Thường', silver: '🥈 Bạc', gold: '🥇 Vàng' };

  return (
    <div>
      <div className="page-header">
        <div><h1>Hóa đơn bán hàng</h1><p>{total} hóa đơn</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {_canExport && (
            <button className="btn btn-outline" onClick={() => downloadCSV(`/reports/export-invoices?year=${new Date().getFullYear()}&scope=all`, `hoa-don-${new Date().getFullYear()}.csv`).then(() => toast.success('Đã tải xuống!')).catch(e => toast.error(e.message))} style={{ fontSize: 13 }}>
              📥 Xuất CSV
            </button>
          )}
          {_canCreate && (
            <button className="btn btn-primary" onClick={() => showForm ? resetForm() : openForm()}>
              {showForm ? '✕ Đóng' : '+ Tạo hóa đơn'}
            </button>
          )}
        </div>
      </div>

      {/* ═══ FORM TẠO HÓA ĐƠN ═══ */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #059669' }}>
          <div className="card-header"><h3>🧾 Tạo hóa đơn mới</h3></div>
          <div className="card-body">
            {/* Chọn KH + Thanh toán */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label>Khách hàng</label>
                <select className="form-control" value={selectedCustomer} onChange={e => handleCustomerChange(e.target.value)}>
                  <option value="">— Khách vãng lai —</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.full_name} ({c.phone}) - {tierLabels[c.membership_tier]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Phương thức thanh toán</label>
                <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">💵 Tiền mặt</option>
                  <option value="card">💳 Thẻ</option>
                  <option value="transfer">🏦 Chuyển khoản</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <input className="form-control" value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tùy chọn)" />
              </div>
            </div>

            {/* Thông tin KH thành viên */}
            {customerInfo && (
              <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', gap: 24, fontSize: 13 }}>
                <span>🏷 Hạng: <strong>{tierLabels[customerInfo.membership_tier]}</strong></span>
                <span>⭐ Điểm: <strong>{customerInfo.total_points}</strong></span>
                <span>💰 Tổng chi: <strong>{fmt(customerInfo.total_spent)}đ</strong></span>
                {discountPct > 0 && <span style={{ color: '#059669', fontWeight: 700 }}>🎉 Giảm giá {discountPct}%</span>}
              </div>
            )}

            {/* Tìm kiếm SP */}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Tìm sản phẩm</label>
              <input className="form-control" value={searchProduct} onChange={e => setSearchProduct(e.target.value)} placeholder="Nhập tên sản phẩm để tìm..." />
            </div>

            {searchProduct && (
              <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 16 }}>
                {filteredProducts.slice(0, 20).map(p => (
                  <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => addToCart(p)}>
                    <div>
                      <strong>{p.product_name}</strong>
                      <span style={{ color: '#64748b', marginLeft: 8, fontSize: 12 }}>Tồn: {p.stock_quantity}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>{fmt(p.sell_price)}đ</div>
                  </div>
                ))}
                {!filteredProducts.length && <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không tìm thấy sản phẩm</div>}
              </div>
            )}

            {/* Giỏ hàng */}
            {cartItems.length > 0 && (
              <div className="table-container" style={{ marginBottom: 16 }}>
                <table>
                  <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr></thead>
                  <tbody>
                    {cartItems.map(item => (
                      <tr key={item.product_id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td>{fmt(item.unit_price)}đ</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>−</button>
                            <input type="number" className="form-control" style={{ width: 60, textAlign: 'center' }} value={item.quantity} min={1} max={item.stock}
                              onChange={e => updateQuantity(item.product_id, parseInt(e.target.value) || 0)} />
                            <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{fmt(item.unit_price * item.quantity)}đ</td>
                        <td><button className="btn btn-outline" style={{ color: '#ef4444', padding: '2px 8px' }} onClick={() => updateQuantity(item.product_id, 0)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tổng cộng */}
            {cartItems.length > 0 && (
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Tổng tiền hàng:</span><span>{fmt(subtotal)}đ</span>
                </div>
                {discountPct > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#059669' }}>
                    <span>Giảm giá ({discountPct}%):</span><span>-{fmt(discountAmount)}đ</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, color: '#2563eb', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                  <span>Thành tiền:</span><span>{fmt(finalTotal)}đ</span>
                </div>
                {customerInfo && (
                  <div style={{ textAlign: 'right', fontSize: 13, color: '#059669', marginTop: 4 }}>
                    +{pointsEarned} điểm tích lũy
                    <div style={{ color: '#64748b', marginTop: 2 }}>Quy tắc CRM: {pointsRuleLabel}</div>
                  </div>
                )}
                <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b', marginTop: 6 }}>
                  Đơn giá, giảm giá và thành tiền chính thức sẽ được server xác nhận lại khi lưu hóa đơn.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !cartItems.length}>
                {submitting ? 'Đang tạo...' : '✅ Xác nhận tạo hóa đơn'}
              </button>
              <button className="btn btn-outline" onClick={resetForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHI TIẾT HÓA ĐƠN (Modal) ═══ */}
      {viewInvoice && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>📄 Hóa đơn #{viewInvoice.invoice_id}</h3>
            <button className="btn btn-outline" onClick={() => setViewInvoice(null)}>✕ Đóng</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16, fontSize: 14 }}>
              <div><strong>Khách hàng:</strong> {viewInvoice.customer_name || 'Vãng lai'}</div>
              <div><strong>Thanh toán:</strong> {viewInvoice.payment_method}</div>
              <div><strong>Ngày:</strong> {new Date(viewInvoice.created_at).toLocaleString('vi-VN')}</div>
            </div>
            <table>
              <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {(viewInvoice.items || []).map((it, i) => (
                  <tr key={i}><td>{it.product_name}</td><td>{fmt(it.unit_price)}đ</td><td>{it.quantity}</td><td style={{ fontWeight: 600 }}>{fmt(it.subtotal)}đ</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 12, fontSize: 16, fontWeight: 700, color: '#2563eb' }}>
              Tổng: {fmt(viewInvoice.final_total)}đ
              {viewInvoice.discount_percent > 0 && <span style={{ fontSize: 13, color: '#059669', marginLeft: 8 }}>(giảm {viewInvoice.discount_percent}%)</span>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DANH SÁCH HÓA ĐƠN ═══ */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Mã HĐ</th><th>Khách hàng</th><th>Tổng tiền</th><th>Giảm giá</th><th>Thành tiền</th><th>Điểm</th><th>Thanh toán</th><th>Ngày</th><th></th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.invoice_id}>
                  <td>#{inv.invoice_id}</td>
                  <td>{inv.customer_name || <span style={{ color: '#94a3b8' }}>Vãng lai</span>}</td>
                  <td>{fmt(inv.subtotal)}đ</td>
                  <td>{inv.discount_percent > 0 ? `${inv.discount_percent}% (-${fmt(inv.discount_amount)}đ)` : '—'}</td>
                  <td style={{ fontWeight: 600, color: '#059669' }}>{fmt(inv.final_total)}đ</td>
                  <td>{inv.points_earned > 0 ? `+${inv.points_earned}` : '—'}</td>
                  <td><span className={`badge ${inv.payment_method === 'cash' ? 'badge-success' : inv.payment_method === 'card' ? 'badge-info' : 'badge-purple'}`}>{inv.payment_method}</span></td>
                  <td>{new Date(inv.created_at).toLocaleDateString('vi-VN')}</td>
                  <td><button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => viewDetail(inv.invoice_id)}>👁</button></td>
                </tr>
              ))}
              {!invoices.length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có hóa đơn nào</td></tr>}
            </tbody>
          </table>
        </div>
        {total > limit && <div className="pagination"><div className="pagination-info">Trang {page}/{Math.ceil(total / limit)}</div><div className="pagination-buttons"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button><button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Sau</button></div></div>}
      </div>
    </div>
  );
}
