const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ success: false, message: 'Thiếu tên hoặc slug' });
  try {
    await pool.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [name.trim(), slug.trim().toLowerCase()]);
    res.json({ success: true, message: 'Đã thêm danh mục' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Slug đã tồn tại' });
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, slug } = req.body;
  try {
    const fields = []; const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name.trim()); }
    if (slug !== undefined) { fields.push('slug = ?'); params.push(slug.trim().toLowerCase()); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Không có dữ liệu' });
    params.push(id);
    await pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [menu] = await conn.execute('SELECT id FROM menu_items WHERE category_id = ?', [id]);
    if (menu.length) {
      return res.status(400).json({ success: false, message: `Còn ${menu.length} món thuộc danh mục này. Xoá món trước.` });
    }
    await conn.execute('DELETE FROM categories WHERE id = ?', [id]);
    await conn.commit();
    res.json({ success: true, message: 'Đã xoá danh mục' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  } finally {
    conn.release();
  }
});

module.exports = router;
