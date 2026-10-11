'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

process.env.JWT_SECRET = 'admin-management-test-secret';

const app = require('../app');
const pool = require('../config/db');
const auth = require('../services/auth.service');
const management = require('../services/productManagement.service');
const images = require('../services/productImages.service');

async function withServer(fn) {
    const s = app.listen(0, '127.0.0.1');

    await new Promise(r => s.once('listening', r));

    try {
        await fn(`http://127.0.0.1:${s.address().port}/api/v1`);
    } finally {
        await new Promise(r => s.close(r));
    }
}

const token = role =>
    jwt.sign(
        { customerId: 1, role },
        process.env.JWT_SECRET
    );

function mockConnection(t, query) {
    const previous = pool.getConnection;
    const calls = [];

    pool.getConnection = async () => ({
        query,
        beginTransaction: async () => calls.push('begin'),
        commit: async () => calls.push('commit'),
        rollback: async () => calls.push('rollback'),
        release: () => calls.push('release')
    });

    t.after(() => {
        pool.getConnection = previous;
    });

    return calls;
}

test(
    'All management endpoints reject guests and customer tokens before touching data',
    async () => withServer(async base => {
        for (const [method, path] of [
            ['GET', '/admin/products'],
            ['GET', '/admin/products/1'],
            ['PUT', '/admin/products/1'],
            ['PUT', '/admin/variants/1/stock'],
            ['POST', '/admin/products/1/images'],
            ['DELETE', '/admin/products/1/images/1'],
            ['PUT', '/admin/products/1/images/1/cover']
        ]) {
            assert.equal(
                (await fetch(base + path, { method })).status,
                401
            );

            assert.equal(
                (
                    await fetch(base + path, {
                        method,
                        headers: {
                            Authorization: `Bearer ${token('CUSTOMER')}`
                        }
                    })
                ).status,
                403
            );
        }
    })
);

test('Admin portal verifies stored role and never promotes a customer', async t => {
    const hash = await bcrypt.hash('test-password', 4);
    let role = 'CUSTOMER';

    mockConnection(t, async () => [[{
        customer_id: 1,
        full_name: 'Test',
        email: 'test@example.com',
        password_hash: hash,
        role
    }]]);

    await assert.rejects(
        auth.login({
            email: 'test@example.com',
            password: 'test-password',
            portal: 'ADMIN'
        }),
        {
            status: 403,
            code: 'WRONG_PORTAL'
        }
    );

    role = 'ADMIN';

    const r = await auth.login({
        email: 'test@example.com',
        password: 'test-password',
        portal: 'ADMIN'
    });

    assert.equal(
        jwt.verify(r.token, process.env.JWT_SECRET).role,
        'ADMIN'
    );

    await assert.rejects(
        auth.login({
            email: 'test@example.com',
            password: 'test-password',
            portal: 'CUSTOMER'
        }),
        { status: 403 }
    );
});

test('Stock replacement locks and records the exact delta atomically', async t => {
    const queries = [];

    const calls = mockConnection(t, async (sql, args) => {
        queries.push([sql, args]);

        return sql.startsWith('SELECT')
            ? [[{ stock_quantity: 8 }]]
            : [{ affectedRows: 1 }];
    });

    const r = await management.setStock(7, {
        stockQuantity: 3,
        expectedStockQuantity: 8,
        reason: 'Count correction'
    });

    assert.equal(r.quantityChange, -5);
    assert.match(queries[0][0], /FOR UPDATE/);

    assert.deepEqual(
        queries.find(q => q[0].startsWith('INSERT'))[1],
        [7, -5, 'Count correction']
    );

    assert.deepEqual(calls, ['begin', 'commit', 'release']);
});

test('Stale stock update rolls back instead of overwriting a checkout', async t => {
    let writes = 0;

    const calls = mockConnection(t, async sql => {
        if (!sql.startsWith('SELECT')) {
            writes++;
        }

        return [[{ stock_quantity: 4 }]];
    });

    await assert.rejects(
        management.setStock(7, {
            stockQuantity: 10,
            expectedStockQuantity: 5,
            reason: 'Restock'
        }),
        {
            status: 409,
            code: 'STOCK_CHANGED'
        }
    );

    assert.equal(writes, 0);
    assert.deepEqual(calls, ['begin', 'rollback', 'release']);
});

