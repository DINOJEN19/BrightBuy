// routes/orders.routes.js
// Express routes for customer order history, delivery and payment lookups.
// Owned by Person 4.

'use strict';

const router = require('express').Router();
const { authenticateJWT } = require('../middleware/auth');
const ordersController = require('../controllers/orders.controller');

// GET /api/v1/orders — own order history (paginated)
router.get('/', authenticateJWT, ordersController.getOrders);

// GET /api/v1/orders/:orderId — full order detail (own order only)
router.get('/:orderId', authenticateJWT, ordersController.getOrder);

// GET /api/v1/orders/:orderId/delivery — delivery info (own order only)
router.get('/:orderId/delivery', authenticateJWT, ordersController.getDelivery);

// GET /api/v1/orders/:orderId/payment — payment info (own order only)
router.get('/:orderId/payment', authenticateJWT, ordersController.getPayment);

module.exports = router;
