import { useState, useEffect } from 'react';
import { API } from '../utils';

export default function CustomerFooter() {
  const [s, setS] = useState(null);

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(j => { if (j.success) setS(j.data); });
  }, []);

  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container">
        <div className="row g-3">
          <div className="col-md-4">
            <h6 className="fw-bold"><i className="bi bi-shop"></i> {s?.shop_name || 'Châu Loan'}</h6>
            {s?.shop_address && <p className="small text-secondary mb-1">📍 {s.shop_address}</p>}
            {s?.shop_phone && <p className="small text-secondary mb-1">📞 {s.shop_phone}</p>}
            {s?.shop_hours && <p className="small text-secondary mb-1">🕐 {s.shop_hours}</p>}
          </div>
          <div className="col-md-4">
            <h6 className="fw-bold">Liên kết</h6>
            <a href="/gioi-thieu" className="d-block small text-secondary text-decoration-none mb-1">Giới thiệu</a>
            <a href="/track" className="d-block small text-secondary text-decoration-none" data-bs-toggle="modal" data-bs-target="#trackOrderModal">Tra cứu đơn hàng</a>
          </div>
          <div className="col-md-4">
            <h6 className="fw-bold">Theo dõi</h6>
            <div className="d-flex gap-2">
              <a href="#" className="btn btn-outline-light btn-sm"><i className="bi bi-facebook"></i></a>
              <a href="#" className="btn btn-outline-light btn-sm"><i className="bi bi-instagram"></i></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
