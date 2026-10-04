// controllers/cart.controller.js
// HTTP layer for cart endpoints.
// Owned by Person 3.

"use strict";

const cartService = require("../services/cart.service");

/**
 * GET /api/v1/cart
 * Returns the logged-in customer's active cart with line items and running total.
 *
 * Success: 200 { data: { cartId, items: [...], total } }
 */
exports.getCart = async (req, res, next) => {
  try {
    const { customerId } = req.user;
    const cart = await cartService.getCart(customerId);

    return res.status(200).json({
      data: cart,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/v1/cart/items
 * Adds a variant and quantity to the cart.
 *
 * Success: 201 { data: { cartItemId } }
 *
 * Errors:
 *   400 INVALID_QUANTITY: "Quantity must be a positive integer."
 *   404 NOT_FOUND: "Variant not found."
 */
exports.addItem = async (req, res, next) => {
  try {
    const { customerId } = req.user;
    const { variantId, quantity } = req.body;

    const result = await cartService.addItem(customerId, {
      variantId,
      quantity,
    });

    return res.status(201).json({
      data: result,
    });
  } catch (err) {
    if (err.code === "INVALID_QUANTITY") {
      return res.status(400).json({
        error: {
          code: "INVALID_QUANTITY",
          message: err.message,
        },
      });
    }

    if (err.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: err.message,
        },
      });
    }

    return next(err);
  }
};

/**
 * PUT /api/v1/cart/items/:cartItemId
 * Updates the quantity of an existing cart line item.
 *
 * Success: 200 { data: { cartItemId, quantity } }
 *
 * Errors:
 *   400 INVALID_QUANTITY: "Quantity must be a positive integer."
 *   404 NOT_FOUND: "Cart item not found."
 */
exports.updateItem = async (req, res, next) => {
  try {
    const { customerId } = req.user;
    const cartItemId = parseInt(req.params.cartItemId, 10);
    const { quantity } = req.body;

    const result = await cartService.updateItem(customerId, cartItemId, {
      quantity,
    });

    return res.status(200).json({
      data: result,
    });
  } catch (err) {
    if (err.code === "INVALID_QUANTITY") {
      return res.status(400).json({
        error: {
          code: "INVALID_QUANTITY",
          message: err.message,
        },
      });
    }

    if (err.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: err.message,
        },
      });
    }

    return next(err);
  }
};

/**
 * DELETE /api/v1/cart/items/:cartItemId
 * Removes a line item from the cart.
 *
 * Success: 204 No Content
 *
 * Errors:
 *   404 NOT_FOUND: "Cart item not found."
 */
exports.removeItem = async (req, res, next) => {
  try {
    const { customerId } = req.user;
    const cartItemId = parseInt(req.params.cartItemId, 10);

    await cartService.removeItem(customerId, cartItemId);

    return res.status(204).send();
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: err.message,
        },
      });
    }

    return next(err);
  }
};
