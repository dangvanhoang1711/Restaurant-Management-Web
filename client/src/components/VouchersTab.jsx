import { useState, useEffect, useRef } from 'react';
import { API, fmtPrice } from '../utils';

export default function VouchersTab() {
  const [vouchers, setVouchers] = useState([]);
  const [edit, setEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const timerRef = useRef(null);
  const visibleRef = useRef(true);

  function load() {
    const t = localStorage.getItem('admin_token');
    fetch(`${API}/vouchers`, { headers: { 'Authorization': 'Bearer ' + t } })
      .then(r => r.json())
      .then(j => { if (j.success) setVouchers(j.data); });
  }

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, 5000);
    document.addEventListener('visibilitychange', () => {
      visibleRef.current = !document.hidden;
      if (!document.hidden) load();
    });
    return () => { clearInterval(timerRef.current); };
  }, []);

  function resetForm() { setEdit(null); setShowForm(false); }

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      code: fd.get('code'),
      type: fd.get('type'),
      value: Number(fd.get('value')),
      min_order: Number(fd.get('min_order')) || 0,
      max_usage: Number(fd.get('max_usage')) || 0,
      expires_at: fd.get('expires_at') || null,
    };
    const t = localStorage.getItem('admin_token');
    const opts = { headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    try {
      const url = edit ? `${API}/vouchers/${edit.id}` : `${API}/vouchers`;
      const r = await fetch(url, edit ? { method: 'PUT', ...opts } : { method: 'POST', ...opts });
      const j = await r.json();
      if (j.success) { resetForm(); load(); } else alert(j.message);
    } catch { alert('Lỗi server'); }
  }

  async function del(id) {
    if (!confirm('Xóa voucher này?')) return;
    const t = localStorage.getItem('admin_token');
    await fetch(`${API}/vouchers/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + t } });
    load();
  }

  async function toggleActive(v) {
    const t = localStorage.getItem('admin_token');
    await fetch(`${API}/vouchers/${v.id}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !v.active }),
    });
    load();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-ticket-perforated text-brand"></i> Quản lý Voucher</h5>
        {!showForm && <button className="btn btn-brand btn-sm" onClick={() => { setEdit(null); setShowForm(true); }}><i className="bi bi-plus-lg"></i> Thêm mã</button>}
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <form onSubmit={save}>
              <div className="row g-2">
                <div className="col-md-3">
                  <label className="form-label small">Mã giảm giá</label>
                  <input type="text" className="form-control form-control-sm" name="code" defaultValue={edit?.code || ''} required />
                </div>
                <div className="col-md-2">
                  <label className="form-label small">Loại</label>
                  <select className="form-select form-select-sm" name="type" defaultValue={edit?.type || 'percent'}>
                    <option value="percent">%</option>
                    <option value="fixed">Tiền</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small">Giá trị</label>
                  <input type="number" className="form-control form-control-sm" name="value" defaultValue={edit?.value || ''} required min="1" />
                </div>
                <div className="col-md-2">
                  <label className="form-label small">Đơn tối thiểu</label>
                  <input type="number" className="form-control form-control-sm" name="min_order" defaultValue={edit?.min_order || 0} min="0" />
                </div>
                <div className="col-md-2">
                  <label className="form-label small">Lượt tối đa</label>
                  <input type="number" className="form-control form-control-sm" name="max_usage" defaultValue={edit?.max_usage || 0} min="0" />
                </div>
                <div className="col-md-1">
                  <label className="form-label small">Hết hạn</label>
                  <input type="date" className="form-control form-control-sm" name="expires_at" defaultValue={edit?.expires_at ? edit.expires_at.split('T')[0] : ''} />
                </div>
              </div>
              <div className="mt-2 d-flex gap-2">
                <button type="submit" className="btn btn-brand btn-sm"><i className="bi bi-check-lg"></i> {edit ? 'Cập nhật' : 'Thêm'}</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Mã</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Tối thiểu</th>
                <th>Đã dùng</th>
                <th>Tối đa</th>
                <th>Hết hạn</th>
                <th>Kích hoạt</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id} className={!v.active ? 'text-muted' : ''}>
                  <td className="fw-bold">{v.code}</td>
                  <td>{v.type === 'percent' ? '%' : 'Tiền'}</td>
                  <td>{v.type === 'percent' ? `${v.value}%` : fmtPrice(v.value)}</td>
                  <td>{v.min_order > 0 ? fmtPrice(v.min_order) : '-'}</td>
                  <td>{v.used_count}</td>
                  <td>{v.max_usage || '∞'}</td>
                  <td>{v.expires_at ? new Date(v.expires_at).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={!!v.active} onChange={() => toggleActive(v)} />
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-primary btn-sm py-0" onClick={() => { setEdit(v); setShowForm(true); }}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-outline-danger btn-sm py-0" onClick={() => del(v.id)}><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!vouchers.length && <tr><td colSpan="9" className="text-center text-muted py-3">Chưa có voucher nào</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