test('Failure to write stock audit rolls back the quantity', async t => {
    const calls = mockConnection(t, async sql => {
        if (sql.startsWith('INSERT')) {
            throw Error('Database unavailable');
        }

        return sql.startsWith('SELECT')
            ? [[{ stock_quantity: 5 }]]
            : [{}];
    });

    await assert.rejects(
        management.setStock(1, {
            stockQuantity: 6,
            expectedStockQuantity: 5,
            reason: 'Test'
        })
    );

    assert.deepEqual(calls, ['begin', 'rollback', 'release']);
});

test(
    'Stock API rejects fractional and negative counts; uploads reject scripts and oversized files',
    async () => withServer(async base => {
        const headers = {
            Authorization: `Bearer ${token('ADMIN')}`,
            'Content-Type': 'application/json'
        };

        for (const stockQuantity of [-1, 1.5]) {
            assert.equal(
                (
                    await fetch(base + '/admin/variants/1/stock', {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                            stockQuantity,
                            expectedStockQuantity: 1,
                            reason: 'Test'
                        })
                    })
                ).status,
                400
            );
        }

        for (const body of [
            Buffer.from('<svg onload="alert(1)">bad</svg>'),
            Buffer.alloc(2 * 1024 * 1024 + 1)
        ]) {
            const r = await fetch(
                base + '/admin/products/1/images',
                {
                    method: 'POST',
                    headers: {
                        Authorization: headers.Authorization,
                        'Content-Type': 'image/png'
                    },
                    body
                }
            );

            assert.equal(
                r.status,
                body.length > 2 * 1024 * 1024 ? 413 : 400
            );
        }
    })
);

test('Picture removal is scoped to the product and retains a seed tombstone', async t => {
    let update;

    const calls = mockConnection(t, async (sql, args) => {
        if (sql.startsWith('UPDATE')) {
            update = [sql, args];
            return [{ affectedRows: 1 }];
        }

        if (sql.includes('FROM PRODUCT WHERE')) {
            return [[{ product_id: 1 }]];
        }

        return [[]];
    });

    const result = await images.removeImage(1, 9);

    assert.deepEqual(result, []);
    assert.match(update[0], /deleted_at=CURRENT_TIMESTAMP/);
    assert.deepEqual(update[1], [9, 1]);
    assert.deepEqual(calls, ['begin', 'commit', 'release']);
});

test('Cover and removal cannot target another product picture', async t => {
    mockConnection(t, async sql =>
        sql.includes('FROM PRODUCT WHERE')
            ? [[{ product_id: 1 }]]
            : sql.startsWith('UPDATE')
                ? [{ affectedRows: 0 }]
                : [[{ imageId: 2, filePath: '/products/a.webp' }]]
    );

    await assert.rejects(
        images.setCover(1, 99),
        { status: 404 }
    );

    await assert.rejects(
        images.removeImage(1, 99),
        { status: 404 }
    );
});

test('Picture upload is capped at eight inside the product lock', async t => {
    mockConnection(t, async sql =>
        sql.includes('FROM PRODUCT WHERE')
            ? [[{ product_id: 1 }]]
            : [
                Array.from(
                    { length: 8 },
                    (_, i) => ({
                        imageId: i,
                        filePath: '/p.webp'
                    })
                )
            ]
    );

    const png = Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        Buffer.alloc(8)
    ]);

    await assert.rejects(
        images.addImage(1, png),
        { code: 'IMAGE_LIMIT' }
    );
});

test('Raw image upload reaches storage with original bytes and appears in the gallery', async t => {
    const bytes = require('fs').readFileSync(
        require('path').join(
            __dirname,
            '../../frontend/public/products/technova-pulse-12.webp'
        )
    );

    let saved;

    mockConnection(t, async (sql, args) => {
        if (sql.includes('FROM PRODUCT WHERE')) {
            return [[{ product_id: 1 }]];
        }

        if (sql.startsWith('INSERT')) {
            saved = args;
            return [{ insertId: 9 }];
        }

        return [
            saved
                ? [{ imageId: 9, filePath: null }]
                : []
        ];
    });

    await withServer(async base => {
        const r = await fetch(
            base + '/admin/products/1/images',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token('ADMIN')}`,
                    'Content-Type': 'image/webp'
                },
                body: bytes
            }
        );

        assert.equal(r.status, 201);

        assert.deepEqual(
            (await r.json()).data,
            [{
                imageId: 9,
                url: '/api/v1/product-images/9'
            }]
        );

        assert.equal(saved[1], 'image/webp');
        assert.deepEqual(saved[2], bytes);
    });
});