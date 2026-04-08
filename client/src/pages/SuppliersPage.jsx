import { createCrudPage } from './CrudPageFactory';
import { supplierService } from '../services/dataService';

export default createCrudPage({
  title: 'Nhà cung cấp',
  service: supplierService,
  idField: 'supplier_id',
  moduleKey: 'suppliers',
  columns: [
    { key: 'supplier_name', label: 'Nhà cung cấp', render: (v) => <span style={{fontWeight:600}}>{v}</span> },
    { key: 'contact_person', label: 'Người liên hệ' },
    { key: 'phone', label: 'SĐT' },
    { key: 'email', label: 'Email', render: (v) => v || '—' },
    { key: 'is_active', label: 'Trạng thái', render: (v) => <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>{v ? 'Đang HĐ' : 'Ngừng'}</span> }
  ],
  formFields: [
    { name: 'supplier_name', label: 'Tên NCC', required: true },
    { name: 'contact_person', label: 'Người liên hệ' },
    { name: 'phone', label: 'SĐT' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Địa chỉ', type: 'textarea' }
  ]
});
