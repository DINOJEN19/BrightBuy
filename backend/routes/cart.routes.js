// routes/cart.routes.js
// Express routes for shopping cart management.
// Owned by Person 3.

'use strict';

const router = require('express').Router();
const { authenticateJWT } = require('../middleware/auth');
const cartController = require('../controllers/cart.controller');

// GET /api/v1/cart — view active cart
router.get('/', authenticateJWT, cartController.getCart);

// POST /api/v1/cart/items — add item to cart
router.post('/items', authenticateJWT, cartController.addItem);

// PUT /api/v1/cart/items/:cartItemId — update item quantity
router.put('/items/:cartItemId', authenticateJWT, cartController.updateItem);

// DELETE /api/v1/cart/items/:cartItemId — remove item from cart
router.delete('/items/:cartItemId', authenticateJWT, cartController.removeItem);

module.exports = router;
