import { useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function ShopAuthPage() {
  const { user, customerLogin, customerRegister } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/shop';
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [regForm, setRegForm] = useState({ full_name: '', phone: '', email: '', password: '', password_confirm: '' });

  // If already logged in as customer, redirect
  if (user && user.role === 'customer') {
    navigate(redirect, { replace: true });
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await customerLogin(phone, password);
      toast.success('Đăng nhập thành công!');
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (regForm.password !== regForm.password_confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await customerRegister({
        full_name: regForm.full_name,
        phone: regForm.phone,
        email: regForm.email || undefined,
        password: regForm.password
      });
      toast.success('Đăng ký thành công!');
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onRegChange = (field) => (e) => setRegForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="shop-container" style={{ maxWidth: 480, margin: '40px auto', padding: '0 20px' }}>
      <Link to="/shop" className="back-link" style={{ marginBottom: 24 }}><FiArrowLeft /> Quay lại cửa hàng</Link>

      <div className="shop-auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💄</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: 'var(--shop-text-dark)', marginBottom: 4 }}>
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--shop-text-muted)' }}>
            {mode === 'login' ? 'Đăng nhập để mua hàng và theo dõi đơn hàng' : 'Tạo tài khoản để mua sắm tại Julie Cosmetics'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="shop-auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Đăng nhập</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Đăng ký</button>
        </div>

        {error && <div className="shop-auth-error">{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="checkout-form-group">
              <label>Số điện thoại</label>
              <input type="tel" placeholder="0901234567" value={phone} onChange={e => setPhone(e.target.value)} required autoFocus />
            </div>
            <div className="checkout-form-group">
              <label>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Nhập mật khẩu" value={password}
                  onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--shop-text-muted)' }}>
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-place-order" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="checkout-form-group">
              <label>Họ và tên *</label>
              <input placeholder="Nguyễn Văn A" value={regForm.full_name} onChange={onRegChange('full_name')} required autoFocus />
            </div>
            <div className="checkout-form-group">
              <label>Số điện thoại *</label>
              <input type="tel" placeholder="0901234567" value={regForm.phone} onChange={onRegChange('phone')} required />
            </div>
            <div className="checkout-form-group">
              <label>Email (tùy chọn)</label>
              <input type="email" placeholder="email@example.com" value={regForm.email} onChange={onRegChange('email')} />
            </div>
            <div className="checkout-form-group">
              <label>Mật khẩu *</label>
              <input type="password" placeholder="Ít nhất 6 ký tự" value={regForm.password} onChange={onRegChange('password')} required minLength={6} />
            </div>
            <div className="checkout-form-group">
              <label>Xác nhận mật khẩu *</label>
              <input type="password" placeholder="Nhập lại mật khẩu" value={regForm.password_confirm} onChange={onRegChange('password_confirm')} required />
            </div>
            <button type="submit" className="btn-place-order" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--shop-border-light)' }}>
          <p style={{ fontSize: 13, color: 'var(--shop-text-muted)' }}>
            {mode === 'login' ? (
              <>Chưa có tài khoản? <button onClick={() => { setMode('register'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--shop-primary-dark)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Đăng ký ngay</button></>
            ) : (
              <>Đã có tài khoản? <button onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--shop-primary-dark)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Đăng nhập</button></>
            )}
          </p>
        </div>

        {/* Staff login link */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link to="/admin/login" style={{ fontSize: 12, color: 'var(--shop-text-muted)' }}>
            Nhân viên? Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
  );
}
