import { useState, useEffect } from 'react';
import { API } from '../utils';

export default function GioiThieu() {
  const [s, setS] = useState(null);

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(j => { if (j.success) setS(j.data); });
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-brand shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/"><i className="bi bi-shop"></i> {s?.shop_name || 'Châu Loan'}</a>
          <a href="/" className="btn btn-outline-light btn-sm rounded-pill"><i className="bi bi-house"></i> Về trang chủ</a>
        </div>
      </nav>

      <div className="container py-4 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h2 className="fw-bold mb-3"><i className="bi bi-info-circle text-brand"></i> Giới thiệu về {s?.shop_name || 'Châu Loan'}</h2>
            <p className="lead text-muted">
              Chào mừng bạn đến với <strong>{s?.shop_name || 'Châu Loan'}</strong> — nơi hội tụ những món ăn đậm đà hương vị Việt Nam.
            </p>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100 stat-card">
                  <div className="card-body text-center py-4">
                    <div className="fs-1 text-brand">🍜</div>
                    <h6 className="fw-bold mt-2">Đa dạng món ngon</h6>
                    <p className="small text-muted mb-0">Cơm, mì, phở, đồ uống — đầy đủ các món từ truyền thống đến hiện đại.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100 stat-card">
                  <div className="card-body text-center py-4">
                    <div className="fs-1 text-brand">🥬</div>
                    <h6 className="fw-bold mt-2">Nguyên liệu tươi sạch</h6>
                    <p className="small text-muted mb-0">Cam kết sử dụng nguyên liệu tươi ngon mỗi ngày, an toàn vệ sinh.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100 stat-card">
                  <div className="card-body text-center py-4">
                    <div className="fs-1 text-brand">🚚</div>
                    <h6 className="fw-bold mt-2">Giao hàng tận nơi</h6>
                    <p className="small text-muted mb-0">Giao hàng nhanh trong bán kính {s?.delivery_radius || 5}km, đóng gói cẩn thận.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm h-100 stat-card">
                  <div className="card-body text-center py-4">
                    <div className="fs-1 text-brand">💯</div>
                    <h6 className="fw-bold mt-2">Hài lòng khách hàng</h6>
                    <p className="small text-muted mb-0">Đội ngũ nhân viên thân thiện, phục vụ tận tâm.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-bold"><i className="bi bi-geo-alt text-brand"></i> Thông tin liên hệ</h5>
                <table className="table table-borderless mb-0 small">
                  <tbody>
                    {s?.shop_address && <tr><td className="text-nowrap pe-3"><strong>Địa chỉ:</strong></td><td>{s.shop_address}</td></tr>}
                    {s?.shop_phone && <tr><td className="text-nowrap pe-3"><strong>Điện thoại:</strong></td><td>{s.shop_phone}</td></tr>}
                    {s?.shop_email && <tr><td className="text-nowrap pe-3"><strong>Email:</strong></td><td>{s.shop_email}</td></tr>}
                    {s?.shop_hours && <tr><td className="text-nowrap pe-3"><strong>Giờ mở cửa:</strong></td><td>{s.shop_hours} (Tất cả các ngày trong tuần)</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-4 overflow-hidden">
              <div className="card-body p-0">
                <div className="ratio ratio-16x9">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4538.556669773913!2d107.5961257757657!3d16.468559428622623!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3141a117efbd00f1%3A0xfc270e9f24c9208f!2zMzAgQsOgIFRyaeG7h3UsIFRodeG6rW4gSMOzYSwgSHXhur8sIFZp4buHdCBOYW0!5e1!3m2!1svi!2s!4v1779015379377!5m2!1svi!2s"
                    width="100%"
                    height="350"
                    style={{border:0}}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-dark text-white py-4 mt-auto">
        <div className="container text-center">
          <p className="small text-secondary mb-0">&copy; 2026 {s?.shop_name || 'Châu Loan'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
