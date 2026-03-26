import { useState, useEffect } from 'react';
import { salaryService } from '../services/dataService';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function SalariesPage() {
  const [salaries, setSalaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('2026');

  useEffect(() => { loadData(); }, [month, year]);

  const loadData = async () => {
    try {
      const d = await salaryService.getAll({ limit: 50, month: month||undefined, year: year||undefined });
      setSalaries(d.salaries || []); setTotal(d.total || 0);
    } catch(e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="page-header"><div><h1>Bảng lương</h1><p>{total} bản ghi</p></div></div>
      <div className="card">
        <div className="card-body">
          <div className="toolbar">
            <select className="form-control" style={{width:120}} value={month} onChange={e=>setMonth(e.target.value)}>
              <option value="">Tất cả tháng</option>
              {[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>Tháng {i+1}</option>)}
            </select>
            <select className="form-control" style={{width:100}} value={year} onChange={e=>setYear(e.target.value)}>
              <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Nhân viên</th><th>Tháng/Năm</th><th>Ngày công</th><th>Lương CB</th><th>Lương thực</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th></tr></thead>
            <tbody>
              {salaries.map(s => (
                <tr key={s.salary_id}>
                  <td style={{fontWeight:600}}>{s.employee_name}</td>
                  <td>{s.month}/{s.year}</td>
                  <td>{s.work_days_actual}/{s.work_days_standard}</td>
                  <td>{fmt(s.base_salary)}đ</td>
                  <td>{fmt(s.gross_salary)}đ</td>
                  <td style={{color:'#059669'}}>{s.bonus > 0 ? `+${fmt(s.bonus)}đ` : '—'}</td>
                  <td style={{color:'#ef4444'}}>{s.deductions > 0 ? `-${fmt(s.deductions)}đ` : '—'}</td>
                  <td style={{fontWeight:700,color:'#2563eb'}}>{fmt(s.net_salary)}đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
