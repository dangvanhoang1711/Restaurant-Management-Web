const tabs = ['dashboard', 'orders', 'menu', 'categories', 'vouchers', 'settings'];
const icons = {
  dashboard: 'speedometer2', orders: 'receipt', menu: 'menu-app',
  categories: 'tags', vouchers: 'ticket-perforated', settings: 'gear'
};
const labels = {
  dashboard: 'Tổng quan', orders: 'Đơn hàng', menu: 'Thực đơn',
  categories: 'Danh mục', vouchers: 'Voucher', settings: 'Cài đặt'
};

export default function AdminSidebar({ tab, setTab, username, logout, open, onToggle }) {
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onToggle}></div>}
      <aside className={`sidebar d-flex flex-column${open ? ' open' : ''}`}>
        <button className="sidebar-close" onClick={onToggle}>&times;</button>
        <div className="p-3 border-bottom" style={{borderColor:'rgba(255,255,255,0.06)'}}>
        <a href="/" className="text-white text-decoration-none" target="_blank">
          <h5 className="mb-0 sidebar-brand"><i className="bi bi-shop"></i> Châu Loan</h5>
          <small style={{color:'#6c757d',fontSize:'0.7rem'}}>Bảng quản lý</small>
        </a>
      </div>
      <nav className="flex-grow-1 py-2">
        {tabs.map(t => (
          <a key={t} className={`nav-link ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            <i className={`bi bi-${icons[t]}`}></i>
            <span>{labels[t]}</span>
          </a>
        ))}
        <a className="nav-link" href="/cooking" target="_blank">
          <i className="bi bi-fire"></i> <span>Đang nấu</span>
        </a>
      </nav>
      <div className="sidebar-user">
        <div className="d-flex align-items-center gap-2 mb-2 text-white">
          <div style={{width:32,height:32,borderRadius:'50%',background:'var(--brand-gradient)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8rem',fontWeight:700}}>
            {(username || 'C')[0].toUpperCase()}
          </div>
          <div>
            <div className="small fw-semibold">{username || 'Chủ quán'}</div>
            <div style={{color:'#6c757d',fontSize:'0.65rem'}}>Quản trị viên</div>
          </div>
        </div>
        <div className="d-flex gap-2 mt-2">
          <a href="/" className="btn btn-sm flex-fill" style={{background:'rgba(255,255,255,0.08)',color:'#a0aec0',border:'none',borderRadius:'8px',fontSize:'0.75rem'}} target="_blank"><i className="bi bi-box-arrow-up-right"></i> Web</a>
          <button className="btn btn-sm flex-fill" style={{background:'rgba(220,53,69,0.15)',color:'#f5a5b5',border:'none',borderRadius:'8px',fontSize:'0.75rem'}} onClick={logout}><i className="bi bi-box-arrow-right"></i> Thoát</button>
        </div>
      </div>
    </aside>
    </>
  );
}
