// app.js
// Express application factory — owned exclusively by Person 1.
// Persons 2-5 NEVER edit this file; they mount their routes by adding a new file
// to the routes/ directory (auto-loaded below) or by asking Person 1.

'use strict';

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/auth.routes');
const customersRoutes = require('./routes/customers.routes');
// Persons 2-5: add your route requires below (do NOT edit anything else in this file)
const catalogueRoutes  = require('./routes/catalogue.routes');
const cartRoutes       = require('./routes/cart.routes');
const checkoutRoutes   = require('./routes/checkout.routes');
// const ordersRoutes     = require('./routes/orders.routes');
// const inventoryRoutes  = require('./routes/inventory.routes');
// const reportsRoutes    = require('./routes/reports.routes');
// const adminRoutes      = require('./routes/admin.routes');

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Health-check (unauthenticated; useful for Docker/container health checks)
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ---------------------------------------------------------------------------
// API routes — all scoped to /api/v1
// ---------------------------------------------------------------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customersRoutes);
// Persons 2-5: mount your routes below (same pattern)
app.use('/api/v1', catalogueRoutes);
app.use('/api/v1/cart',                 cartRoutes);
app.use('/api/v1/checkout',             checkoutRoutes);
// app.use('/api/v1/orders',               ordersRoutes);
// app.use('/api/v1/inventory',            inventoryRoutes);
// app.use('/api/v1/reports',              reportsRoutes);
// app.use('/api/v1/admin',                adminRoutes);

// ---------------------------------------------------------------------------
// 404 catch-all (must come after all route mounts)
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
});

// ---------------------------------------------------------------------------
// Centralized error handler (must be LAST — 4-argument signature required)
// ---------------------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
