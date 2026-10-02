// controllers/orders.controller.js
// HTTP layer for customer order endpoints.
// Owned by Person 4.

'use strict';

const ordersService = require('../services/orders.service');

/** Maps service errors (NOT_FOUND / FORBIDDEN) to HTTP responses. Returns true if handled. */
function handleOrderError(err, res) {
  if (err.code === 'NOT_FOUND') {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: err.message },
    });
  }
  if (err.code === 'FORBIDDEN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: err.message },
    });
  }
  return null;
}

/**
 * GET /api/v1/orders?page=&pageSize=
 * Success: 200 { data: [ { orderId, orderDate, orderStatus, totalAmount, deliveryMode, paymentStatus } ], meta }
 */
exports.getOrders = async (req, res, next) => {
  try {
    let page = parseInt(req.query.page, 10);
    let pageSize = parseInt(req.query.pageSize, 10);

    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(pageSize) || pageSize < 1) pageSize = 20;
    if (pageSize > 100) pageSize = 100; // max pageSize = 100

    const result = await ordersService.getOrders(req.user.customerId, { page, pageSize });
    return res.status(200).json({ data: result.orders, meta: result.meta });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/orders/:orderId
 * Success: 200 { data: { orderId, items, delivery, payment } }
 * Errors: 403 FORBIDDEN, 404 NOT_FOUND
 */
exports.getOrder = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const order = await ordersService.getOrderById(req.user.customerId, orderId);
    return res.status(200).json({ data: order });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    next(err);
  }
};

/**
 * GET /api/v1/orders/:orderId/delivery
 * Success: 200 { data: { deliveryMode, destinationCity, deliveryStatus, estimatedDeliveryDate, actualDeliveryDate } }
 */
exports.getDelivery = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const delivery = await ordersService.getDelivery(req.user.customerId, orderId);
    return res.status(200).json({ data: delivery });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    next(err);
  }
};

/**
 * GET /api/v1/orders/:orderId/payment
 * Success: 200 { data: { paymentMethod, paymentStatus, amount, paymentDate } }
 */
exports.getPayment = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const payment = await ordersService.getPayment(req.user.customerId, orderId);
    return res.status(200).json({ data: payment });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    next(err);
  }
};
