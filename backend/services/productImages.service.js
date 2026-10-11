'use strict';

const pool = require('../config/db');

const fail = (status, code, message) =>
    Object.assign(new Error(message), { status, code });

async function listImages(conn, productId) {
    const [rows] = await conn.query(
        `SELECT
            image_id AS imageId,
            file_path AS filePath,
            sort_order AS sortOrder
         FROM PRODUCT_IMAGE
         WHERE product_id = ?
           AND deleted_at IS NULL
         ORDER BY sort_order, image_id`,
        [productId]
    );

    return rows.map(({ imageId, filePath }) => ({
        imageId,
        url: filePath || `/api/v1/product-images/${imageId}`
    }));
}

function detectImage(buffer) {
    if (
        !Buffer.isBuffer(buffer) ||
        buffer.length < 12 ||
        buffer.length > 2 * 1024 * 1024
    ) {
        throw fail(
            400,
            'INVALID_IMAGE',
            'Choose a PNG, JPEG or WebP picture up to 2 MB.'
        );
    }

    if (
        buffer.subarray(0, 8).equals(
            Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        )
    ) {
        return 'image/png';
    }

    if (
        buffer[0] === 255 &&
        buffer[1] === 216 &&
        buffer[2] === 255
    ) {
        return 'image/jpeg';
    }

    if (
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return 'image/webp';
    }

    throw fail(
        400,
        'INVALID_IMAGE',
        'Only PNG, JPEG and WebP pictures are supported.'
    );
}

async function changeImages(productId, operation) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [p] = await conn.query(
            'SELECT product_id FROM PRODUCT WHERE product_id = ? FOR UPDATE',
            [productId]
        );

        if (!p.length) {
            throw fail(404, 'NOT_FOUND', 'Product not found.');
        }

        await operation(conn);

        const images = await listImages(conn, productId);

        await conn.commit();

        return images;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

async function addImage(productId, buffer) {
    const mime = detectImage(buffer);

    return changeImages(productId, async conn => {
        const images = await listImages(conn, productId);

        if (images.length >= 8) {
            throw fail(
                400,
                'IMAGE_LIMIT',
                'A product can have up to 8 pictures. Remove one first.'
            );
        }

        await conn.query(
            'INSERT INTO PRODUCT_IMAGE(product_id, mime_type, image_data, sort_order) VALUES(?, ?, ?, 1000000)',
            [productId, mime, buffer]
        );
    });
}

async function removeImage(productId, imageId) {
    return changeImages(productId, async conn => {
        const [r] = await conn.query(
            'UPDATE PRODUCT_IMAGE SET deleted_at = CURRENT_TIMESTAMP, image_data = NULL WHERE image_id = ? AND product_id = ? AND deleted_at IS NULL',
            [imageId, productId]
        );

        if (!r.affectedRows) {
            throw fail(404, 'NOT_FOUND', 'Picture not found.');
        }
    });
}

async function setCover(productId, imageId) {
    return changeImages(productId, async conn => {
        const images = await listImages(conn, productId);

        if (!images.some(i => i.imageId === Number(imageId))) {
            throw fail(404, 'NOT_FOUND', 'Picture not found.');
        }

        await conn.query(
            'UPDATE PRODUCT_IMAGE SET sort_order = image_id WHERE product_id = ? AND deleted_at IS NULL',
            [productId]
        );

        await conn.query(
            'UPDATE PRODUCT_IMAGE SET sort_order = 0 WHERE image_id = ? AND product_id = ?',
            [imageId, productId]
        );
    });
}

async function readImage(imageId) {
    const [rows] = await pool.query(
        'SELECT mime_type, image_data FROM PRODUCT_IMAGE WHERE image_id = ? AND deleted_at IS NULL AND image_data IS NOT NULL',
        [imageId]
    );

    return rows[0] || null;
}

module.exports = {
    listImages,
    detectImage,
    addImage,
    removeImage,
    setCover,
    readImage
};