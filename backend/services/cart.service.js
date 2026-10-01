// services/cart.service.js
// Business & database access layer for cart management.
// Owned by Person 3.

'use strict';

const pool = require('../config/db');

/**
 * Returns the logged-in customer's active cart with line items and running total.
 * @param {number} customerId
 * @returns {Promise<{ cartId: number|null, items: Array, total: number }>}
 */
async function getCart(customerId) {
  const conn = await pool.getConnection();
  try {
    // 1. Fetch active cart for customer
    const [cartRows] = await conn.query(
      `SELECT cart_id
       FROM CART
       WHERE customer_id = ? AND cart_status = 'ACTIVE'
       ORDER BY cart_id DESC
       LIMIT 1`,
      [customerId]
    );

    if (cartRows.length === 0) {
      return {
        cartId: null,
        items: [],
        total: 0,
      };
    }

    const cartId = cartRows[0].cart_id;

    // 2. Fetch line items joined with VARIANT
    const [itemRows] = await conn.query(
      `SELECT 
         ci.cart_item_id AS cartItemId,
         ci.variant_id AS variantId,
         v.variant_name AS variantName,
         ci.quantity,
         v.price AS unitPrice,
         (ci.quantity * v.price) AS subtotal
       FROM CART_ITEM ci
       JOIN VARIANT v ON ci.variant_id = v.variant_id
       WHERE ci.cart_id = ?
       ORDER BY ci.cart_item_id ASC`,
      [cartId]
    );

    const items = itemRows.map((r) => {
      const quantity = parseInt(r.quantity, 10);
      const unitPrice = parseFloat(parseFloat(r.unitPrice).toFixed(2));
      const subtotal = parseFloat((quantity * unitPrice).toFixed(2));
      return {
        cartItemId: r.cartItemId,
        variantId: r.variantId,
        variantName: r.variantName,
        quantity,
        unitPrice,
        subtotal,
      };
    });

    const total = parseFloat(
      items.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2)
    );

    return {
      cartId,
      items,
      total,
    };
  } finally {
    conn.release();
  }
}

/**
 * Adds a variant and quantity to the customer's active cart.
 * Creates the cart row on first use.
 * @param {number} customerId
 * @param {{ variantId: number, quantity: number }} param1
 * @returns {Promise<{ cartItemId: number }>}
 */
async function addItem(customerId, { variantId, quantity }) {
  const parsedQty = Number(quantity);
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
    const err = new Error('Quantity must be a positive integer.');
    err.code = 'INVALID_QUANTITY';
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    // 1. Verify variant exists and is active
    const [varRows] = await conn.query(
      `SELECT variant_id, price FROM VARIANT WHERE variant_id = ? AND status = 'ACTIVE'`,
      [variantId]
    );

    if (varRows.length === 0) {
      const err = new Error('Variant not found.');
      err.code = 'NOT_FOUND';
      throw err;
    }

    // 2. Find or create active cart
    const [cartRows] = await conn.query(
      `SELECT cart_id FROM CART WHERE customer_id = ? AND cart_status = 'ACTIVE' LIMIT 1`,
      [customerId]
    );

    let cartId;
    if (cartRows.length === 0) {
      const [insertCartResult] = await conn.query(
        `INSERT INTO CART (customer_id, cart_status) VALUES (?, 'ACTIVE')`,
        [customerId]
      );
      cartId = insertCartResult.insertId;
    } else {
      cartId = cartRows[0].cart_id;
    }

    // 3. Check if variant already exists in this cart
    const [itemRows] = await conn.query(
      `SELECT cart_item_id, quantity FROM CART_ITEM WHERE cart_id = ? AND variant_id = ?`,
      [cartId, variantId]
    );

    let cartItemId;
    if (itemRows.length > 0) {
      cartItemId = itemRows[0].cart_item_id;
      const newQuantity = itemRows[0].quantity + parsedQty;
      await conn.query(
        `UPDATE CART_ITEM SET quantity = ? WHERE cart_item_id = ?`,
        [newQuantity, cartItemId]
      );
    } else {
      const [insertItemResult] = await conn.query(
        `INSERT INTO CART_ITEM (cart_id, variant_id, quantity) VALUES (?, ?, ?)`,
        [cartId, variantId, parsedQty]
      );
      cartItemId = insertItemResult.insertId;
    }

    // Touch cart updated_at
    await conn.query(`UPDATE CART SET updated_at = NOW() WHERE cart_id = ?`, [cartId]);

    return { cartItemId };
  } finally {
    conn.release();
  }
}

/**
 * Updates the quantity of an existing cart line item.
 * @param {number} customerId
 * @param {number} cartItemId
 * @param {{ quantity: number }} param2
 * @returns {Promise<{ cartItemId: number, quantity: number }>}
 */
async function updateItem(customerId, cartItemId, { quantity }) {
  const parsedQty = Number(quantity);
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
    const err = new Error('Quantity must be a positive integer.');
    err.code = 'INVALID_QUANTITY';
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    // Verify item belongs to customer's active cart
    const [rows] = await conn.query(
      `SELECT ci.cart_item_id, ci.cart_id
       FROM CART_ITEM ci
       JOIN CART c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = ? AND c.customer_id = ? AND c.cart_status = 'ACTIVE'`,
      [cartItemId, customerId]
    );

    if (rows.length === 0) {
      const err = new Error('Cart item not found.');
      err.code = 'NOT_FOUND';
      throw err;
    }

    await conn.query(
      `UPDATE CART_ITEM SET quantity = ? WHERE cart_item_id = ?`,
      [parsedQty, cartItemId]
    );

    // Touch cart updated_at
    await conn.query(`UPDATE CART SET updated_at = NOW() WHERE cart_id = ?`, [rows[0].cart_id]);

    return {
      cartItemId: parseInt(cartItemId, 10),
      quantity: parsedQty,
    };
  } finally {
    conn.release();
  }
}

/**
 * Removes a line item from the customer's active cart.
 * @param {number} customerId
 * @param {number} cartItemId
 * @returns {Promise<boolean>}
 */
async function removeItem(customerId, cartItemId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT ci.cart_item_id, ci.cart_id
       FROM CART_ITEM ci
       JOIN CART c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = ? AND c.customer_id = ? AND c.cart_status = 'ACTIVE'`,
      [cartItemId, customerId]
    );

    if (rows.length === 0) {
      const err = new Error('Cart item not found.');
      err.code = 'NOT_FOUND';
      throw err;
    }

    await conn.query(`DELETE FROM CART_ITEM WHERE cart_item_id = ?`, [cartItemId]);

    // Touch cart updated_at
    await conn.query(`UPDATE CART SET updated_at = NOW() WHERE cart_id = ?`, [rows[0].cart_id]);

    return true;
  } finally {
    conn.release();
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};
