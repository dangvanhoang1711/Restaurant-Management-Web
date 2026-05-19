import { useState, useEffect } from 'react';
import { API, fmtPrice, fetchCategories, invalidateCategories } from '../utils';

export default function MenuTab({ allMenuRef }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editItem, setEditItem] = useState(null);
  const [bg, setBg] = useState('linear-gradient(135deg,#ff9a9e,#fad0c4)');
  const [imgUrl, setImgUrl] = useState('');
  const [categories, setCategories] = useState([]);

  function load() {
    fetch(`${API}/menu`).then(r => r.json()).then(j => { if (j.success) { setItems(j.data); allMenuRef.current = j.data; } });
    fetchCategories(true).then(setCategories);
  }

  useEffect(load, []);

  const list = items.filter(i => filter === 'all' || i.category_id == filter);

  function authHeaders(extra) {
    const t = localStorage.getItem('admin_token');
    return t ? { 'Authorization': 'Bearer ' + t, ...extra } : { ...extra };
  }

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { name: fd.get('name'), category_id: Number(fd.get('category_id')), price: Number(fd.get('price')), description: fd.get('description') || '', image_bg: bg };
    const id = editItem?.id;
    try {
      const url = id ? `${API}/menu/${id}` : `${API}/menu`;
      const method = id ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
      const j = await r.json();
      if (j.success) { setEditItem(null); load(); document.querySelector('[data-bs-dismiss="modal"]')?.click(); }
    } catch {}
  }

  async function del(id, name) {
    if (!confirm(`Xóa "${name}"?`)) return;
    await fetch(`${API}/menu/${id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  }

  async function uploadImage() {
    const file = document.getElementById('menuImageInput').files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('image', file);
    const r = await fetch(`${API}/menu/upload`, { method: 'POST', headers: authHeaders(), body: fd });
    const j = await r.json();
    if (j.success) {
      setImgUrl(j.data.url);
      setBg(`url(${j.data.url}) center/cover`);
      const p = document.getElementById('menuImagePreview');
      if (p) { p.style.display = 'block'; p.querySelector('img').src = j.data.url; }
    }
  }

  function clearImage() {
    setImgUrl(''); setBg('linear-gradient(135deg,#ff9a9e,#fad0c4)');
    const p = document.getElementById('menuImagePreview');
    if (p) p.style.display = 'none';
  }

  const gradients = [
    '#ff9a9e,#fad0c4', '#a8edea,#fed6e3', '#ffecd2,#fcb69f', '#fbc2eb,#a6c1ee',
    '#fddb92,#d1fdff', '#f6d365,#fda085', '#89f7fe,#66a6ff', '#f093fb,#f5576c',
    '#4facfe,#00f2fe', '#fa709a,#fee140', '#a18cd1,#fbc2eb', '#ff9a9e,#fecfef'
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
        <select className="form-select form-select-sm" style={{width:'auto'}} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-sm btn-brand" onClick={() => { setEditItem(null); setBg('linear-gradient(135deg,#ff9a9e,#fad0c4)'); setImgUrl(''); }} data-bs-toggle="modal" data-bs-target="#menuModal"><i className="bi bi-plus-lg"></i> Thêm món mới</button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr><th>STT</th><th>Màu</th><th>Tên món</th><th>Danh mục</th><th>Giá</th><th>Mô tả</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {list.map((m, i) => (
                <tr key={m.id}>
                  <td>{i+1}</td>
                  <td><div style={{width:40,height:40,borderRadius:8,background:m.image_bg}}></div></td>
                  <td className="fw-medium">{m.name}</td>
                  <td>{categories.find(c => c.slug === m.category)?.name || m.category}</td>
                  <td className="fw-bold text-brand">{fmtPrice(m.price)}</td>
                  <td className="small text-muted" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.description || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setEditItem(m); setBg(m.image_bg); setImgUrl(''); }} data-bs-toggle="modal" data-bs-target="#menuModal"><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => del(m.id, m.name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal fade" id="menuModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header"><h5 className="modal-title fw-bold">{editItem ? 'Sửa món' : 'Thêm món mới'}</h5><button type="button" className="btn-close" data-bs-dismiss="modal" /></div>
            <form key={editItem?.id || 'new'} onSubmit={save}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-medium">Tên món <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" name="name" defaultValue={editItem?.name || ''} required />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col">
                    <label className="form-label fw-medium">Danh mục <span className="text-danger">*</span></label>
                    <select className="form-select" name="category_id" defaultValue={editItem?.category_id || (categories[0]?.id || 1)} required>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col">
                    <label className="form-label fw-medium">Giá <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" name="price" defaultValue={editItem?.price || ''} required min="0" step="1000" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Mô tả</label>
                  <textarea className="form-control" name="description" rows="2" defaultValue={editItem?.description || ''}></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Ảnh món</label>
                  <div className="d-flex align-items-center gap-2">
                    <input type="file" className="form-control form-control-sm" id="menuImageInput" accept="image/jpeg,image/png,image/gif,image/webp" />
                    <button type="button" className="btn btn-sm btn-outline-brand" onClick={uploadImage}><i className="bi bi-cloud-arrow-up"></i> Tải lên</button>
                  </div>
                  {imgUrl && (
                    <div id="menuImagePreview" className="mt-2">
                      <img src={imgUrl} className="rounded border" style={{height:80,width:80,objectFit:'cover'}} />
                      <button type="button" className="btn btn-sm btn-link text-danger" onClick={clearImage}>Xoá</button>
                    </div>
                  )}
                  <small className="text-muted d-block mb-1">Chọn ảnh hoặc dùng màu nền bên dưới</small>
                  <div className="d-flex gap-2 flex-wrap mt-1">
                    {gradients.map(g => (
                      <div key={g} className="border cursor-pointer" style={{width:40,height:40,borderRadius:8,background:`linear-gradient(135deg,${g})`}} onClick={() => { setBg(`linear-gradient(135deg,${g})`); clearImage(); }}></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Hủy</button>
                <button type="submit" className="btn btn-brand btn-sm"><i className="bi bi-check-lg"></i> Lưu</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
