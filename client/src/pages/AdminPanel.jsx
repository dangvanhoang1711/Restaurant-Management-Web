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
  const allMenuRef = useRef([]);
  const chartRef = useRef(null);

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

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    nav('/admin-login');
  }

  return (
    <div className="d-flex" style={{minHeight:'100vh'}}>
      <AdminSidebar tab={tab} setTab={setTab} username={username} logout={logout} />
      <main className="main-content p-4" style={{overflow:'auto'}}>
        {tab === 'dashboard' && <DashboardTab chartRef={chartRef} />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'menu' && <MenuTab allMenuRef={allMenuRef} />}
        {tab === 'vouchers' && <VouchersTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'categories' && <CategoriesTab />}
      </main>
    </div>
  );
}
