import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { getWorkspaceHomePath } from '../utils/workspace';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const workspaceHome = getWorkspaceHomePath(user);

  if (user) {
    return <Navigate to={workspaceHome} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      navigate(getWorkspaceHomePath(data.user), { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden="true">💄</div>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.3px' }}>Julie Cosmetics</h1>
        <p className="login-subtitle">Premium Beauty Management System</p>

        {error ? <div className="login-error" role="alert">{error}</div> : null}

        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="form-group">
            <label htmlFor="login-username">Tên đăng nhập</label>
            <input id="login-username" className="form-control" type="text" name="username" placeholder="Nhập username…"
              value={username} onChange={e => setUsername(e.target.value)} required autoFocus autoComplete="username" spellCheck={false} />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Mật khẩu</label>
            <input id="login-password" className="form-control" type="password" name="password" placeholder="Nhập mật khẩu…"
              value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px 16px' }}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/shop" style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            🛍️ Quay lại cửa hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
