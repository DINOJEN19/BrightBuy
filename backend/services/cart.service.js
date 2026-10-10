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


function failure(code, message) { const error = new Error(message); error.code = code; return error; }
function validQuantity(value) {
  if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 2147483647)
    throw failure('INVALID_QUANTITY', 'Quantity must be a positive integer.');
  return Number(value);
}
// All cart mutations and sp_PlaceOrder acquire the same customer lock first.
// This serializes requests from multiple tabs before any cart rows are read.
async function mutate(customerId, operation) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SELECT customer_id FROM CUSTOMER WHERE customer_id = ? FOR UPDATE', [customerId]);
    const result = await operation(conn);
    await conn.commit();
    return result;
  } catch (error) { await conn.rollback(); throw error; }
  finally {conn.release();}
}
async function addItem(customerId, {variantId, quantity}) {
  const qty = validQuantity(quantity);
  return mutate(customerId, async conn => {
    const [variants] = await conn.query(`SELECT v.variant_id, v.stock_quantity FROM VARIANT v
      JOIN PRODUCT p ON p.product_id=v.product_id
      WHERE v.variant_id=? AND v.status='ACTIVE' AND p.status='ACTIVE'`, [variantId]);
    if (!variants.length) throw failure('NOT_FOUND','Variant not found.');
    const [carts] = await conn.query("SELECT cart_id FROM CART WHERE customer_id=? AND cart_status='ACTIVE' ORDER BY cart_id DESC LIMIT 1 FOR UPDATE", [customerId]);
    let cartId = carts[0]?.cart_id;
    if (!cartId) {
      const [cart] = await conn.query("INSERT INTO CART (customer_id,cart_status) VALUES (?,'ACTIVE')", [customerId]);
      cartId=cart.insertId;
    }
    const [items] = await conn.query('SELECT cart_item_id, quantity FROM CART_ITEM WHERE cart_id=? AND variant_id=? FOR UPDATE', [cartId,variantId]);
    const newQuantity = qty + Number(items[0]?.quantity || 0);
    if(newQuantity > variants[0].stock_quantity) throw failure('VALIDATION_ERROR','Requested quantity exceeds available stock.');
    let cartItemId=items[0]?.cart_item_id;
    if(cartItemId) await conn.query('UPDATE CART_ITEM SET quantity=? WHERE cart_item_id=?',[newQuantity,cartItemId]);
    else {const [item]=await conn.query('INSERT INTO CART_ITEM (cart_id,variant_id,quantity) VALUES (?,?,?)',[cartId,variantId,newQuantity]); cartItemId=item.insertId;}
    await conn.query('UPDATE CART SET updated_at=NOW() WHERE cart_id=?',[cartId]);
    return {cartItemId};
  });
}
async function findOwnedItem(conn, customerId, cartItemId) {
  const [rows]=await conn.query(`SELECT ci.cart_item_id, ci.cart_id, ci.variant_id FROM CART_ITEM ci
    JOIN CART c ON c.cart_id=ci.cart_id
    WHERE ci.cart_item_id=? AND c.customer_id=? AND c.cart_status='ACTIVE' FOR UPDATE`,[cartItemId,customerId]);
  if(!rows.length) throw failure('NOT_FOUND','Cart item not found.');
  return rows[0];
}
async function updateItem(customerId, cartItemId, {quantity}) {
  const qty=validQuantity(quantity);
  return mutate(customerId,async conn=>{
    const item=await findOwnedItem(conn,customerId,cartItemId);
    const [variants]=await conn.query("SELECT stock_quantity FROM VARIANT WHERE variant_id=? AND status='ACTIVE'",[item.variant_id]);
    if(!variants.length || qty>variants[0].stock_quantity) throw failure('VALIDATION_ERROR','Requested quantity exceeds available stock.');
    await conn.query('UPDATE CART_ITEM SET quantity=? WHERE cart_item_id=?',[qty,cartItemId]);
    await conn.query('UPDATE CART SET updated_at=NOW() WHERE cart_id=?',[item.cart_id]);
    return {cartItemId:Number(cartItemId),quantity:qty};
  });
}
async function removeItem(customerId, cartItemId) {
  return mutate(customerId,async conn=>{
    const item=await findOwnedItem(conn,customerId,cartItemId);
    await conn.query('DELETE FROM CART_ITEM WHERE cart_item_id=?',[cartItemId]);
    await conn.query('UPDATE CART SET updated_at=NOW() WHERE cart_id=?',[item.cart_id]);
    return true;
  });
}
module.exports = {getCart,addItem,updateItem,removeItem};
