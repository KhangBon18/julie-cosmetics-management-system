import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiSearch, FiAlertTriangle, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePermission from '../hooks/usePermission';

// ─── Confirm Dialog Component ───
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-dialog-icon"><FiAlertTriangle /></div>
        <h3 className="confirm-dialog-title">{title || 'Xác nhận'}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="btn btn-outline" onClick={onCancel}>Hủy</button>
          <button className="btn btn-danger" onClick={onConfirm}>Xóa</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic CRUD page factory with pagination, search, confirm dialog, and permission integration.
 *
 * @param {Object} config
 * @param {string} config.title — Page title
 * @param {Object} config.service — CRUD service object
 * @param {string} config.idField — Primary key field name
 * @param {Array} config.columns — Table columns config
 * @param {Array} config.formFields — Form fields config
 * @param {string} config.nameField — Field used for delete confirmation message
 * @param {string} [config.moduleKey] — Module key for permission checks (e.g. 'brands')
 */
export function createCrudPage({ title, service, idField, columns, formFields, nameField, moduleKey }) {
  return function CrudPage() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const limit = 10;

    // Permission checks
    const { canCreate, canUpdate, canDelete } = usePermission();
    const _canCreate = moduleKey ? canCreate(moduleKey) : true;
    const _canUpdate = moduleKey ? canUpdate(moduleKey) : true;
    const _canDelete = moduleKey ? canDelete(moduleKey) : true;

    // Debounce search
    useEffect(() => {
      const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
      return () => clearTimeout(t);
    }, [searchInput]);

    const loadData = useCallback(async () => {
      setLoading(true);
      try {
        const data = await service.getAll({ page, limit, search });
        if (Array.isArray(data)) {
          // Client-side filter for models that return flat arrays
          let filtered = data;
          if (search && nameField) {
            const q = search.toLowerCase();
            filtered = data.filter(item => {
              return columns.some(col => {
                const val = item[col.key];
                return val && String(val).toLowerCase().includes(q);
              });
            });
          }
          setTotal(filtered.length);
          // Client-side pagination for flat arrays
          const start = (page - 1) * limit;
          setItems(filtered.slice(start, start + limit));
        } else {
          const key = Object.keys(data).find(k => Array.isArray(data[k]));
          setItems(key ? data[key] : []);
          setTotal(data.total || (key ? data[key].length : 0));
        }
      } catch (err) { toast.error(err.message); }
      finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { loadData(); }, [loadData]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const openCreate = () => {
      if (!_canCreate) return;
      setEditing(null);
      const initial = {};
      formFields.forEach(f => initial[f.name] = f.default || '');
      setForm(initial);
      setShowModal(true);
    };

    const openEdit = (item) => {
      if (!_canUpdate) return;
      setEditing(item);
      setForm({ ...item });
      setShowModal(true);
    };

    const handleSave = async (e) => {
      e.preventDefault();
      try {
        if (editing) { await service.update(editing[idField], form); toast.success('Cập nhật thành công'); }
        else { await service.create(form); toast.success('Thêm thành công'); }
        setShowModal(false); loadData();
      } catch (err) { toast.error(err.message); }
    };

    const requestDelete = (item) => {
      if (!_canDelete) return;
      setDeleteTarget(item);
    };

    const confirmDelete = async () => {
      if (!deleteTarget) return;
      try {
        await service.delete(deleteTarget[idField]);
        toast.success('Đã xóa');
        loadData();
      } catch (err) { toast.error(err.message); }
      finally { setDeleteTarget(null); }
    };

    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

    return (
      <div>
        <div className="page-header">
          <div><h1>{title}</h1><p>{total} mục</p></div>
          {_canCreate && (
            <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Thêm mới</button>
          )}
        </div>

        {/* Search bar */}
        <div className="crud-search-bar">
          <FiSearch className="crud-search-icon" />
          <input
            type="text"
            placeholder={`Tìm kiếm ${title.toLowerCase()}...`}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="crud-search-input"
          />
          {searchInput && (
            <button className="crud-search-clear" onClick={() => { setSearchInput(''); setSearch(''); }}>
              <FiX />
            </button>
          )}
        </div>

        <div className="card">
          {loading ? (
            <div className="crud-loading">Đang tải...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}{(_canUpdate || _canDelete) && <th>Thao tác</th>}</tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item[idField]}>
                      {columns.map(col => <td key={col.key}>{col.render ? col.render(item[col.key], item, fmt) : item[col.key]}</td>)}
                      {(_canUpdate || _canDelete) && (
                        <td>
                          {_canUpdate && (
                            <button className="btn btn-sm btn-outline" onClick={() => openEdit(item)} aria-label="Sửa"><FiEdit2 aria-hidden="true" /></button>
                          )}{' '}
                          {_canDelete && (
                            <button className="btn btn-sm btn-danger" onClick={() => requestDelete(item)} aria-label="Xóa"><FiTrash2 aria-hidden="true" /></button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {items.length === 0 ? <tr><td colSpan={columns.length + (_canUpdate || _canDelete ? 1 : 0)} className="crud-empty">{search ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}</td></tr> : null}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="crud-pagination">
              <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <FiChevronLeft /> Trước
              </button>
              <span className="crud-pagination-text">Trang {page} / {totalPages}</span>
              <button className="btn btn-sm btn-outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Sau <FiChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal ? (
          <div className="modal-overlay" onClick={() => setShowModal(false)} role="dialog" aria-modal="true" aria-label={editing ? 'Chỉnh sửa' : 'Thêm mới'}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ overscrollBehavior: 'contain' }}>
              <div className="modal-header"><h3>{editing ? 'Chỉnh sửa' : 'Thêm mới'}</h3><button className="modal-close" onClick={() => setShowModal(false)} aria-label="Đóng">×</button></div>
              <div className="modal-body">
                <form onSubmit={handleSave}>
                  {formFields.map(f => {
                    const fieldId = `crud-${f.name}`;
                    return (
                      <div className="form-group" key={f.name}>
                        <label htmlFor={fieldId}>{f.label}{f.required ? ' *' : ''}</label>
                        {f.type === 'select' ? (
                          <select id={fieldId} className="form-control" required={f.required} value={form[f.name]||''} onChange={e => setForm({...form, [f.name]: e.target.value})}>
                            <option value="">Chọn…</option>
                            {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : f.type === 'textarea' ? (
                          <textarea id={fieldId} className="form-control" rows={3} value={form[f.name]||''} onChange={e => setForm({...form, [f.name]: e.target.value})} />
                        ) : (
                          <input id={fieldId} className="form-control" type={f.type||'text'} inputMode={f.type === 'number' ? 'numeric' : undefined} required={f.required} value={form[f.name]||''} onChange={e => setForm({...form, [f.name]: e.target.value})} autoComplete="off" />
                        )}
                      </div>
                    );
                  })}
                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Xác nhận xóa"
          message={deleteTarget ? `Bạn có chắc chắn muốn xóa "${deleteTarget[nameField || columns[0]?.key] || 'mục này'}"? Hành động này không thể hoàn tác.` : ''}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    );
  };
}
