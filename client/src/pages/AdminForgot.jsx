import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../utils';

export default function AdminForgot() {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');

  async function handleStep1(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    const u = e.target.username.value.trim();
    setUsername(u);
    try {
      const r = await fetch(`${API}/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u })
      });
      const j = await r.json();
      if (!j.success) { setErr(j.message || 'Tài khoản không tồn tại'); return; }
      setMsg(j.message);
      setStep(2);
    } catch { setErr('Lỗi kết nối server'); }
  }

  async function handleReset(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    const fd = new FormData(e.target);
    const pin = fd.get('pin');
    const newPassword = fd.get('new_password');
    try {
      const r = await fetch(`${API}/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin })
      });
      const j = await r.json();
      if (!j.success) { setErr(j.message); return; }

      const r2 = await fetch(`${API}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin, newPassword })
      });
      const j2 = await r2.json();
      if (!j2.success) { setErr(j2.message); return; }
      setMsg('Đặt lại mật khẩu thành công!');
      setStep(3);
    } catch { setErr('Lỗi kết nối server'); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="card-body">
          <div className="text-center mb-4">
            <div className="fs-1 text-brand mb-2"><i className="bi bi-shop"></i></div>
            <h4 className="fw-bold">Châu Loan</h4>
            <p className="text-muted small">Quên mật khẩu</p>
          </div>
          {err && <div className="alert alert-danger py-2 small">{err}</div>}
          {msg && step !== 3 && <div className="alert alert-success py-2 small">{msg}</div>}

          {step === 1 && (
            <form onSubmit={handleStep1}>
              <div className="mb-3">
                <label className="form-label small fw-medium">Tên đăng nhập</label>
                <input type="text" className="form-control" name="username" required autoFocus />
              </div>
              <button type="submit" className="btn btn-brand w-100"><i className="bi bi-envelope"></i> Gửi mã PIN</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset}>
              <div className="mb-3">
                <label className="form-label small fw-medium">Mã PIN</label>
                <input type="text" className="form-control" name="pin" placeholder="6 chữ số" required maxLength={6} autoFocus />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-medium">Mật khẩu mới</label>
                <input type="password" className="form-control" name="new_password" required minLength={6} />
              </div>
              <button type="submit" className="btn btn-brand w-100"><i className="bi bi-check-lg"></i> Đặt lại mật khẩu</button>
              <button type="button" className="btn btn-link btn-sm w-100 mt-2" onClick={() => { setStep(1); setMsg(''); setErr(''); }}>Gửi lại mã PIN</button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center">
              <Link to="/admin-login" className="btn btn-brand"><i className="bi bi-box-arrow-in-right"></i> Đăng nhập</Link>
            </div>
          )}

          <div className="mt-3 text-center small">
            <Link to="/admin-login" className="text-decoration-none">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
