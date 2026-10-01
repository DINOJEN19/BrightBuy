// tests/task3.test.js
// Automated test suite for Task 3: Shopping Cart & Checkout Orchestration.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// Ensure JWT_SECRET is set for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_brightbuy_2026';

const app = require('../app');
const checkoutService = require('../services/checkout.service');
const cartService = require('../services/cart.service');
const pool = require('../config/db');

// Helper to generate a valid test JWT
function getTestToken(customerId = 1, role = 'CUSTOMER') {
  return jwt.sign({ customerId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Simple request helper using http.request to avoid external supertest dependency
const http = require('http');

function makeRequest(app, { method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;
      const reqHeaders = { ...headers };
      if (payload) {
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            server.close();
            let parsedBody = null;
            try {
              parsedBody = data ? JSON.parse(data) : null;
            } catch {
              parsedBody = data;
            }
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: parsedBody,
            });
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

test('1. Card Details Validation Unit Tests', async (t) => {
  await t.test('accepts valid 16-digit card with MM/YY expiry', () => {
    const valid = checkoutService.isValidCardDetails({
      cardNumber: '4532 1111 2222 3333',
      expiryDate: '12/28',
      cvv: '123',
    });
    assert.equal(valid, true);
  });

  await t.test('accepts valid card with separate expiryMonth and expiryYear', () => {
    const valid = checkoutService.isValidCardDetails({
      cardNumber: '5555444433332222',
      expiryMonth: 10,
      expiryYear: 2027,
      cvv: '456',
    });
    assert.equal(valid, true);
  });

  await t.test('rejects card with invalid/short card number', () => {
    const invalid = checkoutService.isValidCardDetails({
      cardNumber: '12345',
      expiryDate: '12/28',
      cvv: '123',
    });
    assert.equal(invalid, false);
  });

  await t.test('rejects card with invalid CVV', () => {
    const invalid = checkoutService.isValidCardDetails({
      cardNumber: '4532111122223333',
      expiryDate: '12/28',
      cvv: '12',
    });
    assert.equal(invalid, false);
  });

  await t.test('rejects card with invalid expiry format', () => {
    const invalid = checkoutService.isValidCardDetails({
      cardNumber: '4532111122223333',
      expiryDate: 'invalid-date',
      cvv: '123',
    });
    assert.equal(invalid, false);
  });

  await t.test('rejects null or non-object card details', () => {
    assert.equal(checkoutService.isValidCardDetails(null), false);
    assert.equal(checkoutService.isValidCardDetails(undefined), false);
    assert.equal(checkoutService.isValidCardDetails('string'), false);
  });
});

test('2. Authentication & Authorization Guards', async (t) => {
  await t.test('GET /api/v1/cart rejects unauthenticated request (401)', async () => {
    const res = await makeRequest(app, { method: 'GET', path: '/api/v1/cart' });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'UNAUTHENTICATED');
  });

  await t.test('POST /api/v1/cart/items rejects unauthenticated request (401)', async () => {
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/cart/items',
      body: { variantId: 1, quantity: 2 },
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'UNAUTHENTICATED');
  });

  await t.test('PUT /api/v1/cart/items/:id rejects unauthenticated request (401)', async () => {
    const res = await makeRequest(app, {
      method: 'PUT',
      path: '/api/v1/cart/items/1',
      body: { quantity: 3 },
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'UNAUTHENTICATED');
  });

  await t.test('DELETE /api/v1/cart/items/:id rejects unauthenticated request (401)', async () => {
    const res = await makeRequest(app, {
      method: 'DELETE',
      path: '/api/v1/cart/items/1',
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'UNAUTHENTICATED');
  });

  await t.test('POST /api/v1/checkout rejects unauthenticated request (401)', async () => {
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/checkout',
      body: { deliveryMode: 'STORE_PICKUP', destinationCity: 'Dallas', paymentMethod: 'CASH_ON_DELIVERY' },
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'UNAUTHENTICATED');
  });

  await t.test('Rejects invalid JWT token (401 INVALID_TOKEN)', async () => {
    const res = await makeRequest(app, {
      method: 'GET',
      path: '/api/v1/cart',
      headers: { Authorization: 'Bearer invalid.token.payload' },
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'INVALID_TOKEN');
  });
});

test('3. Cart Input Validation', async (t) => {
  const token = getTestToken(101);

  await t.test('POST /api/v1/cart/items rejects non-positive or float quantity', async () => {
    const testCases = [0, -1, 2.5, 'not-a-number', null];
    for (const q of testCases) {
      const res = await makeRequest(app, {
        method: 'POST',
        path: '/api/v1/cart/items',
        headers: { Authorization: `Bearer ${token}` },
        body: { variantId: 1, quantity: q },
      });
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error.code, 'INVALID_QUANTITY');
      assert.equal(res.body.error.message, 'Quantity must be a positive integer.');
    }
  });

  await t.test('PUT /api/v1/cart/items/:id rejects non-positive quantity', async () => {
    const res = await makeRequest(app, {
      method: 'PUT',
      path: '/api/v1/cart/items/1',
      headers: { Authorization: `Bearer ${token}` },
      body: { quantity: 0 },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'INVALID_QUANTITY');
    assert.equal(res.body.error.message, 'Quantity must be a positive integer.');
  });
});

test('4. Checkout Input Validation', async (t) => {
  const token = getTestToken(101);

  await t.test('rejects missing or invalid deliveryMode', async () => {
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/checkout',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        destinationCity: 'Houston',
        paymentMethod: 'CASH_ON_DELIVERY',
      },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('deliveryMode'));
  });

  await t.test('rejects missing or empty destinationCity', async () => {
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/checkout',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        deliveryMode: 'STORE_PICKUP',
        destinationCity: '   ',
        paymentMethod: 'CASH_ON_DELIVERY',
      },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('destinationCity'));
  });

  await t.test('rejects missing or invalid paymentMethod', async () => {
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/checkout',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        deliveryMode: 'STORE_PICKUP',
        destinationCity: 'Houston',
        paymentMethod: 'CRYPTO',
      },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('paymentMethod'));
  });

  await t.test('CARD_PAYMENT rejects invalid cardDetails with 400 VALIDATION_ERROR', async () => {
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/checkout',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        deliveryMode: 'STANDARD_DELIVERY',
        deliveryAddress: '123 Main St',
        destinationCity: 'Austin',
        paymentMethod: 'CARD_PAYMENT',
        cardDetails: { cardNumber: '123', cvv: '1', expiryDate: 'invalid' },
      },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.body.error.message, 'Card details failed basic format validation.');
  });
});

