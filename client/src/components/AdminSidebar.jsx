const tabs = ['dashboard', 'orders', 'menu', 'categories', 'vouchers', 'settings'];

export default function AdminSidebar({ tab, setTab, username, logout }) {
  return (
    <aside className="sidebar d-flex flex-column">
      <div className="p-3 border-bottom border-secondary">
        <a href="/" className="text-white text-decoration-none" target="_blank">
          <h5 className="fw-bold mb-0"><i className="bi bi-shop"></i> Châu Loan</h5>
          <small className="text-secondary">Bảng quản lý</small>
        </a>
      </div>
      <nav className="flex-grow-1 py-2">
        {tabs.map(t => (
          <a key={t} className={`nav-link ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            <i className={`bi bi-${t === 'dashboard' ? 'speedometer2' : t === 'orders' ? 'receipt' : t === 'menu' ? 'menu-app' : t === 'categories' ? 'tags' : t === 'vouchers' ? 'ticket-perforated' : 'gear'}`}></i>
            {t === 'dashboard' ? ' Tổng quan' : t === 'orders' ? ' Đơn hàng' : t === 'menu' ? ' Thực đơn' : t === 'categories' ? ' Danh mục' : t === 'vouchers' ? ' Voucher' : ' Cài đặt'}
          </a>
        ))}
        <a className="nav-link" href="/cooking" target="_blank"><i className="bi bi-fire"></i> Đang nấu</a>
      </nav>
      <div className="p-3 border-top border-secondary">
        <div className="text-white small mb-2"><i className="bi bi-person-circle"></i> {username || 'Chủ quán'}</div>
        <div className="d-flex gap-2">
          <a href="/" className="btn btn-outline-light btn-sm flex-fill" target="_blank"><i className="bi bi-box-arrow-up-right"></i> Web</a>
          <button className="btn btn-outline-danger btn-sm flex-fill" onClick={logout}><i className="bi bi-box-arrow-right"></i> Thoát</button>
        </div>
      </div>
    </aside>
  );
}
