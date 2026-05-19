import { useState, useEffect, useRef } from 'react';

export default function AddressAutocomplete({ name, required, placeholder, onCoordinate }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function fetchSuggestions(query) {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=5&accept-language=vi`, {
      headers: { 'User-Agent': 'QuanAnNgon/1.0' }
    })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setSuggestions(list);
        setShowDropdown(list.length > 0);
      })
      .catch(() => { setSuggestions([]); setShowDropdown(false); })
      .finally(() => setLoading(false));
  }

  function handleInput(e) {
    const val = e.target.value;
    setInputValue(val);
    onCoordinate?.(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  }

  function selectSuggestion(suggestion) {
    setInputValue(suggestion.display_name);
    setShowDropdown(false);
    onCoordinate?.({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon), address: suggestion.display_name });
  }

  function handleFocus() {
    if (suggestions.length > 0) setShowDropdown(true);
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className="form-control form-control-sm"
        name={name}
        value={inputValue}
        onChange={handleInput}
        onFocus={handleFocus}
        required={required}
        placeholder={placeholder || 'Nhập địa chỉ...'}
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: 'absolute', right: 10, top: 6 }}>
          <small className="text-muted">
            <i className="bi bi-search"></i>
          </small>
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1056,
          background: '#fff', border: '1px solid #ddd', borderRadius: '0 0 6px 6px',
          maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {suggestions.map((s, i) => (
            <div key={s.place_id || i}
              onClick={() => selectSuggestion(s)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13, lineHeight: 1.4,
                borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}
              onMouseEnter={e => e.target.style.background = '#f5f5f5'}
              onMouseLeave={e => e.target.style.background = '#fff'}
            >
              <i className="bi bi-geo-alt text-muted me-1"></i>
              {s.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
