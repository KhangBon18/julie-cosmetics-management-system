import { createCrudPage } from './CrudPageFactory';
import { brandService } from '../services/dataService';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default createCrudPage({
  title: 'Thương hiệu',
  service: brandService,
  idField: 'brand_id',
  columns: [
    { key: 'brand_name', label: 'Thương hiệu', render: (v) => <span style={{fontWeight:600}}>{v}</span> },
    { key: 'origin_country', label: 'Xuất xứ' },
    { key: 'product_count', label: 'Sản phẩm', render: (v) => <span className="badge badge-info">{v || 0}</span> },
    { key: 'description', label: 'Mô tả', render: (v) => <span style={{maxWidth:200,display:'inline-block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v||'—'}</span> }
  ],
  formFields: [
    { name: 'brand_name', label: 'Tên thương hiệu', required: true },
    { name: 'origin_country', label: 'Xuất xứ' },
    { name: 'description', label: 'Mô tả', type: 'textarea' }
  ]
});
