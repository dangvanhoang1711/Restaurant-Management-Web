const mysql = require('mysql2/promise');

const CFG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4',
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
};

const DB_NAME = process.env.DB_NAME || 'quan_an_ngon';

async function initDatabase() {
  const conn = await mysql.createConnection(CFG);

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${DB_NAME}\``);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      slug VARCHAR(20) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      price INT NOT NULL,
      description VARCHAR(255) DEFAULT '',
      image_bg VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      delivery_type ENUM('ship','pickup') NOT NULL DEFAULT 'pickup',
      address VARCHAR(255) DEFAULT '',
      note TEXT,
      payment_method ENUM('cod','transfer') NOT NULL DEFAULT 'cod',
      total INT NOT NULL DEFAULT 0,
      status ENUM('pending','confirmed','preparing','completed','cancelled') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  try { await conn.query(`ALTER TABLE orders ADD COLUMN payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid' AFTER payment_method`); }
  catch { /* column already exists */ }
  try { await conn.query(`ALTER TABLE orders ADD COLUMN order_code VARCHAR(7) AFTER id`); }
  catch { /* column already exists */ }
  try { await conn.query(`ALTER TABLE orders ADD COLUMN discount INT NOT NULL DEFAULT 0 AFTER total`); }
  catch { /* column already exists */ }
  try { await conn.query(`ALTER TABLE orders ADD COLUMN voucher_code VARCHAR(20) AFTER discount`); }
  catch { /* column already exists */ }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      menu_item_id INT,
      item_name VARCHAR(100) NOT NULL,
      item_price INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Add email column if missing
  try { await conn.query('ALTER TABLE admin_users ADD COLUMN email VARCHAR(255) DEFAULT \'\' AFTER password'); } catch {}

  await conn.query(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(50) PRIMARY KEY,
      setting_value VARCHAR(255) NOT NULL DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const defaults = [
    ['shop_name', 'Châu Loan'],
    ['shop_address', '30 Bà Triệu, phường Thuận Hóa, TP Huế'],
    ['shop_phone', '0796 575 671'],
    ['shop_email', 'dangvanhoang1711@gmail.com'],
    ['shop_hours', '09:00 - 22:00'],
    ['delivery_fee', '0'],
    ['delivery_radius', '5'],
    ['restaurant_lat', '16.4663130'],
    ['restaurant_lng', '107.5996701'],
    ['delivery_base_km', '3'],
    ['delivery_base_fee', '12000'],
    ['delivery_extra_fee', '3000'],
  ];
  for (const [k, v] of defaults) {
    await conn.query('INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)', [k, v]);
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) NOT NULL UNIQUE,
      type ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
      value INT NOT NULL,
      min_order INT NOT NULL DEFAULT 0,
      max_usage INT NOT NULL DEFAULT 0,
      used_count INT NOT NULL DEFAULT 0,
      expires_at DATE DEFAULT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS toppings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS menu_item_toppings (
      menu_item_id INT NOT NULL,
      topping_id INT NOT NULL,
      PRIMARY KEY (menu_item_id, topping_id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
      FOREIGN KEY (topping_id) REFERENCES toppings(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  async function getCatId(slug) {
    const [r] = await conn.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    return r.length ? r[0].id : null;
  }

  async function ensureCat(name, slug) {
    let id = await getCatId(slug);
    if (!id) {
      const [r] = await conn.query('INSERT INTO categories (name, slug) VALUES (?,?)', [name, slug]);
      id = r.insertId;
      console.log(`  \u2713 Đã thêm danh mục "${name}"`);
    }
    return id;
  }

  const catCom = await ensureCat('Cơm', 'com');
  const catMi = await ensureCat('Mì', 'mi');
  const catPho = await ensureCat('Phở', 'pho');
  const catTop = await ensureCat('Topping', 'topping');
  const catDoUong = await ensureCat('Đồ uống', 'douong');

  async function seedMenu(catId, items) {
    for (const item of items) {
      const [exist] = await conn.query('SELECT id FROM menu_items WHERE name = ? AND category_id = ?', [item[0], catId]);
      if (!exist.length) {
        await conn.query('INSERT INTO menu_items (category_id, name, price, description, image_bg) VALUES (?,?,?,?,?)', [catId, ...item]);
      }
    }
  }

  console.log('  \u2713 Bỏ qua seed món ăn — chỉ giữ món do admin thêm');

  await conn.query(`DELETE m1 FROM menu_items m1 INNER JOIN menu_items m2 WHERE m1.id > m2.id AND m1.name = m2.name AND m1.category_id = m2.category_id`);

  console.log('  \u2713 Database "' + DB_NAME + '" đã sẵn sàng');
}

module.exports = initDatabase;
