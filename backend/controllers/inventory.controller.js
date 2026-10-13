// controllers/inventory.controller.js
// HTTP layer for staff inventory endpoints.
// Owned by Person 4.

'use strict';

const inventoryService = require('../services/inventory.service');

/**
 * POST /api/v1/inventory/stock-adjustments
 * Auth required: WAREHOUSE_STAFF or ADMIN
 * Body: { variantId, adjustmentType, quantityChange, reason }
 * Success: 201 { data: { adjustmentId, newStockQuantity } }
 * Errors:
 *   404 NOT_FOUND: "Variant not found."
 *   422 BUSINESS_RULE_VIOLATION: raised by trg_prevent_negative_stock (handled by errorHandler)
 */
exports.createStockAdjustment = async (req, res, next) => {
  try {
    const { variantId, adjustmentType, quantityChange, reason } = req.body;
    const result = await inventoryService.adjustStock({
      variantId,
      adjustmentType,
      quantityChange,
      reason,
    });
    return res.status(201).json({ data: result });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
    // Trigger SIGNAL 45000 is mapped to HTTP 422 by the centralized errorHandler
    next(err);
  }
};

/**
  * GET /api/v1/inventory/stock-adjustments
  * Auth required: WAREHOUSE_STAFF or ADMIN
  * Success: 200 { data: [ ...adjustments ] }
  */
exports.listStockAdjustments = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const adjustments = await inventoryService.listRecentAdjustments(limit);
    return res.status(200).json({ data: adjustments });
  } catch (err) {
    next(err);
  }
};

/**
  * GET /api/v1/inventory/variants
  * Auth required: WAREHOUSE_STAFF or ADMIN
  * Query: ?q=...&limit=30
  * Success: 200 { data: [ ...variants ] }
  */
exports.searchVariants = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit, 10) || 30;
    const variants = await inventoryService.searchVariants(q, limit);
    return res.status(200).json({ data: variants });
  } catch (err) {
    next(err);
  }
};

