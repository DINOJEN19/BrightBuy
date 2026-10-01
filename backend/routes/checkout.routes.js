// routes/checkout.routes.js
// Express routes for checkout orchestration.
// Owned by Person 3.

'use strict';

const router = require('express').Router();
const { authenticateJWT } = require('../middleware/auth');
const checkoutController = require('../controllers/checkout.controller');

// POST /api/v1/checkout — atomic order placement via sp_PlaceOrder
router.post('/', authenticateJWT, checkoutController.checkout);

module.exports = router;
