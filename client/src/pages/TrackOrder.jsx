import { useState, useEffect, useRef } from 'react';
import { API, fmtPrice } from '../utils';

const statusMap = {
  pending: { label: 'Chờ xác nhận', color: 'warning' },
  confirmed: { label: 'Đã xác nhận', color: 'primary' },
  preparing: { label: 'Đang nấu', color: 'info' },
  completed: { label: 'Hoàn thành', color: 'success' },
  cancelled: { label: 'Đã hủy', color: 'danger' },
};

export default function TrackOrder() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function doSearch(p) {
    setSearched(true);
    fetch(`${API}/orders/track?phone=` + encodeURIComponent(p))
      .then(r => r.json())
      .then(j => { if (j.success) setOrders(j.data); });
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      fetch(`${API}/orders/track?phone=` + encodeURIComponent(p))
        .then(r => r.json())
        .then(j => { if (j.success) setOrders(j.data); });
    }, 10000);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const p = e.target.phone.value.trim();
    if (!p) return;
    setPhone(p);
    doSearch(p);
  }

  function cancelOrder(id) {
    if (!confirm('Hủy đơn hàng này?')) return;
    fetch(`${API}/orders/${id}/cancel`, { method: 'PUT' })
      .then(r => r.json())
      .then(j => {
        if (j.success) doSearch(phone);
        else alert(j.message);
      });
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-brand shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/"><i className="bi bi-shop"></i> Châu Loan</a>
          <a href="/" className="btn btn-outline-light btn-sm rounded-pill"><i className="bi bi-house"></i> Về trang chủ</a>
        </div>
      </nav>

      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3"><i className="bi bi-truck text-brand"></i> Tra cứu đơn hàng</h5>
                <form onSubmit={handleSubmit}>
                  <div className="input-group mb-3">
                    <input type="tel" className="form-control" name="phone" placeholder="Nhập số điện thoại..." required />
                    <button className="btn btn-brand" type="submit"><i className="bi bi-search"></i> Tra cứu</button>
                  </div>
                </form>

                {!searched && (
                  <p className="text-muted small text-center mb-0">Nhập số điện thoại để tra cứu đơn hàng của bạn</p>
                )}

                {searched && orders.length === 0 && (
                  <p className="text-muted small text-center mb-0">Không tìm thấy đơn hàng nào</p>
                )}

                {orders.map(o => (
                  <div className="card border mb-2" key={o.id}>
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold small">#{o.order_code}</div>
                          <div className="text-muted small">{o.customer_name} - {fmtPrice(o.total)}</div>
                          <span className={`badge bg-${statusMap[o.status]?.color || 'secondary'} mt-1`}>
                            {statusMap[o.status]?.label || o.status}
                          </span>
                        </div>
                        {(o.status === 'pending' || o.status === 'confirmed') && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => cancelOrder(o.id)}>
                            <i className="bi bi-x-circle"></i> Hủy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
