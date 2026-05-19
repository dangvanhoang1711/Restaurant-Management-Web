import { useState, useEffect } from 'react';
import { API, fmtPrice, playNewOrderSound, initNotificationSound } from '../utils';

const statusMap = {
  pending: { label: 'Chờ XN', color: 'warning' },
  confirmed: { label: 'Đã XN', color: 'primary' },
  preparing: { label: 'Đang nấu', color: 'info' },
  completed: { label: 'Xong', color: 'success' },
  cancelled: { label: 'Hủy', color: 'danger' },
};

function elapsedMin(createdAt) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

export default function Cooking() {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

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

  const borderCls = { pending: 'border-pending', confirmed: 'border-confirmed', preparing: 'border-preparing' };

  return (
    <>
      <nav className="navbar navbar-dark sticky-top">
        <div className="container">
          <span className="navbar-brand mb-0"><i className="bi bi-fire"></i> Bếp — Châu Loan</span>
          <div className="d-flex align-items-center gap-2">
            <span className="text-white-50 small">{orders.length} đơn</span>
            <button className="btn btn-outline-light btn-sm rounded-pill" onClick={load}><i className="bi bi-arrow-clockwise"></i> Làm mới</button>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-3">
        <div className="row g-3">
          {orders.length === 0 && (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-emoji-neutral fs-1 d-block mb-2"></i>
              <span>Không có đơn hàng nào đang chờ</span>
            </div>
          )}
          {orders.map(o => {
            const mins = elapsedMin(o.created_at);
            const isNew = o.status === 'pending' && mins < 2;
            return (
              <div className="col-lg-4 col-md-6" key={o.id}>
                <div className={`card cooking-card h-100 ${borderCls[o.status] || ''} ${isNew ? 'order-new' : ''}`}>
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <span className="fw-bold">#{o.order_code}</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="cooking-timer"><i className="bi bi-clock"></i> {mins} phút</span>
                      <span className={`status-badge ${o.status === 'pending' ? 'status-pending' : o.status === 'confirmed' ? 'status-confirmed' : 'status-preparing'}`}>
                        {statusMap[o.status]?.label || o.status}
                      </span>
                    </div>
                  </div>
                  <div className="card-body py-2">
                    <div className="small mb-2">
                      <i className="bi bi-person"></i> {o.customer_name}<br />
                      <i className="bi bi-telephone"></i> {o.customer_phone}
                      {o.delivery_type === 'ship' && <><br /><i className="bi bi-geo-alt"></i> {o.address}</>}
                    </div>

                    {/* Elapsed time bar */}
                    <div className="mb-2" style={{height:3,background:'#f0f0f0',borderRadius:4,overflow:'hidden'}}>
                      <div style={{
                        height:'100%', borderRadius:4,
                        width: Math.min(100, (mins / 30) * 100) + '%',
                        background: mins > 20 ? 'var(--brand)' : mins > 10 ? '#ffc107' : '#17a2b8',
                        transition: 'width 0.5s'
                      }} />
                    </div>

                    <ul className="list-unstyled small mb-2">
                      {o.items?.map((item, idx) => (
                        <li className="d-flex justify-content-between py-1 border-bottom border-opacity-10" key={idx}>
                          <span>{item.item_name} <span className="text-muted">x{item.quantity}</span></span>
                          <span className="fw-medium">{fmtPrice(item.item_price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between align-items-center pt-1">
                      <span className="fw-bold text-brand" style={{fontSize:'1rem'}}>{fmtPrice(o.total)}</span>
                      <div className="d-flex gap-1">
                        {o.status === 'confirmed' && (
                          <button className="btn btn-sm btn-info text-white rounded-pill px-3" onClick={() => updateStatus(o.id, 'preparing')}>
                            <i className="bi bi-fire"></i> Nấu
                          </button>
                        )}
                        {o.status === 'preparing' && (
                          <button className="btn btn-sm btn-success rounded-pill px-3" onClick={() => updateStatus(o.id, 'completed')}>
                            <i className="bi bi-check-lg"></i> Xong
                          </button>
                        )}
                        {o.status === 'pending' && (
                          <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={() => updateStatus(o.id, 'confirmed')}>
                            <i className="bi bi-check-lg"></i> Xác nhận
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
