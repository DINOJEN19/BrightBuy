// services/admin.service.js
// Business & database access layer for Person 5 catalogue administration.
// Owned by Person 5.

'use strict';

const pool = require('../config/db');

/**
 * Creates a new category.
 *
 * @param {{ categoryName: string, description?: string }} data
 * @returns {Promise<{ categoryId: number }>}
 * @throws 400 VALIDATION_ERROR if name is missing or invalid
 * @throws 409 CATEGORY_EXISTS if category name is already taken
 */
async function createCategory({ categoryName, description }) {
  if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
    const err = new Error('Category name is required.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const cleanName = categoryName.trim();
  if (cleanName.length > 60) {
    const err = new Error('Category name cannot exceed 60 characters.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const cleanDesc = description && typeof description === 'string' ? description.trim() : null;

  const conn = await pool.getConnection();
  try {
    // Check if category already exists
    const [existing] = await conn.query(
      `SELECT category_id FROM CATEGORY WHERE category_name = ?`,
      [cleanName]
    );

    if (existing.length > 0) {
      const err = new Error('A category with this name already exists.');
      err.code = 'CATEGORY_EXISTS';
      throw err;
    }

    const [insertResult] = await conn.query(
      `INSERT INTO CATEGORY (category_name, description) VALUES (?, ?)`,
      [cleanName, cleanDesc]
    );

    return { categoryId: insertResult.insertId };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const dupErr = new Error('A category with this name already exists.');
      dupErr.code = 'CATEGORY_EXISTS';
      throw dupErr;
    }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Creates a new product with category relationships and initial variant(s) in a single transaction.
 *
 * @param {object} productData
 * @param {string} productData.productName
 * @param {string} [productData.description]
 * @param {string} [productData.brand]
 * @param {number[]} productData.categoryIds
 * @param {Array<{ sku: string, variantName: string, colour?: string, memorySize?: string, price: number, stockQuantity?: number }>} productData.variants
 * @returns {Promise<{ productId: number, variantIds: number[] }>}
 * @throws 400 VALIDATION_ERROR if required fields, categories or variants are missing
 * @throws 409 SKU_TAKEN if any variant SKU is already in use
 */
async function createProduct({ productName, description, brand, categoryIds, variants }) {
  // 1. Validation
  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    const err = new Error('Product name is required.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (!Array.isArray(categoryIds) || categoryIds.length === 0 || !Array.isArray(variants) || variants.length === 0) {
    const err = new Error('Every product requires at least one category and one variant.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Validate variant shapes
  const cleanSkus = [];
  for (const v of variants) {
    if (!v || typeof v !== 'object') {
      const err = new Error('Invalid variant details provided.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const sku = String(v.sku || '').trim();
    const variantName = String(v.variantName || '').trim();
    const price = parseFloat(v.price);
    const stockQuantity = v.stockQuantity !== undefined ? parseInt(v.stockQuantity, 10) : 0;

    if (!sku) {
      const err = new Error('Every variant requires an SKU.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (!variantName) {
      const err = new Error('Every variant requires a variant name.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (isNaN(price) || price <= 0) {
      const err = new Error('Variant price must be greater than zero.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (isNaN(stockQuantity) || stockQuantity < 0) {
      const err = new Error('Variant stock quantity cannot be negative.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    cleanSkus.push(sku);
  }

  // Check for duplicate SKUs within request payload
  if (new Set(cleanSkus).size !== cleanSkus.length) {
    const err = new Error('This SKU is already in use.');
    err.code = 'SKU_TAKEN';
    throw err;
  }

  const cleanProdName = productName.trim();
  const cleanDesc = description && typeof description === 'string' ? description.trim() : null;
  const cleanBrand = brand && typeof brand === 'string' ? brand.trim() : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 2. Check if any SKU already exists in database
    const [skuRows] = await conn.query(
      `SELECT sku FROM VARIANT WHERE sku IN (?)`,
      [cleanSkus]
    );

    if (skuRows.length > 0) {
      const err = new Error('This SKU is already in use.');
      err.code = 'SKU_TAKEN';
      throw err;
    }

    // 3. Insert Product
    const [prodResult] = await conn.query(
      `INSERT INTO PRODUCT (product_name, description, brand, status)
       VALUES (?, ?, ?, 'ACTIVE')`,
      [cleanProdName, cleanDesc, cleanBrand]
    );
    const productId = prodResult.insertId;

    // 4. Link Categories
    for (const catId of categoryIds) {
      await conn.query(
        `INSERT INTO PRODUCT_CATEGORY (product_id, category_id) VALUES (?, ?)`,
        [productId, parseInt(catId, 10)]
      );
    }

    // 5. Insert Variants
    const variantIds = [];
    for (const v of variants) {
      const sku = String(v.sku).trim();
      const variantName = String(v.variantName).trim();
      const colour = v.colour && typeof v.colour === 'string' ? v.colour.trim() : null;
      const memorySize = v.memorySize && typeof v.memorySize === 'string' ? v.memorySize.trim() : null;
      const price = parseFloat(v.price);
      const stockQuantity = v.stockQuantity !== undefined ? parseInt(v.stockQuantity, 10) : 0;

      const [varResult] = await conn.query(
        `INSERT INTO VARIANT (product_id, sku, variant_name, colour, memory_size, price, stock_quantity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [productId, sku, variantName, colour, memorySize, price, stockQuantity]
      );
      variantIds.push(varResult.insertId);
    }

    await conn.commit();
    return { productId, variantIds };
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rbErr) {
      console.error('[admin.service] rollback failed:', rbErr);
    }

    if (err.code === 'ER_DUP_ENTRY') {
      const takenErr = new Error('This SKU is already in use.');
      takenErr.code = 'SKU_TAKEN';
      throw takenErr;
    }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Updates a variant's price, name, or status.
 * Does NOT directly touch stock_quantity (stock adjustments belong to inventory).
 *
 * @param {number|string} variantId
 * @param {{ variantName?: string, price?: number|string, status?: 'ACTIVE'|'DISCONTINUED' }} updateFields
 * @returns {Promise<{ variantId: number, [key: string]: any }>}
 * @throws 404 NOT_FOUND if variant does not exist
 * @throws 400 VALIDATION_ERROR on invalid values
 */
async function updateVariant(variantId, { variantName, price, status }) {
  const vId = parseInt(variantId, 10);
  if (!Number.isInteger(vId) || vId <= 0) {
    const err = new Error('Variant not found.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const updates = [];
  const params = [];

  if (variantName !== undefined) {
    if (typeof variantName !== 'string' || !variantName.trim()) {
      const err = new Error('Variant name cannot be empty.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    updates.push('variant_name = ?');
    params.push(variantName.trim());
  }

  if (price !== undefined) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      const err = new Error('Price must be greater than zero.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    updates.push('price = ?');
    params.push(parsedPrice);
  }

  if (status !== undefined) {
    if (!['ACTIVE', 'DISCONTINUED'].includes(status)) {
      const err = new Error("Status must be either 'ACTIVE' or 'DISCONTINUED'.");
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    updates.push('status = ?');
    params.push(status);
  }

  const conn = await pool.getConnection();
  try {
    // Check variant exists first
    const [existing] = await conn.query(
      `SELECT variant_id, sku, variant_name, price, status, colour, memory_size, stock_quantity
       FROM VARIANT
       WHERE variant_id = ?`,
      [vId]
    );

    if (existing.length === 0) {
      const err = new Error('Variant not found.');
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (updates.length > 0) {
      params.push(vId);
      await conn.query(
        `UPDATE VARIANT SET ${updates.join(', ')} WHERE variant_id = ?`,
        params
      );
    }

    // Read back updated variant
    const [updated] = await conn.query(
      `SELECT
         variant_id AS variantId,
         sku,
         variant_name AS variantName,
         price,
         status,
         colour,
         memory_size AS memorySize
       FROM VARIANT
       WHERE variant_id = ?`,
      [vId]
    );

    const row = updated[0];
    return {
      variantId: row.variantId,
      sku: row.sku,
      variantName: row.variantName,
      price: parseFloat(row.price),
      status: row.status,
      colour: row.colour,
      memorySize: row.memorySize,
    };
  } finally {
    conn.release();
  }
}

module.exports = {
  createCategory,
  createProduct,
  updateVariant,
};
