import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import { customerService } from '../services/dataService';
import { downloadCSV } from '../services/exportService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
const tierBadge = { gold: 'badge-gold', silver: 'badge-silver', standard: 'badge-secondary' };
const tierLabel = { gold: '🥇 Gold', silver: '🥈 Silver', standard: 'Standard' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const limit = 10;

  const { canCreate, canUpdate, canDelete, canExport } = usePermission();
  const _canCreate = canCreate('customers');
  const _canUpdate = canUpdate('customers');
  const _canDelete = canDelete('customers');
  const _canExport = canExport('customers');

  useEffect(() => { loadData(); }, [page, search]);

  const loadData = async () => {
    try {
      const data = await customerService.getAll({ page, limit, search: search || undefined });
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
          <div className="toolbar"><div className="search-input"><FiSearch className="search-icon" /><input placeholder="Tìm tên, SĐT, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div></div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Khách hàng</th><th>SĐT</th><th>Email</th><th>Hạng</th><th>Điểm</th><th>Tổng chi</th>
            {(_canUpdate || _canDelete) && <th>Thao tác</th>}</tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.customer_id}>
                  <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td><span className={`badge ${tierBadge[c.membership_tier]}`}>{tierLabel[c.membership_tier]}</span></td>
                  <td>{c.total_points}</td>
                  <td>{fmt(c.total_spent)}đ</td>
                  {(_canUpdate || _canDelete) && (
                    <td>
                      {_canUpdate && <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}><FiEdit2 /></button>}{' '}
                      {_canDelete && <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(c)}><FiTrash2 /></button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
