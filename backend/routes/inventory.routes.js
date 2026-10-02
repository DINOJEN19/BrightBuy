// routes/inventory.routes.js
// Express routes for staff inventory operations.
// Owned by Person 4.

'use strict';

const router = require('express').Router();
const Joi = require('joi');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validateBody');
const inventoryController = require('../controllers/inventory.controller');

// --- Joi schema ------------------------------------------------------------

const stockAdjustmentSchema = Joi.object({
  variantId: Joi.number().integer().positive().required(),
  adjustmentType: Joi.string().valid('RESTOCK', 'CORRECTION', 'DAMAGE').required(),
  quantityChange: Joi.number().integer().invalid(0).required(), // negative = reduce stock
  reason: Joi.string().min(1).max(255).required(),
});

// --- Routes ----------------------------------------------------------------

// POST /api/v1/inventory/stock-adjustments — staff/admin only
router.post(
  '/stock-adjustments',
  authenticateJWT,
  requireRole('WAREHOUSE_STAFF', 'ADMIN'),
  validateBody(stockAdjustmentSchema),
  inventoryController.createStockAdjustment
);

module.exports = router;
