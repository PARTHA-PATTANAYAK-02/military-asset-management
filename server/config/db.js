const mysql = require("mysql2/promise");
require("dotenv").config();

const fs = require("fs");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "military_asset_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL_CA
    ? {
        ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n"),
        rejectUnauthorized: true,
      }
    : undefined,
});

module.exports = pool;
