const express = require('express');
const router = express.Router();
const pool = require('../db');
const { emitter, onOrderCreated, onOrderUpdated } = require('../sse');
const { authMiddleware } = require('./auth');

function generateOrderCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

router.post('/', async (req, res) => {
  const { customerName, customerPhone, deliveryType, address, note, paymentMethod, items, orderCode: clientCode, voucherCode } = req.body;

  if (!customerName || !customerPhone || !items || !items.length) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt hàng' });
  }
  if (deliveryType === 'ship' && !address) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ giao hàng' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    let discount = 0;
    let appliedVoucher = '';
    if (voucherCode) {
      const [vrows] = await conn.execute('SELECT * FROM vouchers WHERE code = ? AND active = 1', [voucherCode.trim().toUpperCase()]);
      if (vrows.length) {
        const v = vrows[0];
        if (!(v.expires_at && new Date(v.expires_at) < new Date(new Date().toDateString())) &&
            !(v.max_usage > 0 && v.used_count >= v.max_usage) &&
            !(v.min_order > 0 && subtotal < v.min_order)) {
          discount = v.type === 'percent' ? Math.round(subtotal * v.value / 100) : v.value;
          if (discount > subtotal) discount = subtotal;
          appliedVoucher = v.code;
          await conn.execute('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [v.id]);
        }
      }
    }

    let deliveryFee = 0;
    if (deliveryType === 'ship' && address) {
      try {
        const [sRows] = await conn.execute("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('restaurant_lat','restaurant_lng','delivery_base_km','delivery_base_fee','delivery_extra_fee')");
        const s = {};
        for (const r of sRows) s[r.setting_key] = r.setting_value;
        const rLat = parseFloat(s.restaurant_lat) || 16.4663130;
        const rLng = parseFloat(s.restaurant_lng) || 107.5996701;
        const baseKm = parseInt(s.delivery_base_km) || 3;
        const baseFee = parseInt(s.delivery_base_fee) || 12000;
        const extraFee = parseInt(s.delivery_extra_fee) || 3000;

        const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=vn`, {
          headers: { 'User-Agent': 'QuanAnNgon/1.0' }
        }).then(r => r.json());
        if (Array.isArray(geo) && geo.length > 0) {
          const dLat = (parseFloat(geo[0].lat) - rLat) * Math.PI / 180;
          const dLng = (parseFloat(geo[0].lon) - rLng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(rLat * Math.PI / 180) * Math.cos(parseFloat(geo[0].lat) * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          deliveryFee = dist <= baseKm ? baseFee : baseFee + Math.ceil(dist - baseKm) * extraFee;
        }
      } catch (err) {
        console.error('Delivery fee calc error:', err);
      }
    }

    const total = subtotal - discount + deliveryFee;

    let orderCode = clientCode || '';
    let attempts = 0;
    while (true) {
      if (orderCode) {
        const [existing] = await conn.execute('SELECT id FROM orders WHERE order_code = ?', [orderCode]);
        if (!existing.length) break;
      }
      orderCode = generateOrderCode();
      const [existing] = await conn.execute('SELECT id FROM orders WHERE order_code = ?', [orderCode]);
      if (!existing.length || ++attempts > 10) break;
    }

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (order_code, customer_name, customer_phone, delivery_type, address, note, payment_method, payment_status, total, discount, voucher_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, ?, ?)`,
      [orderCode, customerName, customerPhone, deliveryType, address || '', note || '', paymentMethod, total, discount, appliedVoucher]
    );

    const orderId = orderResult.insertId;

    const values = items.map(i => [orderId, i.id, i.name, i.price, i.qty]);
    await conn.query(
      'INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity) VALUES ?',
      [values]
    );

    await conn.commit();

    onOrderCreated({ id: orderId, orderCode, customerName, customerPhone, deliveryType, address, note, paymentMethod, total, discount, status: 'pending', created_at: new Date() });

    res.json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: { orderId, orderCode, payment_status: 'unpaid', discount, total }
    });
  } catch (err) {
    await conn.rollback();
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại' });
  } finally {
    conn.release();
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
  }
  try {
    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    onOrderUpdated({ id: Number(id), status });
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.put('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await pool.execute('SELECT status, created_at FROM orders WHERE id = ?', [id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    const o = orders[0];
    if (o.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Đơn đã được xử lý, không thể hủy' });

    const elapsed = (Date.now() - new Date(o.created_at).getTime()) / 60000;
    if (elapsed > 5)
      return res.status(400).json({ success: false, message: 'Đã quá 5 phút, không thể hủy. Vui lòng liên hệ quán.' });

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', id]);
    onOrderUpdated({ id: Number(id), status: 'cancelled' });
    res.json({ success: true, message: 'Đã hủy đơn thành công' });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.put('/:id/payment', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;
  if (!['unpaid', 'paid'].includes(payment_status)) {
    return res.status(400).json({ success: false, message: 'Trạng thái thanh toán không hợp lệ' });
  }
  try {
    const [orders] = await pool.execute('SELECT status FROM orders WHERE id = ?', [id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    if (payment_status === 'paid') {
      const currentStatus = orders[0].status;
      const newStatus = (currentStatus === 'pending' || currentStatus === 'cancelled')
        ? (currentStatus === 'cancelled' ? 'cancelled' : 'confirmed')
        : currentStatus;
      await pool.execute('UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['paid', newStatus, id]);
      onOrderUpdated({ id: Number(id), payment_status: 'paid', status: newStatus });
    } else {
      await pool.execute('UPDATE orders SET payment_status = ? WHERE id = ?', ['unpaid', id]);
      onOrderUpdated({ id: Number(id), payment_status: 'unpaid' });
    }
    res.json({ success: true, message: payment_status === 'paid' ? 'Đã xác nhận thanh toán - đơn chuyển sang Đã xác nhận' : 'Đã bỏ xác nhận thanh toán' });
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/track', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ success: false, message: 'Thiếu số điện thoại' });
    const [rows] = await pool.execute(
      `SELECT id, order_code, customer_name, customer_phone, delivery_type, address,
              note, payment_method, payment_status, total, status, created_at
       FROM orders WHERE customer_phone = ?
       ORDER BY created_at DESC LIMIT 10`,
      [phone]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Track order error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [today] = await pool.execute(
      `SELECT COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END),0) AS revenue,
              COUNT(*) AS total
       FROM orders WHERE DATE(created_at) = CURDATE()`
    );
    const [pending] = await pool.execute(
      `SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'`
    );
    const [preparing] = await pool.execute(
      `SELECT COUNT(*) AS count FROM orders WHERE status = 'preparing'`
    );
    const [payment] = await pool.execute(
      `SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(total),0) AS total
       FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled'
       GROUP BY payment_method`
    );
    let cashCount = 0, cashTotal = 0, transferCount = 0, transferTotal = 0;
    payment.forEach(r => {
      if (r.payment_method === 'cod') { cashCount = Number(r.count); cashTotal = Number(r.total); }
      else { transferCount = Number(r.count); transferTotal = Number(r.total); }
    });
    res.json({
      success: true,
      data: {
        todayOrders: Number(today[0].total),
        todayRevenue: Number(today[0].revenue),
        pendingOrders: Number(pending[0].count),
        preparingOrders: Number(preparing[0].count),
        cashCount, cashTotal, transferCount, transferTotal,
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/revenue', authMiddleware, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
    const interval = days - 1;
    const [rows] = await pool.execute(`
      SELECT DATE(created_at) AS date, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [interval]);

    function fmtLabel(d) {
      return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    }
    function ymd(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    const labels = [];
    const data = [];
    const counts = [];
    for (let i = interval; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = ymd(d);
      const row = rows.find(r => ymd(r.date) === ds);
      labels.push(fmtLabel(d));
      data.push(row ? Number(row.revenue) : 0);
      counts.push(row ? Number(row.orders) : 0);
    }
    const totalRevenue = data.reduce((a, b) => a + b, 0);
    const totalOrders = counts.reduce((a, b) => a + b, 0);
    res.json({ success: true, data: { labels, data, counts, totalRevenue, totalOrders, days } });
  } catch (err) {
    console.error('Revenue error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/top-items', authMiddleware, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
    const interval = days - 1;
    const [rows] = await pool.execute(`
      SELECT oi.item_name, SUM(oi.quantity) AS qty, SUM(oi.item_price * oi.quantity) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND o.status != 'cancelled'
        AND oi.item_name NOT LIKE '%(+%'
      GROUP BY oi.item_name
      ORDER BY qty DESC, revenue DESC
      LIMIT 5
    `, [interval]);
    res.json({ success: true, data: rows.map(r => ({ ...r, qty: Number(r.qty), revenue: Number(r.revenue) })) });
  } catch (err) {
    console.error('Top items error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/top-customers', authMiddleware, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const interval = days - 1;
    const [rows] = await pool.execute(`
      SELECT customer_name, customer_phone, COUNT(*) AS orders, COALESCE(SUM(total),0) AS total_spent
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND status != 'cancelled'
      GROUP BY customer_name, customer_phone
      ORDER BY orders DESC, total_spent DESC
      LIMIT 5
    `, [interval]);
    res.json({ success: true, data: rows.map(r => ({ ...r, orders: Number(r.orders), total_spent: Number(r.total_spent) })) });
  } catch (err) {
    console.error('Top customers error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/export', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.delivery_type,
             o.address, o.note, o.payment_method, o.payment_status, o.total, o.status, o.created_at
      FROM orders o ORDER BY o.created_at DESC
    `);
    const header = 'Mã ĐH,Tên khách,SĐT,Hình thức,Địa chỉ,Thanh toán,Tổng tiền,Trạng thái,Ngày tạo\n';
    const statusLabels = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', preparing: 'Đang nấu', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
    const payLabels = { cod: 'COD', transfer: 'Chuyển khoản' };
    const rowsCsv = rows.map(o =>
      `#${o.id},"${o.customer_name}",${o.customer_phone},${o.delivery_type === 'ship' ? 'Giao hàng' : 'Tại quán'},"${(o.address||'').replace(/"/g,'""')}",${payLabels[o.payment_method]||o.payment_method},${o.total},"${statusLabels[o.status]||o.status}",${new Date(o.created_at).toLocaleString('vi-VN')}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=don-hang.csv');
    res.write('\uFEFF');
    res.end(header + rowsCsv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status;
    const searchTerm = req.query.search;

    let whereClause = '';
    let params = [];
    const conditions = [];

    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        conditions.push('status IN (' + statuses.map(() => '?').join(',') + ')');
        params.push(...statuses);
      }
    }

    if (searchTerm) {
      conditions.push('(customer_name LIKE ? OR customer_phone LIKE ?)');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) AS total FROM orders ' + whereClause,
      params
    );
    const total = Number(countResult[0].total);

    const [rows] = await pool.execute(
      `SELECT id, order_code, customer_name, customer_phone, delivery_type, address,
              note, payment_method, payment_status, total, status, created_at
       FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const data = await Promise.all(rows.map(async (o) => {
      const [items] = await pool.execute(
        'SELECT item_name, item_price, quantity FROM order_items WHERE order_id = ?',
        [o.id]
      );
      return { ...o, items, item_count: items.reduce((s, i) => s + i.quantity, 0) };
    }));

    res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/stream', authMiddleware, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const onCreated = (data) => {
    res.write(`event: order:created\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onUpdated = (data) => {
    res.write(`event: order:updated\ndata: ${JSON.stringify(data)}\n\n`);
  };

  emitter.on('order:created', onCreated);
  emitter.on('order:updated', onUpdated);

  res.write('event: connected\ndata: {}\n\n');

  req.on('close', () => {
    emitter.off('order:created', onCreated);
    emitter.off('order:updated', onUpdated);
  });
});

module.exports = router;
