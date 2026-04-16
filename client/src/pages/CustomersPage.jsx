import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle, FiFilter, FiEye, FiLock, FiUnlock, FiKey, FiX, FiPackage, FiCalendar, FiUser, FiMail, FiPhone, FiMapPin, FiShoppingBag, FiAward } from 'react-icons/fi';
import { customerService } from '../services/dataService';
import { downloadCSV } from '../services/exportService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
const tierBadge = { gold: 'badge-gold', silver: 'badge-silver', standard: 'badge-secondary' };
const tierLabel = { gold: '🥇 Gold', silver: '🥈 Silver', standard: 'Standard' };
const statusBadge = { paid: 'badge-success', confirmed: 'badge-primary', pending: 'badge-warning', cancelled: 'badge-danger', refunded: 'badge-secondary' };
const statusLabel = { paid: 'Đã thanh toán', confirmed: 'Đã xác nhận', pending: 'Chờ xử lý', cancelled: 'Đã hủy', refunded: 'Hoàn tiền' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Customer detail drawer
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Password reset
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetPwForm, setResetPwForm] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const limit = 10;

  const { canCreate, canUpdate, canDelete, canExport } = usePermission();
  const _canCreate = canCreate('customers');
  const _canUpdate = canUpdate('customers');
  const _canDelete = canDelete('customers');
  const _canExport = canExport('customers');

  useEffect(() => { loadData(); }, [page, search, tierFilter]);

  const loadData = async () => {
    try {
      const data = await customerService.getAll({
        page, limit,
        search: search || undefined,
        membership_tier: tierFilter || undefined
      });
      setCustomers(data.customers || []); setTotal(data.total || 0);
    } catch (err) { toast.error(err.message); }
  };

  const openCreate = () => { setEditing(null); setForm({ full_name:'', phone:'', email:'', gender:'Nữ' }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c, date_of_birth: c.date_of_birth?.slice(0,10) }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await customerService.update(editing.customer_id, form); toast.success('Cập nhật thành công'); }
      else { await customerService.create(form); toast.success('Thêm khách hàng thành công'); }
      setShowModal(false); loadData();
    } catch (err) { toast.error(err.message); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await customerService.delete(deleteTarget.customer_id); toast.success('Đã xóa'); loadData(); } catch (err) { toast.error(err.message); }
    finally { setDeleteTarget(null); }
  };

  // ── Customer detail with orders ──
  const openDetail = async (c) => {
    setDetailLoading(true);
    setDetailCustomer(null);
    setShowResetPw(false);
    setResetPwForm('');
    try {
      const data = await customerService.getDetail(c.customer_id);
      setDetailCustomer(data);
    } catch (err) { toast.error(err.message); }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setDetailCustomer(null); setShowResetPw(false); };

  // ── Reset password ──
  const handleResetPassword = async () => {
    if (!detailCustomer || !resetPwForm || resetPwForm.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return;
    }
    setResetPwLoading(true);
    try {
      await customerService.resetPassword(detailCustomer.customer_id, resetPwForm);
      toast.success('Đã đặt lại mật khẩu thành công');
      setShowResetPw(false);
      setResetPwForm('');
      // Reload detail
      const data = await customerService.getDetail(detailCustomer.customer_id);
      setDetailCustomer(data);
      loadData();
    } catch (err) { toast.error(err.message); }
    finally { setResetPwLoading(false); }
  };

  // ── Lock account ──
  const handleToggleLock = async () => {
    if (!detailCustomer) return;
    try {
      const result = await customerService.toggleLock(detailCustomer.customer_id);
      toast.success(result.message);
      const data = await customerService.getDetail(detailCustomer.customer_id);
      setDetailCustomer(data);
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="page-header">
        <div><h1>Khách hàng</h1><p>{total} khách hàng thành viên</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {_canExport && (
            <button className="btn btn-outline" onClick={() => downloadCSV('/reports/export-customers', 'khach-hang.csv').then(() => toast.success('Đã tải xuống!')).catch(e => toast.error(e.message))} style={{ fontSize: 13 }}>
              📥 Xuất CSV
            </button>
          )}
          {_canCreate && (
            <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Thêm khách hàng</button>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-input" style={{ flex: 1, minWidth: 200 }}>
              <FiSearch className="search-icon" />
              <input placeholder="Tìm tên, SĐT, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiFilter size={14} style={{ color: 'var(--text-muted)' }} />
              <select className="form-control" value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(1); }}
                style={{ width: 'auto', minWidth: 140, fontSize: 13, padding: '6px 10px' }}>
                <option value="">Tất cả hạng</option>
                <option value="gold">🥇 Gold</option>
                <option value="silver">🥈 Silver</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Khách hàng</th><th>SĐT</th><th>Email</th><th>Hạng</th>
              <th>Tài khoản</th><th>Đơn hàng</th><th>Điểm</th><th>Tổng chi</th>
              <th>Thao tác</th>
            </tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.customer_id}>
                  <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td><span className={`badge ${tierBadge[c.membership_tier]}`}>{tierLabel[c.membership_tier]}</span></td>
                  <td>
                    <span className={`badge ${c.has_account ? 'badge-success' : 'badge-secondary'}`}
                          style={{ fontSize: 11 }}>
                      {c.has_account ? '✓ Đã đăng ký' : '— Chưa có'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{c.order_count || 0}</td>
                  <td>{fmt(c.total_points)}</td>
                  <td>{fmt(c.total_spent)}đ</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => openDetail(c)} title="Xem chi tiết"><FiEye /></button>
                      {_canUpdate && <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)} title="Sửa"><FiEdit2 /></button>}
                      {_canDelete && <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(c)} title="Xóa"><FiTrash2 /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Không tìm thấy khách hàng nào
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 0' }}>
            <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Trước</button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Trang {page}/{totalPages}</span>
            <button className="btn btn-sm btn-outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau →</button>
          </div>
        )}
      </div>

      {/* ═══════════ CUSTOMER DETAIL DRAWER ═══════════ */}
      {(detailCustomer || detailLoading) && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiUser /> Chi tiết khách hàng
              </h3>
              <button className="modal-close" onClick={closeDetail}>×</button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
              ) : detailCustomer ? (
                <>
                  {/* ── Profile Header ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: 'var(--bg-tertiary, #f8f9fa)', borderRadius: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                      {detailCustomer.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{detailCustomer.full_name}</h2>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span className={`badge ${tierBadge[detailCustomer.membership_tier]}`}>{tierLabel[detailCustomer.membership_tier]}</span>
                        <span className={`badge ${detailCustomer.has_account ? 'badge-success' : 'badge-secondary'}`}>
                          {detailCustomer.has_account ? '✓ Tài khoản online' : '✗ Chưa có tài khoản'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Info Grid ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <FiPhone size={14} /> <span style={{ fontWeight: 600 }}>{detailCustomer.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <FiMail size={14} /> <span>{detailCustomer.email || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <FiUser size={14} /> <span>{detailCustomer.gender || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <FiCalendar size={14} /> <span>{detailCustomer.date_of_birth ? new Date(detailCustomer.date_of_birth).toLocaleDateString('vi-VN') : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                      <FiMapPin size={14} /> <span>{detailCustomer.address || '—'}</span>
                    </div>
                  </div>

                  {/* ── Stats Cards ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: 'var(--bg-tertiary, #f8f9fa)', padding: '14px 12px', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tổng chi</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{fmt(detailCustomer.total_spent)}đ</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary, #f8f9fa)', padding: '14px 12px', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Điểm tích lũy</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{fmt(detailCustomer.total_points)}</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary, #f8f9fa)', padding: '14px 12px', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Đơn hàng</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{detailCustomer.order_count}</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary, #f8f9fa)', padding: '14px 12px', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ngày tạo</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(detailCustomer.created_at).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>

                  {/* ── Account Management ── */}
                  {_canUpdate && (
                    <div style={{ marginBottom: 20, padding: 16, border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 10 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiKey size={15} /> Quản lý tài khoản online
                      </h4>

                      {detailCustomer.has_account ? (
                        <div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Khách hàng đã có tài khoản online (đăng nhập bằng SĐT <strong>{detailCustomer.phone}</strong>).
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="btn btn-sm btn-outline" onClick={() => { setShowResetPw(!showResetPw); setResetPwForm(''); }}>
                              <FiKey size={13} /> Đặt lại mật khẩu
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={handleToggleLock}>
                              <FiLock size={13} /> Khóa tài khoản
                            </button>
                          </div>

                          {/* Reset password form */}
                          {showResetPw && (
                            <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-tertiary, #f8f9fa)', borderRadius: 8 }}>
                              <div className="form-group" style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 12, fontWeight: 600 }}>Mật khẩu mới (≥ 6 ký tự)</label>
                                <input className="form-control" type="password" placeholder="Nhập mật khẩu mới..."
                                  value={resetPwForm} onChange={e => setResetPwForm(e.target.value)}
                                  minLength={6} style={{ fontSize: 13 }} />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-sm btn-primary" onClick={handleResetPassword} disabled={resetPwLoading || resetPwForm.length < 6}>
                                  {resetPwLoading ? 'Đang xử lý...' : 'Xác nhận đặt lại'}
                                </button>
                                <button className="btn btn-sm btn-outline" onClick={() => setShowResetPw(false)}>Hủy</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Khách hàng chưa đăng ký tài khoản online. Khách hàng có thể tự đăng ký tại cửa hàng online bằng SĐT <strong>{detailCustomer.phone}</strong>.
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Order History ── */}
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiShoppingBag size={15} /> Lịch sử đơn hàng gần đây
                    </h4>
                    {detailCustomer.orders && detailCustomer.orders.length > 0 ? (
                      <div className="table-container" style={{ maxHeight: 280, overflow: 'auto' }}>
                        <table style={{ fontSize: 13 }}>
                          <thead><tr>
                            <th>Mã ĐH</th><th>Ngày</th><th>SP</th><th>Tổng</th><th>Giảm giá</th><th>Điểm</th><th>Trạng thái</th>
                          </tr></thead>
                          <tbody>
                            {detailCustomer.orders.map(o => (
                              <tr key={o.invoice_id}>
                                <td style={{ fontWeight: 600 }}>#{o.invoice_id}</td>
                                <td>{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                                <td style={{ textAlign: 'center' }}>{o.item_count}</td>
                                <td style={{ fontWeight: 600 }}>{fmt(o.final_total)}đ</td>
                                <td>{o.discount_percent > 0 ? `${o.discount_percent}% (−${fmt(o.discount_amount)}đ)` : '—'}</td>
                                <td style={{ textAlign: 'center', color: '#f59e0b' }}>+{o.points_earned}</td>
                                <td><span className={`badge ${statusBadge[o.status] || 'badge-secondary'}`} style={{ fontSize: 11 }}>{statusLabel[o.status] || o.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                        Chưa có đơn hàng nào
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CREATE/EDIT MODAL ═══════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Sửa khách hàng' : 'Thêm khách hàng'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group"><label>Họ tên *</label><input className="form-control" required value={form.full_name||''} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
                <div className="form-row">
                  <div className="form-group"><label>SĐT *</label><input className="form-control" required value={form.phone||''} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                  <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email||''} onChange={e => setForm({...form, email: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Giới tính</label><select className="form-control" value={form.gender||''} onChange={e => setForm({...form, gender: e.target.value})}><option value="Nữ">Nữ</option><option value="Nam">Nam</option></select></div>
                  <div className="form-group"><label>Ngày sinh</label><input className="form-control" type="date" value={form.date_of_birth||''} onChange={e => setForm({...form, date_of_birth: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Địa chỉ</label><input className="form-control" value={form.address||''} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div className="form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button><button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DELETE CONFIRM ═══════════ */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog-icon"><FiAlertTriangle /></div>
            <h3 className="confirm-dialog-title">Xác nhận xóa</h3>
            <p className="confirm-dialog-message">Bạn có chắc chắn muốn xóa khách hàng "{deleteTarget.full_name}"? Hành động này không thể hoàn tác.</p>
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
