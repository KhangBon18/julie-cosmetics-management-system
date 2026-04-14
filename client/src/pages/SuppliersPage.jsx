import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { supplierService } from '../services/dataService';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    supplier_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true
  });
  const limit = 10;

  const { canCreate, canUpdate, canDelete } = usePermission();
  const _canCreate = canCreate('suppliers');
  const _canUpdate = canUpdate('suppliers');
  const _canDelete = canDelete('suppliers');

  useEffect(() => { loadSuppliers(); }, [page, search, statusFilter, sort]);

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAll({
        page,
        limit,
        search: search || undefined,
        is_active: statusFilter || undefined,
        sort
      });
      setSuppliers(data.suppliers || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      supplier_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      is_active: true
    });
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      supplier_name: supplier.supplier_name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      is_active: Boolean(supplier.is_active)
    });
    setShowModal(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        is_active: Boolean(form.is_active)
      };
      if (editing) {
        await supplierService.update(editing.supplier_id, payload);
        toast.success('Cập nhật nhà cung cấp thành công');
      } else {
        await supplierService.create(payload);
        toast.success('Tạo nhà cung cấp thành công');
      }
      setShowModal(false);
      loadSuppliers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supplierService.delete(deleteTarget.supplier_id);
      toast.success('Đã ẩn nhà cung cấp khỏi danh sách hoạt động');
      setDeleteTarget(null);
      loadSuppliers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="page-header">
        <div><h1>Nhà cung cấp</h1><p>{total} nhà cung cấp</p></div>
        {_canCreate ? <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Thêm NCC</button> : null}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div className="search-input">
              <FiSearch className="search-icon" />
              <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm theo tên, liên hệ, SĐT, email..." />
            </div>
            <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="1">Đang hoạt động</option>
              <option value="0">Ngừng hợp tác</option>
            </select>
            <select className="form-control" style={{ width: 160 }} value={sort} onChange={event => setSort(event.target.value)}>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            {(search || statusFilter || sort !== 'name_asc') ? (
              <button className="btn btn-outline" onClick={() => { setSearch(''); setStatusFilter(''); setSort('name_asc'); setPage(1); }}>
                ✕ Xóa bộ lọc
              </button>
            ) : null}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nhà cung cấp</th>
                <th>Người liên hệ</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th>Trạng thái</th>
                {(_canUpdate || _canDelete) ? <th>Thao tác</th> : null}
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.supplier_id}>
                  <td style={{ fontWeight: 600 }}>{supplier.supplier_name}</td>
                  <td>{supplier.contact_person || '—'}</td>
                  <td>{supplier.phone || '—'}</td>
                  <td>{supplier.email || '—'}</td>
                  <td style={{ maxWidth: 240 }}>{supplier.address || '—'}</td>
                  <td><span className={`badge ${supplier.is_active ? 'badge-success' : 'badge-danger'}`}>{supplier.is_active ? 'Đang HĐ' : 'Ngừng'}</span></td>
                  {(_canUpdate || _canDelete) ? (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {_canUpdate ? <button className="btn btn-sm btn-outline" onClick={() => openEdit(supplier)}><FiEdit2 /></button> : null}
                        {_canDelete ? <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(supplier)}><FiTrash2 /></button> : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!suppliers.length ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Không có nhà cung cấp phù hợp</td></tr> : null}
            </tbody>
          </table>
        </div>

        {total > limit ? (
          <div className="pagination">
            <div className="pagination-info">Trang {page}/{totalPages}</div>
            <div className="pagination-buttons">
              <button disabled={page <= 1} onClick={() => setPage(prev => prev - 1)}>Trước</button>
              <button disabled={page >= totalPages} onClick={() => setPage(prev => prev + 1)}>Sau</button>
            </div>
          </div>
        ) : null}
      </div>

      {showModal ? (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group"><label>Tên NCC *</label><input className="form-control" required value={form.supplier_name} onChange={event => setForm({ ...form, supplier_name: event.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Người liên hệ</label><input className="form-control" value={form.contact_person} onChange={event => setForm({ ...form, contact_person: event.target.value })} /></div>
                  <div className="form-group"><label>SĐT</label><input className="form-control" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></div>
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select className="form-control" value={form.is_active ? '1' : '0'} onChange={event => setForm({ ...form, is_active: event.target.value === '1' })}>
                      <option value="1">Đang hoạt động</option>
                      <option value="0">Ngừng hợp tác</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Địa chỉ</label><textarea className="form-control" rows={3} value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} /></div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                  Xóa NCC sẽ dùng soft delete để giữ lịch sử phiếu nhập và báo cáo kho.
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-dialog" onClick={event => event.stopPropagation()}>
            <h3 className="confirm-dialog-title">Ngừng hợp tác nhà cung cấp</h3>
            <p className="confirm-dialog-message">Nhà cung cấp <strong>{deleteTarget.supplier_name}</strong> sẽ bị ẩn khỏi danh sách hoạt động nhưng vẫn giữ lịch sử nhập kho.</p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleDelete}>Xác nhận</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
