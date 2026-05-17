const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    for (const r of rows) settings[r.setting_key] = r.setting_value;
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Settings get error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await pool.execute('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [String(value), key]);
    }
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
