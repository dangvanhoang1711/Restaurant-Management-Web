const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const pool = require('../db');
const { authMiddleware } = require('./auth');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'public', 'images'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Không có file hoặc định dạng không hỗ trợ (JPG/PNG/GIF/WEBP)' });
  const url = '/images/' + req.file.filename;
  res.json({ success: true, data: { url, filename: req.file.filename } });
});

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT m.id, m.name, m.price, m.description, m.image_bg, c.slug AS category, c.id AS category_id
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
    `;
    const params = [];
    if (category && category !== 'all') {
      query += ' WHERE c.slug = ?';
      params.push(category);
    }
    query += ' ORDER BY m.id';
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Menu error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, category_id, price, description, image_bg } = req.body;
  const catId = Number(category_id);
  const priceNum = Number(price);
  if (!name || !catId || isNaN(priceNum) || priceNum <= 0) {
    return res.status(400).json({ success: false, message: 'Thiếu hoặc sai tên, danh mục hoặc giá' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO menu_items (name, category_id, price, description, image_bg) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), catId, priceNum, (description || '').trim(), image_bg || 'linear-gradient(135deg, #ff9a9e, #fad0c4)']
    );
    res.json({ success: true, message: 'Thêm món thành công', data: { id: result.insertId } });
  } catch (err) {
    console.error('Create menu error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, category_id, price, description, image_bg } = req.body;
  try {
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name.trim()); }
    if (category_id !== undefined) { fields.push('category_id = ?'); params.push(Number(category_id)); }
    if (price !== undefined) { fields.push('price = ?'); params.push(Number(price)); }
    if (description !== undefined) { fields.push('description = ?'); params.push((description || '').trim()); }
    if (image_bg !== undefined) { fields.push('image_bg = ?'); params.push(image_bg); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'Không có dữ liệu cập nhật' });
    params.push(id);
    await pool.execute(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('Update menu error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Xóa món thành công' });
  } catch (err) {
    console.error('Delete menu error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/toppings', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, price FROM toppings ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get toppings error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.post('/toppings', authMiddleware, async (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) return res.status(400).json({ success: false, message: 'Thiếu tên hoặc giá' });
  try {
    const [r] = await pool.execute('INSERT INTO toppings (name, price) VALUES (?, ?)', [name.trim(), Number(price)]);
    res.json({ success: true, message: 'Thêm topping thành công', data: { id: r.insertId } });
  } catch (err) {
    console.error('Create topping error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.put('/toppings/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  try {
    await pool.execute('UPDATE toppings SET name = ?, price = ? WHERE id = ?', [name.trim(), Number(price), id]);
    res.json({ success: true, message: 'Cập nhật topping thành công' });
  } catch (err) {
    console.error('Update topping error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.delete('/toppings/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM toppings WHERE id = ?', [id]);
    res.json({ success: true, message: 'Xóa topping thành công' });
  } catch (err) {
    console.error('Delete topping error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/:id/toppings', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT m.id, m.name, m.price
       FROM menu_items m
       JOIN categories c ON m.category_id = c.id
       WHERE c.slug = 'topping'
       ORDER BY m.id`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Toppings error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
