const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quan_an_ngon',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  ...(process.env.DB_SSL === 'true' ? { ssl: {} } : {}),
};

const pool = mysql.createPool(DB_CONFIG);

module.exports = pool;
