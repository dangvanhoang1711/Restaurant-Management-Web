import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { API, fmtPrice, playNewOrderSound } from '../utils';
import { SkeletonStat } from './Skeleton';

export default function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [range, setRange] = useState(7);
  const chartRef = useRef(null);
  const paymentChartRef = useRef(null);

  function getHeaders() {
    const t = localStorage.getItem('admin_token');
    return t ? { 'Authorization': 'Bearer ' + t } : {};
  }

  function updateChart(data) {
    if (!data || !data.labels) return;
    if (chartRef.current) {
      chartRef.current.data.labels = data.labels;
      chartRef.current.data.datasets[0].data = data.data;
      chartRef.current.data.datasets[1].data = data.counts;
      chartRef.current.update('none');
    }
  }

  function buildChart(data) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas || !data || !data.labels) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Doanh thu',
            data: data.data,
            backgroundColor: 'rgba(238,77,45,.7)',
            borderRadius: 4,
            yAxisID: 'y',
            order: 2,
          },
          {
            label: 'Đơn hàng',
            data: data.counts,
            type: 'line',
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13,110,253,.1)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#0d6efd',
            pointRadius: 3,
            yAxisID: 'y1',
            order: 1,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
        },
        scales: {
          y: {
            beginAtZero: true, position: 'left', grid: { drawBorder: false },
            ticks: { callback: v => fmtPrice(v), font: { size: 10 } }
          },
          y1: {
            beginAtZero: true, position: 'right', grid: { drawOnChartArea: false },
            ticks: { precision: 0, font: { size: 10 } }
          }
        }
      },
      plugins: [{ id: 'fillCanvas', beforeDraw: (chart) => { chart.ctx.fillStyle = '#fafafa'; chart.ctx.fillRect(0, 0, chart.width, chart.height); } }]
    });
  }

  function load() {
    fetch(`${API}/orders/stats`, { headers: getHeaders() }).then(r => r.json()).then(j => { if (j.success) setStats(j.data); });
    fetch(`${API}/orders?limit=6`, { headers: getHeaders() }).then(r => r.json()).then(j => { if (j.success) setRecentOrders(j.data || []); });
    fetch(`${API}/orders/revenue?days=${range}`, { headers: getHeaders() }).then(r => r.json()).then(j => {
      if (j.success) {
        setRevenueData(j.data);
        if (!chartRef.current) buildChart(j.data);
        else updateChart(j.data);
      }
    });
    fetch(`${API}/orders/top-items?days=${range}`, { headers: getHeaders() }).then(r => r.json()).then(j => { if (j.success) setTopItems(j.data || []); });
    fetch(`${API}/orders/top-customers?days=${range}`, { headers: getHeaders() }).then(r => r.json()).then(j => { if (j.success) setTopCustomers(j.data || []); });
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

  // Periodic polling fallback — refresh every 15s in case SSE drops
  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [range]);

  useEffect(() => { load(); }, [range]);

  useEffect(() => {
    if (!stats) return;
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;
    if (paymentChartRef.current) paymentChartRef.current.destroy();
    paymentChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Tiền mặt', 'Chuyển khoản'],
        datasets: [{
          data: [stats.cashCount || 0, stats.transferCount || 0],
          backgroundColor: ['#10b981', '#3b82f6'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = (stats.cashCount || 0) + (stats.transferCount || 0);
                const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ` ${ctx.parsed} đơn (${pct}%)`;
              },
              afterLabel: ctx => {
                const amt = ctx.dataIndex === 0 ? stats.cashTotal : stats.transferTotal;
                return ` Tổng: ${fmtPrice(amt)}`;
              },
              footer: ctx => {
                const total = (stats.cashCount || 0) + (stats.transferCount || 0);
                const other = ctx[0].dataIndex === 0 ? stats.transferCount : stats.cashCount;
                const otherAmt = ctx[0].dataIndex === 0 ? stats.transferTotal : stats.cashTotal;
                const otherLabel = ctx[0].dataIndex === 0 ? 'Chuyển khoản' : 'Tiền mặt';
                return `${otherLabel}: ${other} đơn — ${fmtPrice(otherAmt)} (trong ${total} đơn)`;
              }
            }
          }
        },
        cutout: '65%',
      }
    });
    return () => { if (paymentChartRef.current) paymentChartRef.current.destroy(); };
  }, [stats]);

  const statusMap = { pending: 'Chờ XN', confirmed: 'Đã XN', preparing: 'Đang nấu', completed: 'Xong', cancelled: 'Hủy' };
  const statusCls = { pending: 'status-pending', confirmed: 'status-confirmed', preparing: 'status-preparing', completed: 'status-completed', cancelled: 'status-cancelled' };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold mb-0">Tổng quan</h4>
        <div className="btn-group btn-group-sm">
          {[7, 30, 90].map(d => (
            <button key={d} className={`btn ${range === d ? 'btn-brand' : 'btn-outline-brand'}`} onClick={() => setRange(d)}>
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-4">
        {stats ? [
          { label: 'Đơn hôm nay', value: stats.todayOrders || 0, icon: 'receipt', gradient: 'stat-gradient-1' },
          { label: 'Chờ xử lý', value: stats.pendingOrders || 0, icon: 'clock', gradient: 'stat-gradient-2' },
          { label: 'Đang nấu', value: stats.preparingOrders || 0, icon: 'fire', gradient: 'stat-gradient-3' },
          { label: 'Doanh thu hôm nay', value: fmtPrice(stats.todayRevenue || 0), icon: 'graph-up', gradient: 'stat-gradient-4' },
        ].map((s, idx) => (
          <div className="col-lg-3 col-6" key={s.label} style={{animationDelay: `${idx * 0.08}s`}}>
            <div className="card border-0 shadow-sm stat-card animate-fade-in-up">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted stat-label">{s.label}</small>
                    <div className="stat-value">{s.value}</div>
                  </div>
                  <div className={`stat-icon ${s.gradient} text-white`}>
                    <i className={`bi bi-${s.icon}`}></i>
                  </div>
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
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0"><i className="bi bi-graph-up text-brand"></i> Doanh thu & đơn hàng</h6>
            </div>
            <div className="card-body">
              {/* Period summary bar */}
              {revenueData && (
                <div className="d-flex gap-4 mb-3 pb-3 border-bottom flex-wrap">
                  <div>
                    <small className="text-muted d-block" style={{fontSize:'0.72rem'}}>Tổng doanh thu ({range} ngày)</small>
                    <span className="fw-bold fs-5 text-brand">{fmtPrice(revenueData.totalRevenue || 0)}</span>
                  </div>
                  <div>
                    <small className="text-muted d-block" style={{fontSize:'0.72rem'}}>Tổng đơn hàng</small>
                    <span className="fw-bold fs-5">{revenueData.totalOrders || 0}</span>
                  </div>
                  <div>
                    <small className="text-muted d-block" style={{fontSize:'0.72rem'}}>TB đơn/ngày</small>
                    <span className="fw-bold fs-5">{Math.round((revenueData.totalOrders || 0) / (revenueData.days || 1))}</span>
                  </div>
                  <div>
                    <small className="text-muted d-block" style={{fontSize:'0.72rem'}}>TB giá trị đơn</small>
                    <span className="fw-bold fs-5">{revenueData.totalOrders ? fmtPrice(Math.round(revenueData.totalRevenue / revenueData.totalOrders)) : '0₫'}</span>
                  </div>
                </div>
              )}
              <div className="chart-container" style={{position:'relative',height:260}}><canvas id="revenueChart"></canvas></div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0"><h6 className="fw-bold mb-0"><i className="bi bi-cash-stack text-brand"></i> Thanh toán hôm nay</h6></div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center" style={{minHeight:200}}>
              {stats ? (
                <>
                  <div style={{width:160,height:160,maxWidth:'100%'}}><canvas id="paymentChart" style={{width:'100%',height:'100%'}}></canvas></div>
                  <div className="d-flex flex-wrap gap-3 mt-2 small justify-content-center">
                    <div><span className="fw-medium text-success">●</span> Tiền mặt: <strong>{fmtPrice(stats.cashTotal)}</strong> ({stats.cashCount} đơn)</div>
                    <div><span className="fw-medium text-primary">●</span> CK: <strong>{fmtPrice(stats.transferTotal)}</strong> ({stats.transferCount} đơn)</div>
                  </div>
                </>
              ) : (
                <div className="text-muted small">Đang tải...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-4 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0"><h6 className="fw-bold mb-0"><i className="bi bi-clock-history text-brand"></i> Đơn gần đây</h6></div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {recentOrders.map(o => (
                  <div className="list-group-item py-2 border-0 border-bottom" key={o.id}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold small">#{o.order_code}</span>
                      <span className={`status-badge ${statusCls[o.status] || 'bg-secondary'}`}>{statusMap[o.status] || o.status}</span>
                    </div>
                    <small className="text-muted">{o.customer_name} — {fmtPrice(o.total)}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0"><h6 className="fw-bold mb-0"><i className="bi bi-award text-brand"></i> Khách hàng thân thiết</h6></div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {topCustomers.length === 0 && <div className="list-group-item py-3 text-center text-muted small">Chưa có dữ liệu</div>}
                {topCustomers.map((c, idx) => (
                  <div className="list-group-item py-2 border-0 border-bottom" key={c.customer_phone}>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge rounded-pill ${idx < 3 ? 'bg-brand' : 'bg-secondary'}`} style={{width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',padding:0}}>{idx + 1}</span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="small fw-medium text-truncate">{c.customer_name}</div>
                        <div className="small text-muted">{c.customer_phone}</div>
                        <small className="text-muted">{c.orders} đơn — {fmtPrice(c.total_spent)}</small>
                      </div>
                      <a href={`https://zalo.me/${c.customer_phone}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary px-2 py-0" title="Gửi tin nhắn Zalo" style={{fontSize:'0.7rem',borderRadius:'20px',whiteSpace:'nowrap'}}>
                        <i className="bi bi-chat-dots"></i> Zalo
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0"><h6 className="fw-bold mb-0"><i className="bi bi-bar-chart text-brand"></i> Món bán chạy</h6></div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {topItems.length === 0 && <div className="list-group-item py-3 text-center text-muted small">Chưa có dữ liệu</div>}
                {topItems.map((item, idx) => (
                  <div className="list-group-item py-2 border-0 border-bottom d-flex align-items-center gap-2" key={item.item_name}>
                    <span className={`badge rounded-pill ${idx < 3 ? 'bg-brand' : 'bg-secondary'}`} style={{width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',padding:0}}>{idx + 1}</span>
                    <div className="flex-grow-1">
                      <div className="small fw-medium">{item.item_name}</div>
                      <small className="text-muted">{item.qty} đơn — {fmtPrice(item.revenue)}</small>
                    </div>
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
