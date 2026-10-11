// config/db.js
// MySQL connection pool — owned by Person 1; imported by every service module.
// Never require this file before process.env has been loaded (dotenv must run first in server.js).

'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME || 'brightbuy',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  waitForConnections: true,
  queueLimit: 0,
  // Preserve calendar DATE values across client/server timezones.
  dateStrings: ['DATE'],
  // Raise errors on lost connections so the app restarts cleanly
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000,
});

module.exports = pool;
