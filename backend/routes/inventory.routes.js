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
  quantityChange: Joi.number()
    .integer()
    .invalid(0)
    .when('adjustmentType', {
      is: 'RESTOCK',
      then: Joi.number().integer().greater(0).messages({
        'number.greater': 'Restock quantity change must be a positive number greater than 0.',
      }),
    })
    .when('adjustmentType', {
      is: 'DAMAGE',
      then: Joi.number().integer().less(0).messages({
        'number.less': 'Damage quantity change must be a negative number less than 0.',
      }),
    })
    .required(),
  reason: Joi.string()
    .trim()
    .max(255)
    .when('adjustmentType', {
      is: 'RESTOCK',
      then: Joi.string().trim().max(255).allow('', null).default('Standard restock'),
      otherwise: Joi.string().trim().min(1).max(255).required().messages({
        'any.required': 'A reason is required when recording damage or count corrections.',
        'string.empty': 'A reason is required when recording damage or count corrections.',
      }),
    }),
});


// --- Routes ----------------------------------------------------------------

// GET /api/v1/inventory/variants — staff/admin variant search
router.get(
  '/variants',
  authenticateJWT,
  requireRole('WAREHOUSE_STAFF', 'ADMIN'),
  inventoryController.searchVariants
);

// GET /api/v1/inventory/stock-adjustments — staff/admin only
router.get(
  '/stock-adjustments',
  authenticateJWT,
  requireRole('WAREHOUSE_STAFF', 'ADMIN'),
  inventoryController.listStockAdjustments
);


// POST /api/v1/inventory/stock-adjustments — staff/admin only
router.post(
  '/stock-adjustments',
  authenticateJWT,
  requireRole('WAREHOUSE_STAFF', 'ADMIN'),
  validateBody(stockAdjustmentSchema),
  inventoryController.createStockAdjustment
);

module.exports = router;

