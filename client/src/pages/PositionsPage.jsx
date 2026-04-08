import { createCrudPage } from './CrudPageFactory';
import { positionService } from '../services/dataService';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default createCrudPage({
  title: 'Chức vụ',
  service: positionService,
  idField: 'position_id',
  moduleKey: 'positions',
  columns: [
    { key: 'position_name', label: 'Chức vụ', render: (v) => <span style={{fontWeight:600}}>{v}</span> },
    { key: 'base_salary', label: 'Lương cơ bản', render: (v, _, f) => `${f(v)}đ` },
    { key: 'employee_count', label: 'Nhân viên', render: (v) => <span className="badge badge-info">{v || 0}</span> },
    { key: 'description', label: 'Mô tả', render: (v) => v || '—' }
  ],
  formFields: [
    { name: 'position_name', label: 'Tên chức vụ', required: true },
    { name: 'base_salary', label: 'Lương cơ bản', type: 'number', required: true },
    { name: 'description', label: 'Mô tả', type: 'textarea' }
  ]
});
