// server.js
// Entry point — loads env vars, starts the HTTP server.
// Owned by Person 1.

'use strict';

require('dotenv').config({path: require('path').join(__dirname, '.env')}); // must run before anything that reads process.env

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required. Copy backend/.env.example to backend/.env and set a random secret.');
const app = require('./app');

const PORT = parseInt(process.env.PORT, 10) || 3001;

app.listen(PORT, () => {
  console.log(`[BrightBuy API] Server running on http://localhost:${PORT}`);
  console.log(`[BrightBuy API] Environment: ${process.env.NODE_ENV || 'development'}`);
});
