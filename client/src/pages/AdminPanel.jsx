import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, initNotificationSound } from '../utils';
import AdminSidebar from '../components/AdminSidebar';
import DashboardTab from '../components/DashboardTab';
import OrdersTab from '../components/OrdersTab';
import MenuTab from '../components/MenuTab';
import VouchersTab from '../components/VouchersTab';
import SettingsTab from '../components/SettingsTab';
import CategoriesTab from '../components/CategoriesTab';

export default function AdminPanel() {
  const nav = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [username, setUsername] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const allMenuRef = useRef([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { nav('/admin-login'); return; }
    fetch(`${API}/auth/verify`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(j => { if (!j.success) { localStorage.clear(); nav('/admin-login'); } })
      .catch(() => { localStorage.clear(); nav('/admin-login'); });
    const un = localStorage.getItem('admin_username');
    if (un) setUsername(un);
    function onClick() { initNotificationSound(); document.removeEventListener('click', onClick); }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function handleSetTab(t) {
    setTab(t);
    setSidebarOpen(false);
  }

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    nav('/admin-login');
  }

  return (
    <div className="d-flex" style={{minHeight:'100vh'}}>
      <button id="sidebarToggle" onClick={() => setSidebarOpen(o => !o)}><i className="bi bi-list"></i></button>
      <AdminSidebar tab={tab} setTab={handleSetTab} username={username} logout={logout} open={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <main className="main-content p-4" style={{overflow:'auto'}}>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'menu' && <MenuTab allMenuRef={allMenuRef} />}
        {tab === 'vouchers' && <VouchersTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'categories' && <CategoriesTab />}
      </main>
    </div>
  );
}
