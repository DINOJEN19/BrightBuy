'use strict';

// Runs against the configured real MySQL instance. Creates and cleans up its own fixtures.

require('dotenv').config({
    path: require('path').join(__dirname, '../.env')
});

process.env.JWT_SECRET ||= 'integration-test-only-local-secret';

const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../config/db');
const app = require('../app');

test(
    'Real MySQL: customer, checkout, concurrency, inventory, permissions and reports',
    async t => {
        await pool.query('SELECT 1');

        const server = app.listen(0, '127.0.0.1');

        await new Promise(resolve => server.once('listening', resolve));

        const base = `http://127.0.0.1:${server.address().port}/api/v1`;
        const stamp = `${Date.now()}`;

        const customerIds = [];
        let productId, categoryId;

        async function request(path, method = 'GET', body, token) {
            const res = await fetch(base + path, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token
                        ? { Authorization: `Bearer ${token}` }
                        : {})
                },
                body: body ? JSON.stringify(body) : undefined
            });

            return {
                status: res.status,
                body: res.status === 204 ? null : await res.json()
            };
        }

        t.after(async () => {
            try {
                for (const id of customerIds) {
                    await pool.query(
                        'DELETE FROM CUSTOMER_ORDER WHERE customer_id = ?',
                        [id]
                    );

                    await pool.query(
                        'DELETE FROM CART WHERE customer_id = ?',
                        [id]
                    );

                    await pool.query(
                        'DELETE FROM CUSTOMER WHERE customer_id = ?',
                        [id]
                    );
                }

                if (productId) {
                    await pool.query(
                        'DELETE sa FROM STOCK_ADJUSTMENT sa JOIN VARIANT v ON v.variant_id = sa.variant_id WHERE v.product_id = ?',
                        [productId]
                    );

                    await pool.query(
                        'DELETE FROM VARIANT WHERE product_id = ?',
                        [productId]
                    );

                    await pool.query(
                        'DELETE FROM PRODUCT_CATEGORY WHERE product_id = ?',
                        [productId]
                    );

                    await pool.query(
                        'DELETE FROM PRODUCT WHERE product_id = ?',
                        [productId]
                    );
                }

                if (categoryId) {
                    await pool.query(
                        'DELETE FROM CATEGORY WHERE category_id = ?',
                        [categoryId]
                    );
                }
            } finally {
                await new Promise(resolve => server.close(resolve));
                await pool.end();
            }
        });

        const admin = await request('/auth/login', 'POST', {
            email: 'admin@brightbuy.test',
            password: 'BrightBuy123!'
        });

        assert.equal(admin.status, 200, JSON.stringify(admin.body));

        const adminToken = admin.body.data.token;
        const tokens = [];

        for (let i = 0; i < 2; i++) {
            const email = `integration-${stamp}-${i}@example.com`;

            const registration = await request('/auth/register', 'POST', {
                email,
                password: 'TestPassword123!',
                fullName: 'Integration Customer'
            });

            assert.equal(
                registration.status,
                201,
                JSON.stringify(registration.body)
            );

            customerIds.push(registration.body.data.customerId);

            tokens.push(
                (
                    await request('/auth/login', 'POST', {
                        email,
                        password: 'TestPassword123!'
                    })
                ).body.data.token
            );
        }

        const token = tokens[0];

        await t.test('profile persists and restores role', async () => {
            const profile = await request(
                '/customers/me',
                'PUT',
                {
                    city: 'Austin',
                    address: '1 Test Road'
                },
                token
            );

            assert.equal(profile.status, 200);
            assert.equal(profile.body.data.city, 'Austin');
            assert.equal(profile.body.data.role, 'CUSTOMER');
        });

        categoryId = (
            await request(
                '/admin/categories',
                'POST',
                { categoryName: `Integration ${stamp}` },
                adminToken
            )
        ).body.data.categoryId;

        const product = await request('/admin/products', 'POST', {
            productName: `Integration ${stamp}`,
            brand: 'Test',
            categoryIds: [categoryId],
            variants: [
                {
                    sku: `TEST-${stamp}`,
                    variantName: 'Test variant',
                    price: 12.5,
                    stockQuantity: 10
                }
            ]
        }, adminToken);

        assert.equal(product.status, 201, JSON.stringify(product.body));

        productId = product.body.data.productId;

        const variantId = product.body.data.variantIds[0];

        const checkout = {
            deliveryMode: 'STANDARD_DELIVERY',
            deliveryAddress: '1 Test Road',
            destinationCity: 'Austin',
            paymentMethod: 'CASH_ON_DELIVERY'
        };

        await t.test(
            'two simultaneous adds produce one active cart and one line',
            async () => {
                const adds = await Promise.all([
                    request(
                        '/cart/items',
                        'POST',
                        { variantId, quantity: 1 },
                        token
                    ),
                    request(
                        '/cart/items',
                        'POST',
                        { variantId, quantity: 1 },
                        token
                    )
                ]);

                assert.ok(
                    adds.every(r => r.status === 201),
                    JSON.stringify(adds)
                );

                const cart = (
                    await request('/cart', 'GET', undefined, token)
                ).body.data;

                assert.equal(cart.items.length, 1);
                assert.equal(cart.items[0].quantity, 2);
                assert.equal(cart.total, 25);
            }
        );

        let orderId;

        await t.test(
            'simultaneous checkout creates one order and decrements stock once',
            async () => {
                const cart = (
                    await request('/cart', 'GET', undefined, token)
                ).body.data;

                const responses = await Promise.all([
                    request(
                        '/checkout',
                        'POST',
                        { ...checkout, cartId: cart.cartId },
                        token
                    ),
                    request(
                        '/checkout',
                        'POST',
                        { ...checkout, cartId: cart.cartId },
                        token
                    )
                ]);

                assert.deepEqual(
                    responses.map(r => r.status).sort(),
                    [201, 422],
                    JSON.stringify(responses)
                );

                orderId = responses.find(
                    r => r.status === 201
                ).body.data.orderId;

                const detail = (
                    await request(
                        `/orders/${orderId}`,
                        'GET',
                        undefined,
                        token
                    )
                ).body.data;

                assert.equal(detail.payment.amount, 25);
                assert.equal(detail.payment.paymentStatus, 'PENDING');

                assert.equal(
                    (
                        await request(`/variants/${variantId}`)
                    ).body.data.stockQuantity,
                    8
                );
            }
        );

        await t.test(
            'order ownership and staff roles are enforced',
            async () => {
                assert.equal(
                    (
                        await request(
                            `/orders/${orderId}`,
                            'GET',
                            undefined,
                            tokens[1]
                        )
                    ).status,
                    403
                );

                assert.equal(
                    (
                        await request(
                            '/reports/customer-summary',
                            'GET',
                            undefined,
                            token
                        )
                    ).status,
                    403
                );

                assert.equal(
                    (
                        await request(
                            '/inventory/stock-adjustments',
                            'POST',
                            {
                                variantId,
                                adjustmentType: 'RESTOCK',
                                quantityChange: 1,
                                reason: 'test'
                            },
                            token
                        )
                    ).status,
                    403
                );
            }
        );

        await t.test(
            'stock reduction rolls back a checkout without sufficient inventory',
            async () => {
                await request(
                    '/cart/items',
                    'POST',
                    { variantId, quantity: 8 },
                    token
                );

                const adjustment = await request(
                    '/inventory/stock-adjustments',
                    'POST',
                    {
                        variantId,
                        adjustmentType: 'DAMAGE',
                        quantityChange: -1,
                        reason: 'Integration fixture'
                    },
                    adminToken
                );

                assert.equal(adjustment.status, 201);

                const failed = await request(
                    '/checkout',
                    'POST',
                    checkout,
                    token
                );

                assert.equal(failed.status, 422);

                assert.equal(
                    (
                        await request('/cart', 'GET', undefined, token)
                    ).body.data.items[0].quantity,
                    8
                );

                assert.equal(
                    (
                        await request(`/variants/${variantId}`)
                    ).body.data.stockQuantity,
                    7
                );

                const [rows] = await pool.query(
                    'SELECT COUNT(*) AS n FROM CUSTOMER_ORDER WHERE customer_id = ?',
                    [customerIds[0]]
                );

                assert.equal(rows[0].n, 1);
            }
        );

        await t.test(
            'negative stock adjustment rolls back its audit entry',
            async () => {
                const failed = await request(
                    '/inventory/stock-adjustments',
                    'POST',
                    {
                        variantId,
                        adjustmentType: 'DAMAGE',
                        quantityChange: -100,
                        reason: 'Must reject'
                    },
                    adminToken
                );

                assert.equal(failed.status, 422);

                assert.equal(
                    (
                        await request(`/variants/${variantId}`)
                    ).body.data.stockQuantity,
                    7
                );

                const [audit] = await pool.query(
                    'SELECT COUNT(*) AS n FROM STOCK_ADJUSTMENT WHERE variant_id = ? AND reason = ?',
                    [variantId, 'Must reject']
                );

                assert.equal(audit[0].n, 0);
            }
        );

        await t.test(
            'all five reports execute, including the end date of a date range',
            async () => {
                const [[{ today }]] = await pool.query(
                    "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today"
                );

                const report = await request(
                    `/reports/top-selling-products?from=${today}&to=${today}&limit=100`,
                    'GET',
                    undefined,
                    adminToken
                );

                assert.equal(report.status, 200);

                assert.ok(
                    report.body.data.some(
                        r => r.productId === productId && r.unitsSold === 2
                    )
                );

                for (const name of [
                    'quarterly-sales',
                    'category-order-counts',
                    'delivery-estimates',
                    'customer-summary'
                ]) {
                    assert.equal(
                        (
                            await request(
                                `/reports/${name}`,
                                'GET',
                                undefined,
                                adminToken
                            )
                        ).status,
                        200,
                        name
                    );
                }
            }
        );

        await t.test(
            'admin photo, stock and visibility changes persist in MySQL',
            async () => {
                assert.equal(
                    (
                        await request(
                            `/admin/products/${productId}`,
                            'GET',
                            undefined,
                            token
                        )
                    ).status,
                    403
                );

                const detail = await request(
                    `/admin/products/${productId}`,
                    'GET',
                    undefined,
                    adminToken
                );

                assert.equal(detail.status, 200);
                assert.deepEqual(detail.body.data.images, []);

                const bytes = require('fs').readFileSync(
                    require('path').join(
                        __dirname,
                        '../../frontend/public/products/technova-pulse-12.webp'
                    )
                );

                const upload = await fetch(
                    base + `/admin/products/${productId}/images`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${adminToken}`,
                            'Content-Type': 'image/webp'
                        },
                        body: bytes
                    }
                );

                assert.equal(upload.status, 201);

                const photo = (await upload.json()).data[0];

                const served = await fetch(
                    base.replace('/api/v1', '') + photo.url
                );

                assert.equal(
                    served.headers.get('content-type'),
                    'image/webp'
                );

                assert.deepEqual(
                    Buffer.from(await served.arrayBuffer()),
                    bytes
                );

                assert.equal(
                    (
                        await request(`/products/${productId}`)
                    ).body.data.images.length,
                    1
                );

                assert.equal(
                    (
                        await request(
                            `/admin/products/${productId}/images/${photo.imageId}`,
                            'DELETE',
                            undefined,
                            adminToken
                        )
                    ).status,
                    200
                );

                assert.deepEqual(
                    (
                        await request(`/products/${productId}`)
                    ).body.data.images,
                    []
                );

                const stockPath = `/admin/variants/${variantId}/stock`;

                assert.equal(
                    (
                        await request(
                            stockPath,
                            'PUT',
                            {
                                stockQuantity: 11,
                                expectedStockQuantity: 7,
                                reason: 'Admin integration test'
                            },
                            adminToken
                        )
                    ).status,
                    200
                );

                assert.equal(
                    (
                        await request(
                            stockPath,
                            'PUT',
                            {
                                stockQuantity: 20,
                                expectedStockQuantity: 7,
                                reason: 'Stale edit'
                            },
                            adminToken
                        )
                    ).status,
                    409
                );

                assert.equal(
                    (
                        await request(`/variants/${variantId}`)
                    ).body.data.stockQuantity,
                    11
                );

                const body = {
                    productName: `Edited ${stamp}`,
                    brand: 'Test',
                    description: 'Edited product',
                    categoryIds: [categoryId],
                    status: 'DISCONTINUED'
                };

                assert.equal(
                    (
                        await request(
                            `/admin/products/${productId}`,
                            'PUT',
                            body,
                            adminToken
                        )
                    ).status,
                    200
                );

                assert.equal(
                    (
                        await request(`/products/${productId}`)
                    ).status,
                    404
                );
            }
        );
    }
);