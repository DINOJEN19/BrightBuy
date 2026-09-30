// services/catalogue.service.js
'use strict';

const pool = require('../config/db');

async function getCategories() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      'SELECT category_id AS categoryId, category_name AS categoryName, description FROM CATEGORY ORDER BY category_name'
    );
    return rows;
  } finally {
    conn.release();
  }
}

async function getProducts({ category, q, page = 1, pageSize = 20 }) {
  const conn = await pool.getConnection();
  try {
    let baseQuery = `
      SELECT p.product_id, p.product_name, p.brand, p.description
      FROM PRODUCT p
      WHERE p.status = 'ACTIVE'
    `;
    const queryParams = [];

    if (category) {
      baseQuery += ` AND p.product_id IN (SELECT pc.product_id FROM PRODUCT_CATEGORY pc WHERE pc.category_id = ?)`;
      queryParams.push(category);
    }
    
    if (q) {
      baseQuery += ` AND p.product_name LIKE ?`;
      queryParams.push(`%${q}%`);
    }

    const [countRows] = await conn.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`,
      queryParams
    );
    const total = countRows[0].total;

    const offset = (page - 1) * pageSize;
    baseQuery += ` ORDER BY p.product_name LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(pageSize, 10), parseInt(offset, 10));

    const [products] = await conn.query(baseQuery, queryParams);

    // Fetch categories for these products
    for (let product of products) {
      const [catRows] = await conn.query(
        `SELECT c.category_id AS categoryId, c.category_name AS categoryName
         FROM CATEGORY c
         JOIN PRODUCT_CATEGORY pc ON c.category_id = pc.category_id
         WHERE pc.product_id = ?`,
        [product.product_id]
      );
      product.categories = catRows;
    }

    return {
      products: products.map(p => ({
        productId: p.product_id,
        productName: p.product_name,
        brand: p.brand,
        categories: p.categories
      })),
      meta: { page: parseInt(page, 10), pageSize: parseInt(pageSize, 10), total }
    };
  } finally {
    conn.release();
  }
}

async function getProduct(productId) {
  const conn = await pool.getConnection();
  try {
    const [prodRows] = await conn.query(
      `SELECT product_id AS productId, product_name AS productName, description, brand
       FROM PRODUCT WHERE product_id = ? AND status = 'ACTIVE'`,
      [productId]
    );

    if (prodRows.length === 0) {
      return null;
    }

    const product = prodRows[0];

    const [varRows] = await conn.query(
      `SELECT variant_id AS variantId, sku, variant_name AS variantName, colour, memory_size AS memorySize, price, stock_quantity AS inStock
       FROM VARIANT WHERE product_id = ? AND status = 'ACTIVE'`,
      [productId]
    );

    product.variants = varRows.map(v => ({
      ...v,
      price: parseFloat(v.price)
    }));

    return product;
  } finally {
    conn.release();
  }
}

async function getVariant(variantId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT variant_id AS variantId, sku, price, stock_quantity AS stockQuantity, stock_quantity AS inStock
       FROM VARIANT WHERE variant_id = ? AND status = 'ACTIVE'`,
      [variantId]
    );

    if (rows.length === 0) {
      return null;
    }
    const variant = rows[0];
    variant.price = parseFloat(variant.price);
    return variant;
  } finally {
    conn.release();
  }
}

module.exports = {
  getCategories,
  getProducts,
  getProduct,
  getVariant
};
