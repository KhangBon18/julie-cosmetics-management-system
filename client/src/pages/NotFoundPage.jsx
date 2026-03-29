import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', padding: 40, textAlign: 'center'
    }}>
      <div style={{ fontSize: 120, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>404</div>
      <h2 style={{ color: '#334155', marginBottom: 8, marginTop: 16 }}>Trang không tồn tại</h2>
      <p style={{ color: '#94a3b8', marginBottom: 32 }}>Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/shop" className="btn btn-primary">Về trang chủ Shop</Link>
        <Link to="/admin" className="btn btn-outline">Dashboard Admin</Link>
      </div>
    </div>
  );
}
