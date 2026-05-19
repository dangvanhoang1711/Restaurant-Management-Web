const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const initDatabase = require('./init-db');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const { router: authRoutes } = require('./routes/auth');
const voucherRoutes = require('./routes/vouchers');
const settingsRoutes = require('./routes/settings');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

async function start() {
  console.log('Khởi tạo database...');
  try {
    await initDatabase();
  } catch (err) {
    console.error('LỖI database:', err.message);
    console.error('Hãy đảm bảo MySQL đang chạy ở localhost:3306');
    process.exit(1);
  }

  app.use(cors());
  app.use(express.json());

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', loginLimiter);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'client', 'dist')));

  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/vouchers', voucherRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/categories', categoryRoutes);

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin`);
  });
}

start();
