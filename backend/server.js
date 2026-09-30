// server.js
// Entry point — loads env vars, starts the HTTP server.
// Owned by Person 1.

'use strict';

require('dotenv').config(); // must run before anything that reads process.env

const app = require('./app');

const PORT = parseInt(process.env.PORT, 10) || 3001;

app.listen(PORT, () => {
  console.log(`[BrightBuy API] Server running on http://localhost:${PORT}`);
  console.log(`[BrightBuy API] Environment: ${process.env.NODE_ENV || 'development'}`);
});
