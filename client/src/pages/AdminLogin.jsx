import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../utils';

export default function AdminLogin() {
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const fd = new FormData(e.target);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') })
      });
      const j = await r.json();
      if (!j.success) { setErr(j.message || 'Sai tài khoản hoặc mật khẩu'); setLoading(false); return; }
      localStorage.setItem('admin_token', j.data.token);
      localStorage.setItem('admin_username', j.data.username || fd.get('username'));
      nav('/admin');
    } catch { setErr('Lỗi kết nối server'); setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <div className="auth-card">
        <div className="auth-card-inner">
          <div className="text-center mb-4">
            <div className="auth-avatar">
              <i className="bi bi-shop"></i>
            </div>
            <h4 className="fw-bold mb-1 auth-title">Châu Loan</h4>
            <p className="auth-subtitle">Đăng nhập quản lý</p>
          </div>

          {err && (
            <div className="auth-alert">
              <i className="bi bi-exclamation-circle"></i> {err}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Tên đăng nhập</label>
              <div className="auth-input-group">
                <span className="auth-input-icon"><i className="bi bi-person"></i></span>
                <input type="text" className="auth-input" name="username" required autoFocus placeholder="Nhập tên đăng nhập" />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Mật khẩu</label>
              <div className="auth-input-group">
                <span className="auth-input-icon"><i className="bi bi-lock"></i></span>
                <input type="password" className="auth-input" name="password" required placeholder="Nhập mật khẩu" />
              </div>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <><span className="auth-spinner"></span> Đang đăng nhập...</> : <><i className="bi bi-box-arrow-in-right"></i> Đăng nhập</>}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/admin-forgot">Quên mật khẩu?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
