// services/inventory.service.js
// Business & database access layer for staff stock adjustments.
// Owned by Person 4.
//
// IMPORTANT: no stock arithmetic is validated here. The database trigger
// trg_prevent_negative_stock rejects any change that would take stock below zero
// (SQLSTATE 45000), and errorHandler maps that to HTTP 422.
//
// NOTE: table/column names follow TASK.md. Verify against the real schema SQL file.

'use strict';

const pool = require('../config/db');

/**
 * Adjusts a variant's stock and records the adjustment, atomically.
 * @param {{ variantId: number, adjustmentType: 'RESTOCK'|'CORRECTION'|'DAMAGE', quantityChange: number, reason: string }} data
 * @returns {Promise<{ adjustmentId: number, newStockQuantity: number }>}
 * @throws NOT_FOUND if the variant does not exist.
 */
async function adjustStock({ variantId, adjustmentType, quantityChange, reason }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Apply the change. If trg_prevent_negative_stock fires, this throws (sqlState 45000).
    const [updateResult] = await conn.query(
      `UPDATE VARIANT SET stock_quantity = stock_quantity + ? WHERE variant_id = ?`,
      [quantityChange, variantId]
    );

    if (updateResult.affectedRows === 0) {
      const err = new Error('Variant not found.');
      err.code = 'NOT_FOUND';
      throw err;
    }

    // 2. Record the adjustment
    const [insertResult] = await conn.query(
      `INSERT INTO STOCK_ADJUSTMENT (variant_id, adjustment_type, quantity_change, reason)
       VALUES (?, ?, ?, ?)`,
      [variantId, adjustmentType, quantityChange, reason]
    );

    // 3. Read back the new stock level
    const [stockRows] = await conn.query(
      `SELECT stock_quantity FROM VARIANT WHERE variant_id = ?`,
      [variantId]
    );

    await conn.commit();

    return {
      adjustmentId: insertResult.insertId,
      newStockQuantity: stockRows[0].stock_quantity,
    };
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      console.error('[inventory.service] rollback failed:', rollbackErr);
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { adjustStock };
