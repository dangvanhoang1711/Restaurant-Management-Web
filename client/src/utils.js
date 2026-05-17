export const API = '/api';

export function fmtPrice(p) {
  return new Intl.NumberFormat('vi-VN').format(p) + '₫';
}

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
export function playNewOrderSound() {
  try {
    const ac = getAudioCtx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(800, ac.currentTime);
    o.frequency.setValueAtTime(1000, ac.currentTime + 0.15);
    g.gain.setValueAtTime(0.3, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.3);
    o.start(ac.currentTime);
    o.stop(ac.currentTime + 0.3);
  } catch { /* ignore */ }
}
export function initNotificationSound() {
  getAudioCtx();
}

let _catCache = null;
let _catPromise = null;
export function fetchCategories(force) {
  if (force || !_catCache) {
    if (!_catPromise) {
      _catPromise = fetch(`${API}/categories`).then(r => r.json()).then(j => {
        if (j.success) _catCache = j.data;
        return _catCache || [];
      }).catch(() => []);
    }
    return _catPromise;
  }
  return Promise.resolve(_catCache);
}
export function invalidateCategories() { _catCache = null; _catPromise = null; }

export const CATEGORIES = [
  { slug: 'all', label: 'Tất cả', icon: '<i class="bi bi-grid-fill"></i>' },
  { slug: 'com', label: 'Cơm', icon: '🍚' },
  { slug: 'mi', label: 'Mì', icon: '🍜' },
  { slug: 'pho', label: 'Phở', icon: '🍲' },
  { slug: 'douong', label: 'Đồ uống', icon: '🥤' },
];
