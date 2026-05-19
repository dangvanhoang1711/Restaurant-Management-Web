import { fmtPrice } from '../utils';

export default function FeaturedItems({ featured, onItemClick }) {
  return (
    <>
      <h5 className="fw-bold mb-3"><i className="bi bi-fire text-brand"></i> Món nổi bật</h5>
      <div className="featured-scroll mb-4 pb-1">
        {featured.map(item => (
          <div className="featured-item shadow-sm" key={item.id} onClick={() => onItemClick(item)}>
            <div className="h-100" style={{background: item.image_bg, minHeight: 180}}>
              <span className="hot-badge"><i className="bi bi-fire"></i> Hot</span>
              <div className="featured-overlay">
                <h6>{item.name}</h6>
                <small>{fmtPrice(item.price)}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
