'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'unit-test-only-secret';

const app = require('../app');
const pool = require('../config/db');

const cart = require('../services/cart.service');
const customers = require('../services/customers.service');
const checkout = require('../services/checkout.service');

test('Malformed JSON returns a useful 400 response', async () => {
    const server = app.listen(0, '127.0.0.1');

    await new Promise(resolve => server.once('listening', resolve));

    try {
        const res = await fetch(
            `http://127.0.0.1:${server.address().port}/api/v1/auth/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: '{"broken":'
            }
        );

        assert.equal(res.status, 400);
        assert.equal((await res.json()).error.code, 'INVALID_JSON');
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

test('Checkout rejects overlong city and invalid cart identifiers before querying SQL', async () => {
    const base = {
        deliveryMode: 'STORE_PICKUP',
        destinationCity: 'Austin',
        paymentMethod: 'CASH_ON_DELIVERY'
    };

    for (const extra of [
        { destinationCity: 'a'.repeat(81) },
        { cartId: -1 },
        { cartId: 'bad' },
        { deliveryAddress: {} }
    ]) {
        await assert.rejects(
            checkout.placeOrder(1, { ...base, ...extra }),
            { code: 'VALIDATION_ERROR' }
        );
    }
});

test('Cart failure rolls back and releases its connection', async t => {
    const original = pool.getConnection;
    const calls = [];

    pool.getConnection = async () => ({
        beginTransaction: async () => calls.push('begin'),
        query: async sql => {
            calls.push(sql);
            return [[]];
        },
        commit: async () => calls.push('commit'),
        rollback: async () => calls.push('rollback'),
        release: () => calls.push('release')
    });

    t.after(() => {
        pool.getConnection = original;
    });

    await assert.rejects(
        cart.addItem(1, { variantId: 999, quantity: 1 }),
        { code: 'NOT_FOUND' }
    );

    assert.ok(
        calls.some(s => s.includes('CUSTOMER') && s.includes('FOR UPDATE'))
    );

    assert.deepEqual(calls.slice(-2), ['rollback', 'release']);
    assert.ok(!calls.includes('commit'));
});

test('Cart overstock rejection is atomic', async t => {
    const original = pool.getConnection;

    let rolledBack = false;
    let inserted = false;

    pool.getConnection = async () => ({
        beginTransaction: async () => {},
        query: async sql => {
            if (sql.includes('FROM VARIANT')) {
                return [[{ variant_id: 1, stock_quantity: 2 }]];
            }

            if (sql.includes('FROM CART WHERE')) {
                return [[{ cart_id: 1 }]];
            }

            if (sql.includes('FROM CART_ITEM')) {
                return [[{ cart_item_id: 1, quantity: 2 }]];
            }

            if (sql.startsWith('INSERT') || sql.startsWith('UPDATE')) {
                inserted = true;
            }

            return [[]];
        },
        commit: async () => {},
        rollback: async () => {
            rolledBack = true;
        },
        release: () => {}
    });

    t.after(() => {
        pool.getConnection = original;
    });

    await assert.rejects(
        cart.addItem(1, { variantId: 1, quantity: 1 }),
        { code: 'VALIDATION_ERROR' }
    );

    assert.ok(rolledBack);
    assert.equal(inserted, false);
});

test('Profile update releases its first connection before reading the new profile', async t => {
    const original = pool.getConnection;

    let held = false;

    pool.getConnection = async () => {
        assert.equal(held, false, 'a one-connection pool must not deadlock');

        held = true;

        return {
            query: async sql =>
                sql.startsWith('SELECT')
                    ? [[{
                        customer_id: 1,
                        full_name: 'Demo',
                        role: 'CUSTOMER'
                    }]]
                    : [{}],
            release: () => {
                held = false;
            }
        };
    };

    t.after(() => {
        pool.getConnection = original;
    });

    const result = await customers.updateProfile(1, { phone: null });

    assert.equal(result.role, 'CUSTOMER');
    assert.equal(held, false);
});