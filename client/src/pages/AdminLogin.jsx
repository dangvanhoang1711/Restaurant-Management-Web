import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../utils';

export default function AdminLogin() {
  const nav = useNavigate();
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    const fd = new FormData(e.target);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') })
      });
      const j = await r.json();
      if (!j.success) { setErr(j.message || 'Sai tài khoản hoặc mật khẩu'); return; }
      localStorage.setItem('admin_token', j.data.token);
      localStorage.setItem('admin_username', j.data.username || fd.get('username'));
      nav('/admin');
    } catch { setErr('Lỗi kết nối server'); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="card-body">
          <div className="text-center mb-4">
            <div className="fs-1 text-brand mb-2"><i className="bi bi-shop"></i></div>
            <h4 className="fw-bold">Châu Loan</h4>
            <p className="text-muted small">Đăng nhập quản lý</p>
          </div>
          {err && <div className="alert alert-danger py-2 small">{err}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-medium">Tên đăng nhập</label>
              <input type="text" className="form-control" name="username" required autoFocus />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Mật khẩu</label>
              <input type="password" className="form-control" name="password" required />
            </div>
            <button type="submit" className="btn btn-brand w-100"><i className="bi bi-box-arrow-in-right"></i> Đăng nhập</button>
          </form>
          <div className="mt-3 text-center small">
            <Link to="/admin-forgot" className="text-decoration-none">Quên mật khẩu?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
