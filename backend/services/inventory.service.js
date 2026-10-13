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
    const finalReason = (reason && reason.trim()) ? reason.trim() : (adjustmentType === 'RESTOCK' ? 'Standard restock' : null);
    const [insertResult] = await conn.query(
      `INSERT INTO STOCK_ADJUSTMENT (variant_id, adjustment_type, quantity_change, reason)
       VALUES (?, ?, ?, ?)`,
      [variantId, adjustmentType, quantityChange, finalReason]
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

/**
 * Retrieves recent stock adjustments with variant and product details.
 * @param {number} [limit=20]
 * @returns {Promise<Array>}
 */
async function listRecentAdjustments(limit = 20) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const [rows] = await pool.query(
    `SELECT
       sa.adjustment_id AS adjustmentId,
       sa.variant_id AS variantId,
       v.sku,
       v.variant_name AS variantName,
       p.product_id AS productId,
       p.product_name AS productName,
       sa.adjustment_type AS adjustmentType,
       sa.quantity_change AS quantityChange,
       sa.reason,
       sa.adjustment_date AS adjustmentDate
     FROM STOCK_ADJUSTMENT sa
     LEFT JOIN VARIANT v ON v.variant_id = sa.variant_id
     LEFT JOIN PRODUCT p ON p.product_id = v.product_id
     ORDER BY sa.adjustment_id DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
}

/**
 * Searches product variants by SKU, variant name, product name, or variant ID.
 * @param {string} [query='']
 * @param {number} [limit=30]
 * @returns {Promise<Array>}
 */
async function searchVariants(query = '', limit = 30) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
  const q = String(query || '').trim();
  let sql = `
    SELECT
      v.variant_id AS variantId,
      v.sku,
      v.variant_name AS variantName,
      v.stock_quantity AS stockQuantity,
      v.price,
      p.product_id AS productId,
      p.product_name AS productName
    FROM VARIANT v
    JOIN PRODUCT p ON p.product_id = v.product_id
    WHERE v.status = 'ACTIVE'
  `;
  const params = [];
  if (q) {
    sql += ` AND (v.sku LIKE ? OR v.variant_name LIKE ? OR p.product_name LIKE ? OR CAST(v.variant_id AS CHAR) = ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, q);
  }
  sql += ` ORDER BY p.product_name, v.variant_name LIMIT ?`;
  params.push(safeLimit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { adjustStock, listRecentAdjustments, searchVariants };

