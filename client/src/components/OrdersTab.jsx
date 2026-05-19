import { useState, useEffect } from 'react';
import { API, fmtPrice, playNewOrderSound } from '../utils';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [detail, setDetail] = useState(null);
  const [settings, setSettings] = useState(null);

  function getHeaders() {
    const t = localStorage.getItem('admin_token');
    return t ? { 'Authorization': 'Bearer ' + t } : {};
  }

  function load() {
    let url = `${API}/orders?page=${page}&limit=${pageSize}`;
    if (filter !== 'all') url += `&status=${filter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    fetch(url, { headers: getHeaders() }).then(r => r.json()).then(j => { if (j.success) { setOrders(j.data || []); setTotal(j.total || 0); } });
  }

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(j => { if (j.success) setSettings(j.data); });
  }, []);

  useEffect(() => {
    load();
    const token = localStorage.getItem('admin_token');
    let es = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;

    function connectSSE() {
      if (!window.EventSource || !token) return;
      es?.close();
      es = new EventSource(`${API}/orders/stream?token=${token}`);

      es.addEventListener('order:created', () => { playNewOrderSound(); load(); });
      es.addEventListener('order:updated', load);

      es.onerror = () => {
        es?.close();
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        reconnectTimer = setTimeout(connectSSE, delay);
      };

      es.addEventListener('connected', () => { reconnectAttempts = 0; });
    }

    connectSSE();

    return () => { es?.close(); clearTimeout(reconnectTimer); };
  }, [page, filter, pageSize]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  const statusMap = { pending: 'Chờ XN', confirmed: 'Đã XN', preparing: 'Đang nấu', completed: 'Xong', cancelled: 'Hủy' };
  const statusCls = { pending: 'status-pending', confirmed: 'status-confirmed', preparing: 'status-preparing', completed: 'status-completed', cancelled: 'status-cancelled' };

  function authHeaders(extra) {
    const t = localStorage.getItem('admin_token');
    return t ? { 'Authorization': 'Bearer ' + t, ...extra } : { ...extra };
  }

  function updateStatus(id, status) {
    fetch(`${API}/orders/${id}/status`, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ status }) })
      .then(r => r.json()).then(j => { if (j.success) { load(); if (detail?.id === id) viewDetail(id); } });
  }

  function confirmPayment(id) {
    if (!confirm('Xác nhận nhận được tiền?')) return;
    fetch(`${API}/orders/${id}/payment`, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ payment_status: 'paid' }) })
      .then(r => r.json()).then(j => { if (j.success) { load(); viewDetail(id); } });
  }

  function viewDetail(id) {
    fetch(`${API}/orders/${id}`).then(r => r.json()).then(j => { if (j.success) setDetail(j.data); });
  }

  function exportCSV() {
    let url = `${API}/orders/export`;
    if (filter !== 'all') url += `?status=${filter}`;
    const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') };
    fetch(url, { headers }).then(r => r.blob()).then(blob => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
    }).catch(() => {});
  }

  function printInvoice() {
    if (!detail) return;
    const el = document.getElementById('printArea');
    if (!el) return;

    const s = {
      shop_name: 'CỬA HÀNG',
      shop_address: '',
      shop_phone: '',
      shop_email: '',
      shop_hours: '',
      ...(settings || {}),
    };

    const items = detail.items?.map(i =>
      `<tr>
        <td style="text-align:center">${i.quantity}</td>
        <td>${i.item_name}</td>
        <td style="text-align:right">${fmtPrice(i.item_price)}</td>
        <td style="text-align:right">${fmtPrice(i.item_price * i.quantity)}</td>
      </tr>`
    ).join('');

    const discountRow = detail.discount > 0
      ? `<tr>
          <td colspan="3" style="text-align:right;font-weight:500">Giảm giá${detail.voucher_code ? ` (${detail.voucher_code})` : ''}:</td>
          <td style="text-align:right;color:#e74c3c">-${fmtPrice(detail.discount)}</td>
        </tr>`
      : '';

    const paymentMethod = detail.payment_method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt';
    const paymentStatus = detail.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
    const deliveryType = detail.delivery_type === 'ship' ? 'Giao hàng' : 'Tại quán';

    const now = new Date(detail.created_at);
    const dateStr = now.toLocaleDateString('vi-VN');
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    el.innerHTML = `<div id="receipt">
      <div class="receipt-header">
        <div class="shop-name">${s.shop_name}</div>
        ${s.shop_address ? `<div class="shop-info">${s.shop_address}</div>` : ''}
        ${s.shop_phone ? `<div class="shop-info">Tel: ${s.shop_phone}</div>` : ''}
        ${s.shop_email ? `<div class="shop-info">Email: ${s.shop_email}</div>` : ''}
        ${s.shop_hours ? `<div class="shop-info">Giờ: ${s.shop_hours}</div>` : ''}
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-title">HÓA ĐƠN THANH TOÁN</div>

      <div class="receipt-divider"></div>

      <table class="info-table">
        <tr><td class="label">Mã ĐH:</td><td class="value">#${detail.order_code}</td></tr>
        <tr><td class="label">Khách hàng:</td><td class="value">${detail.customer_name}</td></tr>
        <tr><td class="label">SĐT:</td><td class="value">${detail.customer_phone}</td></tr>
        ${detail.address ? `<tr><td class="label">Địa chỉ:</td><td class="value">${detail.address}</td></tr>` : ''}
        <tr><td class="label">HT giao:</td><td class="value">${deliveryType}</td></tr>
        <tr><td class="label">HT thanh toán:</td><td class="value">${paymentMethod}</td></tr>
        <tr><td class="label">TT thanh toán:</td><td class="value">${paymentStatus}</td></tr>
        ${detail.note ? `<tr><td class="label">Ghi chú:</td><td class="value">${detail.note}</td></tr>` : ''}
        <tr><td class="label">Ngày:</td><td class="value">${dateStr} ${timeStr}</td></tr>
      </table>

      <div class="receipt-divider"></div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align:center;width:40px">SL</th>
            <th style="text-align:left">Món</th>
            <th style="text-align:right;width:90px">Đơn giá</th>
            <th style="text-align:right;width:100px">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${items}
          ${discountRow}
        </tbody>
      </table>

      <div class="receipt-divider"></div>

      <div class="receipt-total">
        <span class="total-label">TỔNG CỘNG</span>
        <span class="total-value">${fmtPrice(detail.total)}</span>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-footer">
        <p>Cảm ơn quý khách và hẹn gặp lại!</p>
      </div>
    </div>`;
    window.print();
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <select className="form-select form-select-sm" style={{width:'auto'}} value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
            <option value="all">Tất cả</option>
            {Object.entries(statusMap).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="text" className="form-control form-control-sm" style={{width:180}} placeholder="Tìm SĐT hoặc tên..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select form-select-sm" style={{width:'auto'}} value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            <option value="20">20 đơn/trang</option>
            <option value="50">50 đơn/trang</option>
            <option value="100">100 đơn/trang</option>
          </select>
        </div>
        <button className="btn btn-sm btn-outline-success" onClick={exportCSV}><i className="bi bi-download"></i> CSV</button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Mã ĐH</th><th>Khách</th><th>SĐT</th><th>SL</th><th>Tổng</th><th>HT</th><th>TT</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="order-row" style={{cursor:'pointer'}} onClick={() => viewDetail(o.id)} data-bs-toggle="modal" data-bs-target="#orderDetailModal">
                  <td className="fw-bold small">{o.order_code}</td>
                  <td>{o.customer_name}</td>
                  <td className="small">{o.customer_phone}</td>
                  <td>{o.item_count || '-'}</td>
                  <td className="fw-bold text-brand">{fmtPrice(o.total)}</td>
                  <td>{o.payment_method === 'transfer' ? 'CK' : 'COD'}</td>
                  <td>{o.delivery_type === 'ship' ? '🚚' : '🏪'}</td>
                  <td><span className={`status-badge ${statusCls[o.status] || 'bg-secondary'}`}>{statusMap[o.status] || o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center">
          <small className="text-muted">{total} đơn hàng</small>
          {totalPages > 1 && (
            <nav><ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(page - 1)}>&laquo;</button></li>
              {Array.from({length: totalPages}, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages).map((p, idx, arr) => (
                <span key={p}>{idx > 0 && arr[idx-1] !== p-1 && <li className="page-item disabled"><span className="page-link">...</span></li>}<li className={`page-item ${p === page ? 'active' : ''}`}><button className="page-link" onClick={() => setPage(p)}>{p}</button></li></span>
              ))}
              <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(page + 1)}>&raquo;</button></li>
            </ul></nav>
          )}
        </div>
      </div>

      <div className="modal fade" id="orderDetailModal" tabIndex="-1" onClick={() => setDetail(null)}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header"><h5 className="modal-title fw-bold">Chi tiết đơn hàng #{detail?.order_code}</h5><button type="button" className="btn-close" data-bs-dismiss="modal" onClick={() => setDetail(null)} /></div>
            <div className="modal-body">
              {detail && (
                <div className="small">
                  <p><strong>Khách:</strong> {detail.customer_name} - {detail.customer_phone}</p>
                  {detail.address && <p><strong>Địa chỉ:</strong> {detail.address}</p>}
                  {detail.note && <p><strong>Ghi chú:</strong> {detail.note}</p>}
                  <p><strong>HT giao:</strong> {detail.delivery_type === 'ship' ? 'Giao hàng' : 'Tại quán'} | <strong>TT:</strong> {detail.payment_method === 'transfer' ? 'Chuyển khoản' : 'COD'} | <strong>TK:</strong> {detail.payment_status === 'paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}</p>
                  <p><strong>Ngày:</strong> {new Date(detail.created_at).toLocaleString('vi-VN')}</p>
                  <table className="table table-sm">
                    <thead><tr><th>Món</th><th>SL</th><th>ĐG</th><th>TT</th></tr></thead>
                    <tbody>{(detail.items || []).map((i, idx) => <tr key={idx}><td>{i.item_name}</td><td>{i.quantity}</td><td>{fmtPrice(i.item_price)}</td><td className="fw-bold">{fmtPrice(i.item_price * i.quantity)}</td></tr>)}</tbody>
                  </table>
                  <h6 className="text-end text-brand fw-bold">Tổng: {fmtPrice(detail.total)}</h6>
                  <div className="d-flex gap-2 mt-3">
                    {detail.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(detail.id, 'confirmed')}>Xác nhận</button>}
                    {detail.status === 'confirmed' && <button className="btn btn-sm btn-info text-white" onClick={() => updateStatus(detail.id, 'preparing')}>Bắt đầu nấu</button>}
                    {detail.status === 'preparing' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(detail.id, 'completed')}>Hoàn thành</button>}
                    {(detail.status === 'pending' || detail.status === 'confirmed') && <button className="btn btn-sm btn-outline-danger" onClick={() => updateStatus(detail.id, 'cancelled')}>Hủy</button>}
                    {detail.payment_method === 'transfer' && detail.payment_status === 'unpaid' && <button className="btn btn-sm btn-success" id="confirmPaymentBtn" onClick={() => confirmPayment(detail.id)}><i className="bi bi-check-circle"></i> Xác nhận đã thanh toán</button>}
                    <button className="btn btn-sm btn-outline-primary" onClick={printInvoice}><i className="bi bi-printer"></i> In</button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Đóng</button></div>
          </div>
        </div>
      </div>

      <div id="printArea" style={{display:'none'}}></div>
    </>
  );
}
