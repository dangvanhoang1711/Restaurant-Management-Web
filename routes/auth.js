const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'quan-an-ngon-secret-key-2026';

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : header || req.query.token;
  if (!token) return res.status(401).json({ success: false, message: 'Thiếu token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
}

// In-memory PIN store: { username: { pin, expires } }
const pinStore = {};

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendPinEmail(email, pin) {
  console.log(`[PIN] Mã PIN cho ${email}: ${pin}`);
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
      family: 4,
    });
    await transporter.sendMail({
      from: `"Châu Loan" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Mã PIN đặt lại mật khẩu - Châu Loan',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#ee4d2d">Châu Loan</h2>
        <p>Mã PIN để đặt lại mật khẩu của bạn là:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#fff0ed;border-radius:8px;color:#ee4d2d">${pin}</div>
        <p style="color:#999;font-size:13px">Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>`,
    });
    console.log(`[PIN] Email sent successfully to ${email}`);
  } catch (err) {
    console.error('[PIN] Failed to send email:', err.message);
    // PIN is still logged above for testing
  }
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  try {
    const [users] = await pool.execute('SELECT id, username, password FROM admin_users WHERE username = ?', [username]);
    if (!users.length) return res.status(400).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    const match = await bcrypt.compare(password, users[0].password);
    if (!match) return res.status(400).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    const token = jwt.sign({ id: users[0].id, username: users[0].username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, data: { token, username: users[0].username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/verify', authMiddleware, (req, res) => {
  res.json({ success: true, data: { username: req.admin.username } });
});

router.post('/forgot', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, message: 'Nhập tên đăng nhập' });
  try {
    const [users] = await pool.execute('SELECT id, email FROM admin_users WHERE username = ?', [username]);
    if (!users.length) return res.status(400).json({ success: false, message: 'Username không tồn tại' });

    const email = users[0].email || process.env.ADMIN_EMAIL;
    if (!email) return res.status(400).json({ success: false, message: 'Tài khoản chưa có email liên kết' });

    const pin = generatePin();
    pinStore[username] = { pin, expires: Date.now() + 10 * 60 * 1000 };

    await sendPinEmail(email, pin);

    res.json({ success: true, message: `Mã PIN đã gửi đến ${email.replace(/(.{3}).+(@)/, '$1***$2')}` });
  } catch (err) {
    console.error('Forgot error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.post('/verify-pin', async (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

  const record = pinStore[username];
  if (!record) return res.status(400).json({ success: false, message: 'Chưa yêu cầu mã PIN hoặc mã đã hết hạn' });
  if (Date.now() > record.expires) {
    delete pinStore[username];
    return res.status(400).json({ success: false, message: 'Mã PIN đã hết hạn. Vui lòng yêu cầu lại.' });
  }
  if (record.pin !== pin) return res.status(400).json({ success: false, message: 'Mã PIN không đúng' });

  record.verified = true;
  res.json({ success: true, message: 'Xác thực thành công' });
});

router.post('/reset', async (req, res) => {
  const { username, pin, newPassword } = req.body;
  if (!username || !pin || !newPassword || newPassword.length < 6)
    return res.status(400).json({ success: false, message: 'Thiếu thông tin hoặc mật khẩu quá ngắn' });

  const record = pinStore[username];
  if (!record || !record.verified)
    return res.status(400).json({ success: false, message: 'Chưa xác thực mã PIN' });
  if (Date.now() > record.expires) {
    delete pinStore[username];
    return res.status(400).json({ success: false, message: 'Mã PIN đã hết hạn' });
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE admin_users SET password = ? WHERE username = ?', [hash, username]);
    delete pinStore[username];
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.get('/seed', async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT COUNT(*) AS cnt FROM admin_users');
    if (Number(existing[0].cnt) > 0) {
      return res.json({ success: true, message: 'Tài khoản admin đã tồn tại' });
    }
    const hash = await bcrypt.hash('admin123', 10);
    await pool.execute('INSERT INTO admin_users (username, password, email) VALUES (?,?,?)', ['admin', hash, process.env.ADMIN_EMAIL || '']);
    res.json({ success: true, message: 'Tạo tài khoản admin thành công! Tên đăng nhập: admin, Mật khẩu: admin123' });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = { router, authMiddleware };
