import { useState, useEffect } from 'react';
import { fmtPrice, fetchCategories } from '../utils';
import { SkeletonCard } from './Skeleton';

export default function MenuGrid({ items, loading, category, onItemClick }) {
  const [catMap, setCatMap] = useState({});

  useEffect(() => {
    fetchCategories().then(all => {
      const m = {};
      for (const c of all) m[c.slug] = c.name;
      setCatMap(m);
    });
  }, []);

  return (
    <>
      <h5 className="fw-bold mb-3">
        {category === 'all' ? '🍽️ Thực đơn' : catMap[category] || 'Thực đơn'}
      </h5>
      <div className="row g-3" id="menuGrid">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div className="col-lg-3 col-md-4 col-6" key={'skeleton-' + i}>
              <SkeletonCard />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            <i className="bi bi-emoji-frown fs-1"></i>
            <p className="mt-2">Không tìm thấy món nào</p>
          </div>
        ) : items.map(item => (
          <div className="col-lg-3 col-md-4 col-6" key={item.id}>
            <div className="card h-100 menu-card" onClick={() => onItemClick(item)}>
              <div className="card-img-top" style={{background: item.image_bg}}>
                <span className="price-tag">{fmtPrice(item.price)}</span>
              </div>
              <div className="card-body d-flex flex-column">
                <h6 className="card-title mb-1">{item.name}</h6>
                <p className="card-text flex-grow-1">{item.description}</p>
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <span className="fw-bold text-brand" style={{fontSize:'0.9rem'}}>{fmtPrice(item.price)}</span>
                  <button className="btn btn-brand btn-add" onClick={e => { e.stopPropagation(); onItemClick(item); }}>
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
