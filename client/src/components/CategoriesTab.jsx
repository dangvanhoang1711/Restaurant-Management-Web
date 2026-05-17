import { useState, useEffect } from 'react';
import { API, fetchCategories, invalidateCategories } from '../utils';

export default function CategoriesTab() {
  const [cats, setCats] = useState([]);
  const [edit, setEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function load() { fetchCategories(true).then(setCats); }
  useEffect(load, []);

  function reset() { setEdit(null); setShowForm(false); }

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { name: fd.get('name'), slug: fd.get('slug') };
    const t = localStorage.getItem('admin_token');
    const headers = { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' };
    try {
      const url = edit ? `${API}/categories/${edit.id}` : `${API}/categories`;
      const r = await fetch(url, { method: edit ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
      const j = await r.json();
      if (j.success) { reset(); invalidateCategories(); load(); }
      else alert(j.message);
    } catch { alert('Lỗi server'); }
  }

  async function del(id) {
    if (!confirm('Xoá danh mục này?')) return;
    const t = localStorage.getItem('admin_token');
    const r = await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + t } });
    const j = await r.json();
    if (j.success) { invalidateCategories(); load(); }
    else alert(j.message);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-tags text-brand"></i> Quản lý danh mục</h5>
        {!showForm && <button className="btn btn-brand btn-sm" onClick={() => { setEdit(null); setShowForm(true); }}><i className="bi bi-plus-lg"></i> Thêm danh mục</button>}
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <form onSubmit={save} className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label small">Tên danh mục</label>
                <input type="text" className="form-control form-control-sm" name="name" defaultValue={edit?.name || ''} required />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Slug (vd: mi, com, pho)</label>
                <input type="text" className="form-control form-control-sm" name="slug" defaultValue={edit?.slug || ''} required pattern="[a-z]+" title="Chỉ chấp nhận chữ thường" />
              </div>
              <div className="col-md-4 d-flex gap-2">
                <button type="submit" className="btn btn-brand btn-sm"><i className="bi bi-check-lg"></i> {edit ? 'Cập nhật' : 'Thêm'}</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>ID</th><th>Tên</th><th>Slug</th><th></th></tr>
            </thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id}>
                  <td className="text-muted small">{c.id}</td>
                  <td className="fw-medium">{c.name}</td>
                  <td><code>{c.slug}</code></td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-primary btn-sm py-0" onClick={() => { setEdit(c); setShowForm(true); }}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-outline-danger btn-sm py-0" onClick={() => del(c.id)} disabled={c.slug === 'topping'} title={c.slug === 'topping' ? 'Không thể xoá' : ''}><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
