import { useState, useEffect } from 'react';
import { API, fmtPrice, playNewOrderSound, initNotificationSound } from '../utils';

const statusMap = {
  pending: { label: 'Chờ XN', color: 'warning' },
  confirmed: { label: 'Đã XN', color: 'primary' },
  preparing: { label: 'Đang nấu', color: 'info' },
  completed: { label: 'Xong', color: 'success' },
  cancelled: { label: 'Hủy', color: 'danger' },
};

export default function Cooking() {
  const [orders, setOrders] = useState([]);

  function getHeaders(extra) {
    const t = localStorage.getItem('admin_token');
    return t ? { 'Authorization': 'Bearer ' + t, ...extra } : { ...extra };
  }

  function load() {
    fetch(`${API}/orders?status=confirmed,preparing,pending`, { headers: getHeaders() })
      .then(r => r.json())
      .then(j => { if (j.success) setOrders(j.data); });
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
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

    function onClick() { initNotificationSound(); document.removeEventListener('click', onClick); }
    document.addEventListener('click', onClick);
    return () => { clearInterval(t); es?.close(); clearTimeout(reconnectTimer); document.removeEventListener('click', onClick); };
  }, []);

  function updateStatus(id, status) {
    fetch(`${API}/orders/${id}/status`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    }).then(r => r.json()).then(j => { if (j.success) load(); });
  }

  return (
    <>
      <nav className="navbar navbar-dark bg-brand">
        <div className="container">
          <span className="navbar-brand fw-bold mb-0"><i className="bi bi-fire"></i> Bếp - Châu Loan</span>
          <button className="btn btn-outline-light btn-sm" onClick={load}><i className="bi bi-arrow-clockwise"></i> Làm mới</button>
        </div>
      </nav>

      <div className="container-fluid py-3">
        <div className="row g-3">
          {orders.length === 0 && (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-emoji-neutral fs-1"></i>
              <p className="mt-2">Không có đơn hàng nào đang chờ</p>
            </div>
          )}
          {orders.map(o => (
            <div className="col-lg-4 col-md-6" key={o.id}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <span className="fw-bold small">#{o.order_code}</span>
                  <span className={`badge bg-${statusMap[o.status]?.color || 'secondary'}`}>
                    {statusMap[o.status]?.label || o.status}
                  </span>
                </div>
                <div className="card-body py-2">
                  <div className="small mb-2">
                    <i className="bi bi-person"></i> {o.customer_name}<br />
                    <i className="bi bi-telephone"></i> {o.customer_phone}
                    {o.delivery_type === 'ship' && <><br /><i className="bi bi-geo-alt"></i> {o.address}</>}
                  </div>
                  <ul className="list-group list-group-flush small mb-2">
                    {o.items?.map((item, idx) => (
                      <li className="list-group-item px-0 py-1 d-flex justify-content-between" key={idx}>
                        <span>{item.item_name} x{item.quantity}</span>
                        <span className="fw-bold">{fmtPrice(item.item_price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="d-flex justify-content-between align-items-center border-top pt-2">
                    <span className="fw-bold text-brand">{fmtPrice(o.total)}</span>
                    <div className="d-flex gap-1">
                      {o.status === 'confirmed' && (
                        <button className="btn btn-sm btn-info text-white" onClick={() => updateStatus(o.id, 'preparing')}>
                          <i className="bi bi-fire"></i> Nấu
                        </button>
                      )}
                      {o.status === 'preparing' && (
                        <button className="btn btn-sm btn-success" onClick={() => updateStatus(o.id, 'completed')}>
                          <i className="bi bi-check-lg"></i> Xong
                        </button>
                      )}
                      {o.status === 'pending' && (
                        <button className="btn btn-sm btn-primary" onClick={() => updateStatus(o.id, 'confirmed')}>
                          <i className="bi bi-check-lg"></i> Xác nhận
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
