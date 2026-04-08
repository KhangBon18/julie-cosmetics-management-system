import { createCrudPage } from './CrudPageFactory';
import { categoryService } from '../services/dataService';

export default createCrudPage({
  title: 'Danh mục sản phẩm',
  service: categoryService,
  idField: 'category_id',
  moduleKey: 'categories',
  columns: [
    { key: 'category_name', label: 'Danh mục', render: (v) => <span style={{fontWeight:600}}>{v}</span> },
    { key: 'product_count', label: 'Sản phẩm', render: (v) => <span className="badge badge-info">{v || 0}</span> },
    { key: 'description', label: 'Mô tả', render: (v) => v || '—' }
  ],
  formFields: [
    { name: 'category_name', label: 'Tên danh mục', required: true },
    { name: 'description', label: 'Mô tả', type: 'textarea' }
  ]
});
