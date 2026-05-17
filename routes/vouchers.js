const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');

router.post('/validate', async (req, res) => {
  const { code, total } = req.body;
  if (!code) return res.json({ success: false, message: 'Nhập mã giảm giá' });

  try {
    const [rows] = await pool.execute('SELECT * FROM vouchers WHERE code = ? AND active = 1', [code.trim().toUpperCase()]);
    if (!rows.length) return res.json({ success: false, message: 'Mã không hợp lệ' });

    const v = rows[0];

    if (v.expires_at && new Date(v.expires_at) < new Date(new Date().toDateString()))
      return res.json({ success: false, message: 'Mã đã hết hạn' });

    if (v.max_usage > 0 && v.used_count >= v.max_usage)
      return res.json({ success: false, message: 'Mã đã hết lượt sử dụng' });

    if (v.min_order > 0 && total < v.min_order)
      return res.json({ success: false, message: `Đơn tối thiểu ${v.min_order.toLocaleString('vi-VN')}đ để áp dụng` });

    let discount = v.type === 'percent' ? Math.round(total * v.value / 100) : v.value;
    if (discount > total) discount = total;

    res.json({ success: true, data: { code: v.code, type: v.type, value: v.value, discount, min_order: v.min_order } });
  } catch (err) {
    console.error('Voucher validate error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vouchers ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Voucher list error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { code, type, value, min_order, max_usage, expires_at } = req.body;
  if (!code || !value) return res.status(400).json({ success: false, message: 'Thiếu mã hoặc giá trị' });
  try {
    await pool.execute(
      'INSERT INTO vouchers (code, type, value, min_order, max_usage, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [code.trim().toUpperCase(), type || 'percent', Number(value), Number(min_order) || 0, Number(max_usage) || 0, expires_at || null]
    );
    res.json({ success: true, message: 'Thêm voucher thành công' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Mã đã tồn tại' });
    console.error('Voucher create error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { code, type, value, min_order, max_usage, expires_at, active } = req.body;
  try {
    const fields = []; const params = [];
    if (code !== undefined) { fields.push('code = ?'); params.push(code.trim().toUpperCase()); }
    if (type !== undefined) { fields.push('type = ?'); params.push(type); }
    if (value !== undefined) { fields.push('value = ?'); params.push(Number(value)); }
    if (min_order !== undefined) { fields.push('min_order = ?'); params.push(Number(min_order)); }
    if (max_usage !== undefined) { fields.push('max_usage = ?'); params.push(Number(max_usage)); }
    if (expires_at !== undefined) { fields.push('expires_at = ?'); params.push(expires_at || null); }
    if (active !== undefined) { fields.push('active = ?'); params.push(active ? 1 : 0); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Không có dữ liệu' });
    params.push(id);
    await pool.execute(`UPDATE vouchers SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('Voucher update error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM vouchers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    console.error('Voucher delete error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
