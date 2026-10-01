// services/orders.service.js
// Business & database access layer for customer order history, delivery and payment lookups.
// Owned by Person 4.
//
// NOTE: table/column names below follow TASK.md. Verify them against the real
// database schema SQL file and adjust if any name differs.

'use strict';

const pool = require('../config/db');

/**
 * Loads an order's owner and throws if the order is missing or not owned by the caller.
 * Ownership is checked here in JavaScript against req.user.customerId (never trust the URL alone).
 * @throws NOT_FOUND  - order does not exist
 * @throws FORBIDDEN  - order belongs to another customer
 */
async function assertOwnsOrder(conn, customerId, orderId) {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    const err = new Error('Order not found.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const [rows] = await conn.query(
    `SELECT order_id, customer_id FROM CUSTOMER_ORDER WHERE order_id = ?`,
    [orderId]
  );

  if (rows.length === 0) {
    const err = new Error('Order not found.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (rows[0].customer_id !== customerId) {
    const err = new Error('This order does not belong to you.');
    err.code = 'FORBIDDEN';
    throw err;
  }
}

/**
 * Lists the logged-in customer's own orders (paginated).
 * @param {number} customerId
 * @param {{ page: number, pageSize: number }} paging
 * @returns {Promise<{ orders: Array, meta: { page, pageSize, total } }>}
 */
async function getOrders(customerId, { page, pageSize }) {
  const conn = await pool.getConnection();
  try {
    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS total FROM CUSTOMER_ORDER WHERE customer_id = ?`,
      [customerId]
    );
    const total = countRows[0].total;

    const offset = (page - 1) * pageSize;
    const [rows] = await conn.query(
      `SELECT
         o.order_id AS orderId,
         o.order_date AS orderDate,
         o.order_status AS orderStatus,
         o.total_amount AS totalAmount,
         d.delivery_mode AS deliveryMode,
         p.payment_status AS paymentStatus
       FROM CUSTOMER_ORDER o
       LEFT JOIN PAYMENT p ON p.order_id = o.order_id
       LEFT JOIN DELIVERY d ON d.order_id = o.order_id
       WHERE o.customer_id = ?
       ORDER BY o.order_date DESC, o.order_id DESC
       LIMIT ? OFFSET ?`,
      [customerId, pageSize, offset]
    );

    const orders = rows.map((r) => ({
      ...r,
      totalAmount: parseFloat(r.totalAmount),
    }));

    return { orders, meta: { page, pageSize, total } };
  } finally {
    conn.release();
  }
}

/**
 * Full order detail: line items, delivery and payment.
 * @returns {Promise<{ orderId, items: Array, delivery: object|null, payment: object|null }>}
 */
async function getOrderById(customerId, orderId) {
  const conn = await pool.getConnection();
  try {
    await assertOwnsOrder(conn, customerId, orderId);

    const [itemRows] = await conn.query(
      `SELECT
         oi.variant_id AS variantId,
         v.variant_name AS variantName,
         oi.quantity AS quantity,
         oi.unit_price AS unitPrice,
         oi.subtotal AS subtotal
       FROM ORDER_ITEM oi
       JOIN VARIANT v ON v.variant_id = oi.variant_id
       WHERE oi.order_id = ?
       ORDER BY oi.variant_id ASC`,
      [orderId]
    );

    const items = itemRows.map((r) => ({
      variantId: r.variantId,
      variantName: r.variantName,
      quantity: parseInt(r.quantity, 10),
      unitPrice: parseFloat(r.unitPrice),
      subtotal: parseFloat(r.subtotal),
    }));

    const [deliveryRows] = await conn.query(
      `SELECT
         delivery_mode AS deliveryMode,
         destination_city AS destinationCity,
         delivery_status AS deliveryStatus,
         estimated_delivery_date AS estimatedDeliveryDate,
         actual_delivery_date AS actualDeliveryDate
       FROM DELIVERY
       WHERE order_id = ?`,
      [orderId]
    );

    const [paymentRows] = await conn.query(
      `SELECT
         payment_method AS paymentMethod,
         payment_status AS paymentStatus,
         amount,
         payment_date AS paymentDate
       FROM PAYMENT
       WHERE order_id = ?`,
      [orderId]
    );

    const payment = paymentRows[0] || null;
    if (payment) payment.amount = parseFloat(payment.amount);

    return {
      orderId,
      items,
      delivery: deliveryRows[0] || null,
      payment,
    };
  } finally {
    conn.release();
  }
}

/**
 * Delivery mode, destination, status and dates for one order.
 */
async function getDelivery(customerId, orderId) {
  const conn = await pool.getConnection();
  try {
    await assertOwnsOrder(conn, customerId, orderId);

    const [rows] = await conn.query(
      `SELECT
         delivery_mode AS deliveryMode,
         destination_city AS destinationCity,
         delivery_status AS deliveryStatus,
         estimated_delivery_date AS estimatedDeliveryDate,
         actual_delivery_date AS actualDeliveryDate
       FROM DELIVERY
       WHERE order_id = ?`,
      [orderId]
    );

    if (rows.length === 0) {
      const err = new Error('Delivery information not found.');
      err.code = 'NOT_FOUND';
      throw err;
    }

    return rows[0];
  } finally {
    conn.release();
  }
}

/**
 * Payment method and status for one order.
 */
async function getPayment(customerId, orderId) {
  const conn = await pool.getConnection();
  try {
    await assertOwnsOrder(conn, customerId, orderId);

    const [rows] = await conn.query(
      `SELECT
         payment_method AS paymentMethod,
         payment_status AS paymentStatus,
         amount,
         payment_date AS paymentDate
       FROM PAYMENT
       WHERE order_id = ?`,
      [orderId]
    );

    if (rows.length === 0) {
      const err = new Error('Payment information not found.');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const payment = rows[0];
    payment.amount = parseFloat(payment.amount);
    return payment;
  } finally {
    conn.release();
  }
}

module.exports = {
  getOrders,
  getOrderById,
  getDelivery,
  getPayment,
};
