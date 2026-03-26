import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Generic CRUD page factory to avoid repeating boilerplate
export function createCrudPage({ title, service, idField, columns, formFields, nameField }) {
  return function CrudPage() {
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
      try {
        const data = await service.getAll();
        setItems(Array.isArray(data) ? data : (data.items || data[Object.keys(data)[0]] || []));
      } catch (err) { toast.error(err.message); }
    };

    const openCreate = () => {
      setEditing(null);
      const initial = {};
      formFields.forEach(f => initial[f.name] = f.default || '');
      setForm(initial);
      setShowModal(true);
    };

    const openEdit = (item) => {
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

    const handleDelete = async (id) => {
      if (!confirm('Xác nhận xóa?')) return;
      try { await service.delete(id); toast.success('Đã xóa'); loadData(); } catch (err) { toast.error(err.message); }
    };

    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

    return (
      <div>
        <div className="page-header">
          <div><h1>{title}</h1><p>{items.length} mục</p></div>
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Thêm mới</button>
        </div>
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}<th>Thao tác</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item[idField]}>
                    {columns.map(col => <td key={col.key}>{col.render ? col.render(item[col.key], item, fmt) : item[col.key]}</td>)}
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(item)}><FiEdit2 /></button>{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item[idField])}><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan={columns.length + 1} style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Chưa có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>{editing ? 'Chỉnh sửa' : 'Thêm mới'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
              <div className="modal-body">
                <form onSubmit={handleSave}>
                  {formFields.map(f => (
                    <div className="form-group" key={f.name}>
                      <label>{f.label}{f.required && ' *'}</label>
                      {f.type === 'select' ? (
                        <select className="form-control" required={f.required} value={form[f.name]||''} onChange={e => setForm({...form, [f.name]: e.target.value})}>
                          <option value="">Chọn...</option>
                          {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea className="form-control" rows={3} value={form[f.name]||''} onChange={e => setForm({...form, [f.name]: e.target.value})} />
                      ) : (
                        <input className="form-control" type={f.type||'text'} required={f.required} value={form[f.name]||''} onChange={e => setForm({...form, [f.name]: e.target.value})} />
                      )}
                    </div>
                  ))}
                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
}
