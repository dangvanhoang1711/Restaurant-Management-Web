CREATE DATABASE IF NOT EXISTS quan_an_ngon
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quan_an_ngon;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price INT NOT NULL,
  description VARCHAR(255) DEFAULT '',
  image_bg VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  delivery_type ENUM('ship','pickup') NOT NULL DEFAULT 'pickup',
  address VARCHAR(255) DEFAULT '',
  note TEXT DEFAULT '',
  payment_method ENUM('cod','transfer') NOT NULL DEFAULT 'cod',
  total INT NOT NULL DEFAULT 0,
  status ENUM('pending','confirmed','preparing','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT,
  item_name VARCHAR(100) NOT NULL,
  item_price INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categories (name, slug) VALUES
  ('Cơm', 'com'),
  ('Mì', 'mi'),
  ('Phở', 'pho')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO menu_items (category_id, name, price, description, image_bg) VALUES
  (1, 'Cơm Tấm Sườn', 35000, 'Cơm tấm sườn nướng thơm ngon, ăn kèm bì chả', 'linear-gradient(135deg, #ff9a9e, #fad0c4)'),
  (1, 'Cơm Gà Nướng', 40000, 'Cơm gà nướng mềm ngọt, sốt đậm đà', 'linear-gradient(135deg, #a8edea, #fed6e3)'),
  (1, 'Cơm Rang Thập Cẩm', 30000, 'Cơm rang tôm, lạp xưởng, trứng, rau củ', 'linear-gradient(135deg, #ffecd2, #fcb69f)'),
  (1, 'Cơm Sườn Nướng', 38000, 'Sườn nướng than hoa, cơm nóng dẻo thơm', 'linear-gradient(135deg, #fbc2eb, #a6c1ee)'),
  (2, 'Mì Xào Bò', 35000, 'Mì xào bò mềm, rau xanh giòn ngọt', 'linear-gradient(135deg, #fddb92, #d1fdff)'),
  (2, 'Mì Quảng Gà', 40000, 'Mì Quảng đặc sản, gà thả vườn, đậu phộng', 'linear-gradient(135deg, #f6d365, #fda085)'),
  (2, 'Mì Trộn Thịt', 32000, 'Mì trộn thịt băm, nước sốt đậm đà', 'linear-gradient(135deg, #89f7fe, #66a6ff)'),
  (2, 'Mì Xào Hải Sản', 45000, 'Mì xào tôm, mực, mềm ngon', 'linear-gradient(135deg, #f093fb, #f5576c)'),
  (3, 'Phở Bò Tái', 40000, 'Phở bò tái chín, nước dùng thanh ngọt', 'linear-gradient(135deg, #4facfe, #00f2fe)'),
  (3, 'Phở Gà', 35000, 'Phở gà xé, nước dùng ngọt thanh', 'linear-gradient(135deg, #fa709a, #fee140)'),
  (3, 'Phở Tái Nạm', 45000, 'Phở tái nạm, thịt mềm, nước dùng đậm', 'linear-gradient(135deg, #a18cd1, #fbc2eb)'),
  (3, 'Phở Bò Viên', 38000, 'Phở bò viên dai ngon, nước dùng đậm đà', 'linear-gradient(135deg, #ff9a9e, #fecfef)');
