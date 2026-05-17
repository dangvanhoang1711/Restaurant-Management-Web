import { fmtPrice } from '../utils';

export default function FeaturedItems({ featured, onItemClick }) {
  return (
    <>
      <h5 className="fw-bold mb-3"><i className="bi bi-fire text-brand"></i> Món nổi bật</h5>
      <div className="row g-3 mb-4">
        {featured.map(item => (
          <div className="col-lg-3 col-md-6" key={item.id}>
            <div className="card border-0 shadow-sm h-100 menu-card" onClick={() => onItemClick(item)} style={{cursor:'pointer'}}>
              <div className="rounded-top" style={{background: item.image_bg, height: 120}} />
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 className="card-title fw-bold mb-0">{item.name}</h6>
                  <span className="badge bg-danger rounded-pill" style={{fontSize:10}}>Hot</span>
                </div>
                <p className="card-text text-muted small">{item.description}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fs-5 fw-bold text-brand">{fmtPrice(item.price)}</span>
                  <button className="btn btn-sm btn-brand rounded-pill" onClick={e => { e.stopPropagation(); onItemClick(item); }}>
                    <i className="bi bi-plus-lg"></i> Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
