// controllers/checkout.controller.js
// HTTP layer for checkout orchestration.
// Owned by Person 3.

'use strict';

const checkoutService = require('../services/checkout.service');

/**
 * POST /api/v1/checkout
 * Converts the active cart into a confirmed order.
 * Calls sp_PlaceOrder via checkoutService.
 *
 * Body: { deliveryMode, deliveryAddress?, destinationCity, paymentMethod, cardDetails?, cartId? }
 * Success: 201 { data: { orderId, estimatedDeliveryDate, orderStatus: 'CONFIRMED' } }
 * Errors:
 *   400 VALIDATION_ERROR: Basic format validation failure.
 *   422 BUSINESS_RULE_VIOLATION: Stored procedure SIGNAL error.
 */
exports.checkout = async (req, res, next) => {
  try {
    const result = await checkoutService.placeOrder(req.user.customerId, req.body);
    return res.status(201).json({ data: result });
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
    // sp_PlaceOrder SIGNAL 45000 is handled by centralized errorHandler (mapped to HTTP 422)
    next(err);
  }
};
