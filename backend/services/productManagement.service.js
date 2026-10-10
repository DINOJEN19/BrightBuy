'use strict';

const pool = require('../config/db');
const { listImages } = require('./productImages.service');

const fail = (status, code, message) =>
    Object.assign(new Error(message), { status, code });

async function listProducts({ q = '', page = 1, pageSize = 20 }) {
    const conn = await pool.getConnection();

    try {
        const search = `%${q}%`;

        const [[{ total }]] = await conn.query(
            'SELECT COUNT(*) AS total FROM PRODUCT WHERE product_name LIKE ?',
            [search]
        );

        const [rows] = await conn.query(
            `SELECT
                p.product_id AS productId,
                p.product_name AS productName,
                p.brand,
                p.status,
                COALESCE(SUM(v.stock_quantity), 0) AS stockQuantity,
                COUNT(v.variant_id) AS variantCount
             FROM PRODUCT p
             LEFT JOIN VARIANT v ON v.product_id = p.product_id
             WHERE p.product_name LIKE ?
             GROUP BY
                p.product_id,
                p.product_name,
                p.brand,
                p.status
             ORDER BY p.product_name
             LIMIT ? OFFSET ?`,
            [search, pageSize, (page - 1) * pageSize]
        );

        for (const p of rows) {
            p.images = await listImages(conn, p.productId);
        }

        return {
            products: rows,
            meta: { page, pageSize, total }
        };
    } finally {
        conn.release();
    }
}

async function getProduct(productId) {
    const conn = await pool.getConnection();

    try {
        const [rows] = await conn.query(
            'SELECT product_id AS productId, product_name AS productName, description, brand, status FROM PRODUCT WHERE product_id = ?',
            [productId]
        );

        if (!rows.length) {
            throw fail(404, 'NOT_FOUND', 'Product not found.');
        }

        const p = rows[0];

        const [variants] = await conn.query(
            'SELECT variant_id AS variantId, sku, variant_name AS variantName, colour, memory_size AS memorySize, price, stock_quantity AS stockQuantity, status FROM VARIANT WHERE product_id = ? ORDER BY variant_id',
            [productId]
        );

        const [categories] = await conn.query(
            'SELECT category_id AS categoryId FROM PRODUCT_CATEGORY WHERE product_id = ?',
            [productId]
        );

        p.variants = variants.map(v => ({
            ...v,
            price: Number(v.price)
        }));

        p.categoryIds = categories.map(c => c.categoryId);
        p.images = await listImages(conn, productId);

        const [history] = await conn.query(
            `SELECT
                sa.adjustment_id AS adjustmentId,
                sa.variant_id AS variantId,
                v.sku,
                sa.adjustment_type AS adjustmentType,
                sa.quantity_change AS quantityChange,
                sa.reason,
                sa.adjustment_date AS adjustmentDate
             FROM STOCK_ADJUSTMENT sa
             JOIN VARIANT v ON v.variant_id = sa.variant_id
             WHERE v.product_id = ?
             ORDER BY sa.adjustment_id DESC
             LIMIT 20`,
            [productId]
        );

        p.stockHistory = history;

        return p;
    } finally {
        conn.release();
    }
}

async function updateProduct(
    productId,
    { productName, description, brand, status, categoryIds }
) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
            'SELECT product_id FROM PRODUCT WHERE product_id = ? FOR UPDATE',
            [productId]
        );

        if (!rows.length) {
            throw fail(404, 'NOT_FOUND', 'Product not found.');
        }

        const [categories] = await conn.query(
            'SELECT category_id FROM CATEGORY WHERE category_id IN (?)',
            [categoryIds]
        );

        if (categories.length !== categoryIds.length) {
            throw fail(
                400,
                'VALIDATION_ERROR',
                'Choose existing categories.'
            );
        }

        await conn.query(
            'UPDATE PRODUCT SET product_name = ?, description = ?, brand = ?, status = ? WHERE product_id = ?',
            [
                productName,
                description || null,
                brand || null,
                status,
                productId
            ]
        );

        await conn.query(
            'DELETE FROM PRODUCT_CATEGORY WHERE product_id = ?',
            [productId]
        );

        for (const categoryId of categoryIds) {
            await conn.query(
                'INSERT INTO PRODUCT_CATEGORY(product_id, category_id) VALUES(?, ?)',
                [productId, categoryId]
            );
        }

        await conn.commit();

        return { productId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

async function setStock(
    variantId,
    { stockQuantity, expectedStockQuantity, reason }
) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
            'SELECT stock_quantity FROM VARIANT WHERE variant_id = ? FOR UPDATE',
            [variantId]
        );

        if (!rows.length) {
            throw fail(404, 'NOT_FOUND', 'Variant not found.');
        }

        const previous = Number(rows[0].stock_quantity);

        if (previous !== expectedStockQuantity) {
            throw fail(
                409,
                'STOCK_CHANGED',
                'Stock changed since this page loaded. Reload the product before saving again.'
            );
        }

        const difference = stockQuantity - previous;

        if (difference) {
            await conn.query(
                'UPDATE VARIANT SET stock_quantity = ? WHERE variant_id = ?',
                [stockQuantity, variantId]
            );

            await conn.query(
                "INSERT INTO STOCK_ADJUSTMENT(variant_id, adjustment_type, quantity_change, reason) VALUES(?, 'CORRECTION', ?, ?)",
                [variantId, difference, reason]
            );
        }

        await conn.commit();

        return {
            variantId,
            stockQuantity,
            quantityChange: difference
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

module.exports = {
    listProducts,
    getProduct,
    updateProduct,
    setStock
};