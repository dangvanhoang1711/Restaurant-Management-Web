import { useState, useEffect } from 'react';
import { fetchCategories } from '../utils';

const iconMap = {
  com: '🍚', mi: '🍜', pho: '🍲', douong: '🥤', topping: '🧀',
};

export default function CategoryNav({ category, onCategoryChange, search, onSearchChange }) {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    fetchCategories().then(all => setCats(all.filter(c => c.slug !== 'topping')));
  }, []);

  return (
    <div className="category-nav sticky-top" style={{top:56}}>
      <div className="container py-2">
        <div className="d-flex gap-3 align-items-center">
          <div className="flex-grow-1 overflow-hidden">
            <ul className="nav nav-pills" id="categoryTabs">
              <li className="nav-item" key="all">
                <button className={`nav-link ${category === 'all' ? 'active' : ''}`}
                  onClick={() => onCategoryChange('all')}>
                  <i className="bi bi-grid-fill"></i> Tất cả
                </button>
              </li>
              {cats.map(c => (
                <li className="nav-item" key={c.slug}>
                  <button
                    className={`nav-link ${category === c.slug ? 'active' : ''}`}
                    onClick={() => onCategoryChange(c.slug)}
                  >
                    {iconMap[c.slug] || '📋'} {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{minWidth:180}}>
            <input
              type="text"
              className="form-control form-control-sm search-box"
              placeholder="🔍 Tìm món..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
