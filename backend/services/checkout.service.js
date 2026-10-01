// services/checkout.service.js
// Orchestrates checkout by delegating the atomic transaction to sp_PlaceOrder.
// Owned by Person 3.

'use strict';

const pool = require('../config/db');

/**
 * Validates basic card format.
 * @param {object} card
 * @returns {boolean}
 */
function isValidCardDetails(card) {
  if (!card || typeof card !== 'object') return false;

  // Card number: 13 to 19 digits (strip spaces and hyphens)
  const cardNumber = String(card.cardNumber || '').replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(cardNumber)) return false;

  // CVV: 3 or 4 digits
  const cvv = String(card.cvv || card.cvc || '').trim();
  if (!/^\d{3,4}$/.test(cvv)) return false;

  // Expiry date format check (MM/YY, MM/YYYY, or separate expiryMonth / expiryYear)
  if (card.expiryDate) {
    const trimmed = String(card.expiryDate).trim();
    if (!/^(0[1-9]|1[0-2])\/?(20\d{2}|\d{2})$/.test(trimmed)) {
      return false;
    }
  } else if (card.expiryMonth !== undefined && card.expiryYear !== undefined) {
    const month = parseInt(card.expiryMonth, 10);
    const year = parseInt(card.expiryYear, 10);
    if (isNaN(month) || month < 1 || month > 12) return false;
    if (isNaN(year) || year < 2024 || year > 2100) return false;
  } else {
    return false;
  }

  return true;
}

/**
 * Places an order for the authenticated customer using sp_PlaceOrder.
 * Performs zero stock arithmetic itself.
 *
 * @param {number} customerId
 * @param {object} checkoutData
 * @param {'STORE_PICKUP'|'STANDARD_DELIVERY'} checkoutData.deliveryMode
 * @param {string} [checkoutData.deliveryAddress]
 * @param {string} checkoutData.destinationCity
 * @param {'CASH_ON_DELIVERY'|'CARD_PAYMENT'} checkoutData.paymentMethod
 * @param {object} [checkoutData.cardDetails]
 * @param {number} [checkoutData.cartId]
 * @returns {Promise<{ orderId: number, estimatedDeliveryDate: string, orderStatus: string }>}
 */
async function placeOrder(customerId, {
  deliveryMode,
  deliveryAddress,
  destinationCity,
  paymentMethod,
  cardDetails,
  cartId: requestedCartId,
}) {
  // 1. Basic validation of required fields
  if (!deliveryMode || !['STORE_PICKUP', 'STANDARD_DELIVERY'].includes(deliveryMode)) {
    const err = new Error("deliveryMode must be either 'STORE_PICKUP' or 'STANDARD_DELIVERY'.");
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (!destinationCity || typeof destinationCity !== 'string' || !destinationCity.trim()) {
    const err = new Error('destinationCity is required.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (!paymentMethod || !['CASH_ON_DELIVERY', 'CARD_PAYMENT'].includes(paymentMethod)) {
    const err = new Error("paymentMethod must be either 'CASH_ON_DELIVERY' or 'CARD_PAYMENT'.");
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // 2. Format validation for card payments before invoking the stored procedure
  if (paymentMethod === 'CARD_PAYMENT') {
    if (!isValidCardDetails(cardDetails)) {
      const err = new Error('Card details failed basic format validation.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  }

  const conn = await pool.getConnection();
  try {
    // 3. Resolve active cart for the customer
    let cartId = requestedCartId;
    if (!cartId) {
      const [cartRows] = await conn.query(
        `SELECT cart_id
         FROM CART
         WHERE customer_id = ? AND cart_status = 'ACTIVE'
         ORDER BY cart_id DESC
         LIMIT 1`,
        [customerId]
      );
      // If customer has no active cart, pass 0 so sp_PlaceOrder can SIGNAL its business rule
      cartId = cartRows.length > 0 ? cartRows[0].cart_id : 0;
    }

    const cleanAddress = deliveryAddress && typeof deliveryAddress === 'string' ? deliveryAddress.trim() : null;
    const cleanCity = destinationCity.trim();

    // 4. Call sp_PlaceOrder atomic transaction
    await conn.query(
      `CALL sp_PlaceOrder(?, ?, ?, ?, ?, ?, @p_order_id, @p_estimated_delivery_date)`,
      [
        customerId,
        cartId,
        deliveryMode,
        cleanAddress,
        cleanCity,
        paymentMethod,
      ]
    );

    // 5. Retrieve output variables from procedure execution
    const [outRows] = await conn.query(
      `SELECT @p_order_id AS orderId, @p_estimated_delivery_date AS estimatedDeliveryDate`
    );

    const result = outRows[0];
    let estimatedDeliveryDate = result.estimatedDeliveryDate;
    if (estimatedDeliveryDate instanceof Date) {
      estimatedDeliveryDate = estimatedDeliveryDate.toISOString().slice(0, 10);
    } else if (typeof estimatedDeliveryDate === 'string') {
      estimatedDeliveryDate = estimatedDeliveryDate.slice(0, 10);
    }

    return {
      orderId: result.orderId,
      estimatedDeliveryDate,
      orderStatus: 'CONFIRMED',
    };
  } finally {
    conn.release();
  }
}

module.exports = {
  isValidCardDetails,
  placeOrder,
};
