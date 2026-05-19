import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { API, fmtPrice, playNewOrderSound } from '../utils';
import { SkeletonStat } from './Skeleton';

export default function DashboardTab({ chartRef }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const chartInstRef = useRef(null);

  function getHeaders() {
    const t = localStorage.getItem('admin_token');
    return t ? { 'Authorization': 'Bearer ' + t } : {};
  }

  function load() {
    fetch(`${API}/orders/stats`, { headers: getHeaders() }).then(r => r.json()).then(j => { if (j.success) setStats(j.data); });
    fetch(`${API}/orders?limit=5`, { headers: getHeaders() }).then(r => r.json()).then(j => { if (j.success) setRecentOrders(j.data || []); });
    fetch(`${API}/orders/revenue`, { headers: getHeaders() }).then(r => r.json()).then(j => { if (j.success) setRevenueData(j.data); });
  }

  useEffect(() => {
    load();
    const token = localStorage.getItem('admin_token');
    let es = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;

    function connectSSE() {
      if (!window.EventSource || !token) return;
      es?.close();
      es = new EventSource(`${API}/orders/stream?token=${token}`);

      es.addEventListener('order:created', () => { playNewOrderSound(); load(); });
      es.addEventListener('order:updated', load);

      es.onerror = () => {
        es?.close();
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        reconnectTimer = setTimeout(connectSSE, delay);
      };

      es.addEventListener('connected', () => { reconnectAttempts = 0; });
    }

    connectSSE();

    return () => { es?.close(); clearTimeout(reconnectTimer); };
  }, []);

  useEffect(() => {
    if (!chartRef) return;
    setTimeout(() => {
      const canvas = document.getElementById('revenueChart');
      if (!canvas) return;
      if (chartInstRef.current) chartInstRef.current.destroy();
      if (!revenueData || !revenueData.labels) return;
      chartInstRef.current = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: revenueData.labels,
          datasets: [{
            label: 'Doanh thu',
            data: revenueData.data,
            backgroundColor: 'rgba(238,77,45,.7)',
            borderRadius: 6,
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => fmtPrice(v) } } } }
      });
    }, 100);
  }, [revenueData]);

  const statusMap = { pending: 'Chờ XN', confirmed: 'Đã XN', preparing: 'Đang nấu', completed: 'Xong', cancelled: 'Hủy' };
  const colorMap = { pending: 'warning', confirmed: 'primary', preparing: 'info', completed: 'success', cancelled: 'danger' };

  return (
    <>
      <h4 className="fw-bold mb-3">Tổng quan</h4>
      <div className="row g-3 mb-4">
        {stats ? [
          { label: 'Đơn hôm nay', value: stats.todayOrders || 0, icon: 'receipt', color: 'primary' },
          { label: 'Chờ xử lý', value: stats.pendingOrders || 0, icon: 'clock', color: 'warning' },
          { label: 'Đang nấu', value: stats.preparingOrders || 0, icon: 'fire', color: 'info' },
          { label: 'Doanh thu hôm nay', value: fmtPrice(stats.todayRevenue || 0), icon: 'graph-up', color: 'danger' },
        ].map(s => (
          <div className="col-lg-3 col-6" key={s.label}>
            <div className="card border-0 shadow-sm stat-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">{s.label}</small>
                    <h4 className="fw-bold mb-0 mt-1">{s.value}</h4>
                  </div>
                  <i className={`bi bi-${s.icon} fs-2 text-${s.color} opacity-25`}></i>
                </div>
              </div>
            </div>
          </div>
        )) : Array.from({ length: 4 }).map((_, i) => (
          <div className="col-lg-3 col-6" key={'sk-stat-' + i}>
            <SkeletonStat />
          </div>
        ))}
      </div>
      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0"><h6 className="fw-bold mb-0"><i className="bi bi-graph-up text-brand"></i> Doanh thu 7 ngày</h6></div>
            <div className="card-body"><div className="chart-container" style={{position:'relative',height:260}}><canvas id="revenueChart"></canvas></div></div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0"><h6 className="fw-bold mb-0"><i className="bi bi-clock-history text-brand"></i> Đơn gần đây</h6></div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {recentOrders.map(o => (
                  <div className="list-group-item py-2" key={o.id}>
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold small">#{o.order_code}</span>
                      <span className={`badge bg-${colorMap[o.status] || 'secondary'} ms-2`} style={{fontSize:10}}>{statusMap[o.status] || o.status}</span>
                    </div>
                    <small className="text-muted">{o.customer_name} - {fmtPrice(o.total)}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
