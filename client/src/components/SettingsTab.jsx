import { useState, useEffect } from 'react';
import { API } from '../utils';

export default function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function load() {
    fetch(`${API}/settings`)
      .then(r => r.json())
      .then(j => { if (j.success) setSettings(j.data); });
  }

  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const fd = new FormData(e.target);
    const body = {};
    for (const [k, v] of fd.entries()) body[k] = v;
    const t = localStorage.getItem('admin_token');
    try {
      const r = await fetch(`${API}/settings`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      setMsg(j.success ? 'ok' : j.message);
    } catch { setMsg('Lỗi kết nối'); }
    finally { setSaving(false); }
  }

  if (!settings) return <div className="text-muted py-3">Đang tải...</div>;

  return (
    <div>
      <h5 className="fw-bold mb-3"><i className="bi bi-gear text-brand"></i> Cài đặt quán</h5>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={save}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-medium">Tên quán</label>
                <input type="text" className="form-control" name="shop_name" defaultValue={settings.shop_name || ''} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-medium">Số điện thoại</label>
                <input type="text" className="form-control" name="shop_phone" defaultValue={settings.shop_phone || ''} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-medium">Email</label>
                <input type="email" className="form-control" name="shop_email" defaultValue={settings.shop_email || ''} />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-medium">Giờ mở cửa</label>
                <input type="text" className="form-control" name="shop_hours" defaultValue={settings.shop_hours || ''} />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-medium">Địa chỉ</label>
                <input type="text" className="form-control" name="shop_address" defaultValue={settings.shop_address || ''} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-medium">Số km cơ bản</label>
                <input type="number" className="form-control" name="delivery_base_km" defaultValue={settings.delivery_base_km || 3} min="0" step="0.5" />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-medium">Phí cơ bản (₫)</label>
                <input type="number" className="form-control" name="delivery_base_fee" defaultValue={settings.delivery_base_fee || 12000} min="0" />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-medium">Phí thêm/km (₫)</label>
                <input type="number" className="form-control" name="delivery_extra_fee" defaultValue={settings.delivery_extra_fee || 3000} min="0" />
              </div>
              <div className="col-12">
                <small className="text-muted">
                  <i className="bi bi-info-circle"></i> Phí ship = {settings.delivery_base_fee || 12000}₫ cho {settings.delivery_base_km || 3}km đầu, sau đó +{settings.delivery_extra_fee || 3000}₫/km
                </small>
              </div>
            </div>

            {msg && (
              <div className={`alert ${msg === 'ok' ? 'alert-success' : 'alert-danger'} py-2 small mt-3 mb-0`}>
                {msg === 'ok' ? <><i className="bi bi-check-circle"></i> Đã lưu</> : msg}
              </div>
            )}

            <button type="submit" className="btn btn-brand btn-sm mt-3" disabled={saving}>
              <i className="bi bi-check-lg"></i> {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
