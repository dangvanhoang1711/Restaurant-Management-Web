import { useState, useEffect } from 'react';
import { API } from '../utils';

export default function CustomerFooter() {
  const [s, setS] = useState(null);

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(j => { if (j.success) setS(j.data); });
  }, []);

  return (
    <footer className="footer-gradient py-4 mt-auto">
      <div className="container">
        <div className="row g-3">
          <div className="col-md-4">
            <h6 className="fw-bold text-white" style={{fontFamily:'var(--font-display)'}}><i className="bi bi-shop"></i> {s?.shop_name || 'Châu Loan'}</h6>
            {s?.shop_address && <p className="small mb-1">📍 {s.shop_address}</p>}
            {s?.shop_phone && <p className="small mb-1">📞 {s.shop_phone}</p>}
            {s?.shop_hours && <p className="small mb-1">🕐 {s.shop_hours}</p>}
          </div>
          <div className="col-md-4">
            <h6 className="fw-bold text-white">Liên kết</h6>
            <a href="/gioi-thieu" className="d-block small text-decoration-none mb-1"><i className="bi bi-chevron-right"></i> Giới thiệu</a>
            <a href="/track" className="d-block small text-decoration-none" data-bs-toggle="modal" data-bs-target="#trackOrderModal"><i className="bi bi-chevron-right"></i> Tra cứu đơn hàng</a>
          </div>
          <div className="col-md-4">
            <h6 className="fw-bold text-white">Theo dõi</h6>
            <div className="d-flex gap-2">
              <a href="#" className="btn btn-outline-light btn-sm rounded-circle" style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="bi bi-facebook"></i></a>
              <a href="#" className="btn btn-outline-light btn-sm rounded-circle" style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="bi bi-instagram"></i></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