test('5. Cart and Checkout Service Logic (with Mocked DB Pool)', async (t) => {
  const originalGetConnection = pool.getConnection;

  t.afterEach(() => {
    pool.getConnection = originalGetConnection;
  });

  await t.test('getCart returns empty cart when customer has no active cart', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('FROM CART')) return [[]];
        return [[]];
      },
      release: () => {},
    });

    const cart = await cartService.getCart(999);
    assert.deepEqual(cart, {
      cartId: null,
      items: [],
      total: 0,
    });
  });

  await t.test('getCart returns items and correct subtotal/total calculation', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('FROM CART\n') || sql.includes('FROM CART ')) {
          return [[{ cart_id: 42 }]];
        }
        if (sql.includes('FROM CART_ITEM')) {
          return [
            [
              {
                cartItemId: 1,
                variantId: 10,
                variantName: 'Galaxy S24 Ultra - Titanium',
                quantity: 2,
                unitPrice: '1199.99',
                subtotal: '2399.98',
              },
              {
                cartItemId: 2,
                variantId: 12,
                variantName: 'Protective Case',
                quantity: 1,
                unitPrice: '49.99',
                subtotal: '49.99',
              },
            ],
          ];
        }
        return [[]];
      },
      release: () => {},
    });

    const cart = await cartService.getCart(1);
    assert.equal(cart.cartId, 42);
    assert.equal(cart.items.length, 2);
    assert.equal(cart.items[0].subtotal, 2399.98);
    assert.equal(cart.items[1].subtotal, 49.99);
    assert.equal(cart.total, 2449.97);
  });

  await t.test('addItem throws 404 when variant does not exist', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('FROM VARIANT')) return [[]];
        return [[]];
      },
      release: () => {},
    });

    await assert.rejects(
      async () => {
        await cartService.addItem(1, { variantId: 9999, quantity: 1 });
      },
      (err) => {
        assert.equal(err.code, 'NOT_FOUND');
        assert.equal(err.message, 'Variant not found.');
        return true;
      }
    );
  });

  await t.test('updateItem throws 404 when cart item does not belong to customer', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('FROM CART_ITEM ci')) return [[]];
        return [[]];
      },
      release: () => {},
    });

    await assert.rejects(
      async () => {
        await cartService.updateItem(1, 999, { quantity: 3 });
      },
      (err) => {
        assert.equal(err.code, 'NOT_FOUND');
        assert.equal(err.message, 'Cart item not found.');
        return true;
      }
    );
  });

  await t.test('removeItem throws 404 when cart item does not belong to customer', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('FROM CART_ITEM ci')) return [[]];
        return [[]];
      },
      release: () => {},
    });

    await assert.rejects(
      async () => {
        await cartService.removeItem(1, 999);
      },
      (err) => {
        assert.equal(err.code, 'NOT_FOUND');
        assert.equal(err.message, 'Cart item not found.');
        return true;
      }
    );
  });

  await t.test('placeOrder successfully executes sp_PlaceOrder and returns confirmed order', async () => {
    let calledProcedure = false;
    pool.getConnection = async () => ({
      query: async (sql, params) => {
        if (sql.includes('FROM CART')) {
          return [[{ cart_id: 15 }]];
        }
        if (sql.includes('CALL sp_PlaceOrder')) {
          calledProcedure = true;
          assert.equal(params[0], 1); // customerId
          assert.equal(params[1], 15); // cartId
          assert.equal(params[2], 'STANDARD_DELIVERY');
          assert.equal(params[3], '123 Test St');
          assert.equal(params[4], 'Dallas');
          assert.equal(params[5], 'CASH_ON_DELIVERY');
          return [[]];
        }
        if (sql.includes('SELECT @p_order_id')) {
          return [[{ orderId: 789, estimatedDeliveryDate: '2026-10-06' }]];
        }
        return [[]];
      },
      release: () => {},
    });

    const result = await checkoutService.placeOrder(1, {
      deliveryMode: 'STANDARD_DELIVERY',
      deliveryAddress: '123 Test St',
      destinationCity: 'Dallas',
      paymentMethod: 'CASH_ON_DELIVERY',
    });

    assert.equal(calledProcedure, true);
    assert.equal(result.orderId, 789);
    assert.equal(result.estimatedDeliveryDate, '2026-10-06');
    assert.equal(result.orderStatus, 'CONFIRMED');
  });

  await t.test('placeOrder surfaces sp_PlaceOrder SQLSTATE 45000 as 422 BUSINESS_RULE_VIOLATION in HTTP endpoint', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('FROM CART')) {
          return [[{ cart_id: 15 }]];
        }
        if (sql.includes('CALL sp_PlaceOrder')) {
          const err = new Error('Order rejected: one or more items no longer have sufficient stock.');
          err.sqlState = '45000';
          err.sqlMessage = 'Order rejected: one or more items no longer have sufficient stock.';
          throw err;
        }
        return [[]];
      },
      release: () => {},
    });

    const token = getTestToken(1);
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/checkout',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        deliveryMode: 'STANDARD_DELIVERY',
        deliveryAddress: '123 Test St',
        destinationCity: 'Dallas',
        paymentMethod: 'CASH_ON_DELIVERY',
      },
    });

    assert.equal(res.statusCode, 422);
    assert.equal(res.body.error.code, 'BUSINESS_RULE_VIOLATION');
    assert.equal(
      res.body.error.message,
      'Order rejected: one or more items no longer have sufficient stock.'
    );
  });
});
