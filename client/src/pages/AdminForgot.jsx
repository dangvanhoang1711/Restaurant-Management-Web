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
            <p className="auth-subtitle">Quên mật khẩu</p>
          </div>

          {err && (
            <div className="auth-alert">
              <i className="bi bi-exclamation-circle"></i> {err}
            </div>
          )}
          {msg && step !== 3 && (
            <div className="auth-alert" style={{background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.25)',color:'#6ee7b7'}}>
              <i className="bi bi-check-circle"></i> {msg}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1}>
              <div className="auth-field">
                <label className="auth-label">Tên đăng nhập</label>
                <div className="auth-input-group">
                  <span className="auth-input-icon"><i className="bi bi-person"></i></span>
                  <input type="text" className="auth-input" name="username" required autoFocus placeholder="Nhập tên đăng nhập" />
                </div>
              </div>
              <button type="submit" className="auth-btn"><i className="bi bi-envelope"></i> Gửi mã PIN</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset}>
              <div className="auth-field">
                <label className="auth-label">Mã PIN</label>
                <div className="auth-input-group">
                  <span className="auth-input-icon"><i className="bi bi-key"></i></span>
                  <input type="text" className="auth-input" name="pin" placeholder="6 chữ số" required maxLength={6} autoFocus />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Mật khẩu mới</label>
                <div className="auth-input-group">
                  <span className="auth-input-icon"><i className="bi bi-lock"></i></span>
                  <input type="password" className="auth-input" name="new_password" required minLength={6} placeholder="Nhập mật khẩu mới" />
                </div>
              </div>
              <button type="submit" className="auth-btn"><i className="bi bi-check-lg"></i> Đặt lại mật khẩu</button>
              <button type="button" className="btn btn-link btn-sm w-100 mt-2 text-decoration-none" style={{color:'rgba(255,255,255,0.4)'}} onClick={() => { setStep(1); setMsg(''); setErr(''); }}>Gửi lại mã PIN</button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-2">
              <div className="mb-3" style={{color:'#6ee7b7',fontSize:'2.5rem'}}><i className="bi bi-check-circle"></i></div>
              <p className="mb-3" style={{color:'rgba(255,255,255,0.6)',fontSize:'0.85rem'}}>Mật khẩu đã được đặt lại thành công</p>
              <Link to="/admin-login" className="auth-btn text-decoration-none" style={{display:'inline-flex',width:'auto',padding:'11px 28px'}}><i className="bi bi-box-arrow-in-right"></i> Đăng nhập</Link>
            </div>
          )}

          <div className="auth-footer">
            <Link to="/admin-login">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
