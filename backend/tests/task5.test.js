// tests/task5.test.js
// Automated test suite for Task 5: Management Reporting & Catalogue Administration.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const http = require('http');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_brightbuy_2026';

const app = require('../app');
const pool = require('../config/db');

function getTestToken(customerId = 1, role = 'ADMIN') {
  return jwt.sign({ customerId, role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
}

function makeRequest(appInstance, { method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(appInstance);
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

test('1. Role-Based Access Control for Task 5', async (t) => {
  const routes = [
    { method: 'GET', path: '/api/v1/reports/quarterly-sales' },
    { method: 'GET', path: '/api/v1/reports/top-selling-products' },
    { method: 'GET', path: '/api/v1/reports/category-order-counts' },
    { method: 'GET', path: '/api/v1/reports/delivery-estimates' },
    { method: 'GET', path: '/api/v1/reports/customer-summary' },
    { method: 'POST', path: '/api/v1/admin/categories', body: { categoryName: 'Test' } },
    { method: 'POST', path: '/api/v1/admin/products', body: {} },
    { method: 'PUT', path: '/api/v1/admin/variants/1', body: { price: 99.99 } },
  ];

  for (const r of routes) {
    await t.test(`${r.method} ${r.path} rejects unauthenticated request with 401`, async () => {
      const res = await makeRequest(app, {
        method: r.method,
        path: r.path,
        body: r.body,
      });
      assert.equal(res.statusCode, 401);
      assert.equal(res.body.error.code, 'UNAUTHENTICATED');
    });

    await t.test(`${r.method} ${r.path} rejects non-ADMIN role with 403`, async () => {
      const customerToken = getTestToken(10, 'CUSTOMER');
      const res = await makeRequest(app, {
        method: r.method,
        path: r.path,
        headers: { Authorization: `Bearer ${customerToken}` },
        body: r.body,
      });
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });

    await t.test(`${r.method} ${r.path} rejects WAREHOUSE_STAFF role with 403`, async () => {
      const staffToken = getTestToken(20, 'WAREHOUSE_STAFF');
      const res = await makeRequest(app, {
        method: r.method,
        path: r.path,
        headers: { Authorization: `Bearer ${staffToken}` },
        body: r.body,
      });
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.error.code, 'FORBIDDEN');
    });
  }
});

test('2. Management Reports Endpoints (Admin)', async (t) => {
  const adminToken = getTestToken(1, 'ADMIN');

  await t.test('GET /api/v1/reports/quarterly-sales returns formatted quarterly sales', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('sp_QuarterlySalesReport')) {
          return [
            [
              { report_year: 2026, sales_quarter: 1, order_count: 15, total_sales: '4500.50' },
              { report_year: 2026, sales_quarter: 2, order_count: 22, total_sales: '7800.00' },
            ],
          ];
        }
        return [[]];
      },
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'GET',
      path: '/api/v1/reports/quarterly-sales?year=2026',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 2);
    assert.deepEqual(res.body.data[0], {
      quarter: 'Q1',
      totalSales: 4500.5,
      orderCount: 15,
    });
  });

  await t.test('GET /api/v1/reports/top-selling-products returns products sorted by sales', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('sp_TopSellingProducts') || sql.includes('ORDER_ITEM')) {
          return [
            [
              { product_id: 1, product_name: 'Galaxy S24 Ultra', total_quantity_sold: 45, total_revenue: '53999.55' },
              { product_id: 2, product_name: 'iPhone 15 Pro', total_quantity_sold: 30, total_revenue: '35999.70' },
            ],
          ];
        }
        return [[]];
      },
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'GET',
      path: '/api/v1/reports/top-selling-products?limit=5',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 2);
    assert.deepEqual(res.body.data[0], {
      productId: 1,
      productName: 'Galaxy S24 Ultra',
      unitsSold: 45,
      revenue: 53999.55,
    });
  });

  await t.test('GET /api/v1/reports/category-order-counts returns category stats', async () => {
    pool.getConnection = async () => ({
      query: async () => [
        [
          { category_id: 10, category_name: 'Smartphones', order_count: 85 },
          { category_id: 11, category_name: 'Laptops', order_count: 42 },
        ],
      ],
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'GET',
      path: '/api/v1/reports/category-order-counts',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 2);
    assert.deepEqual(res.body.data[0], {
      categoryId: 10,
      categoryName: 'Smartphones',
      orderCount: 85,
    });
  });

  await t.test('GET /api/v1/reports/delivery-estimates returns upcoming undelivered orders', async () => {
    pool.getConnection = async () => ({
      query: async () => [
        [
          {
            order_id: 501,
            destination_city: 'Austin',
            estimated_delivery_date: '2026-10-15',
            delivery_status: 'DISPATCHED',
          },
        ],
      ],
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'GET',
      path: '/api/v1/reports/delivery-estimates',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.deepEqual(res.body.data[0], {
      orderId: 501,
      destinationCity: 'Austin',
      estimatedDeliveryDate: '2026-10-15',
      deliveryStatus: 'DISPATCHED',
    });
  });

  await t.test('GET /api/v1/reports/customer-summary returns grouped customer order data', async () => {
    pool.getConnection = async () => ({
      query: async () => [
        [
          { customer_id: 1, full_name: 'Alice Johnson', order_id: 101, total_amount: '120.50', payment_status: 'PAID' },
          { customer_id: 1, full_name: 'Alice Johnson', order_id: 102, total_amount: '45.00', payment_status: 'PAID' },
          { customer_id: 2, full_name: 'Bob Smith', order_id: 103, total_amount: '350.00', payment_status: 'PENDING' },
        ],
      ],
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'GET',
      path: '/api/v1/reports/customer-summary',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0].customerId, 1);
    assert.equal(res.body.data[0].fullName, 'Alice Johnson');
    assert.equal(res.body.data[0].orders.length, 2);
    assert.deepEqual(res.body.data[0].orders[0], {
      orderId: 101,
      totalAmount: 120.5,
      paymentStatus: 'PAID',
    });
  });
});

test('3. Catalogue Admin Endpoints', async (t) => {
  const adminToken = getTestToken(1, 'ADMIN');

  await t.test('POST /api/v1/admin/categories rejects missing categoryName', async () => {
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/admin/categories',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { categoryName: '   ' },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /api/v1/admin/categories rejects duplicate category name with 409', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('SELECT category_id FROM CATEGORY')) {
          return [[{ category_id: 5 }]];
        }
        return [[]];
      },
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/admin/categories',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { categoryName: 'Electronics' },
    });
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.error.code, 'CATEGORY_EXISTS');
  });

  await t.test('POST /api/v1/admin/categories creates category on valid input', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('SELECT category_id FROM CATEGORY')) return [[]];
        if (sql.includes('INSERT INTO CATEGORY')) return [{ insertId: 77 }];
        return [[]];
      },
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/admin/categories',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { categoryName: 'Gaming Accessories', description: 'Headsets, mice, keyboards' },
    });
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body.data, { categoryId: 77 });
  });

  await t.test('POST /api/v1/admin/products rejects missing categories or variants', async () => {
    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/admin/products',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { productName: 'Laptop X', categoryIds: [], variants: [] },
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.body.error.message, 'Every product requires at least one category and one variant.');
  });

  await t.test('POST /api/v1/admin/products rejects duplicate SKU with 409 SKU_TAKEN', async () => {
    pool.getConnection = async () => ({
      beginTransaction: async () => {},
      query: async (sql) => {
        if (sql.includes('SELECT sku FROM VARIANT')) {
          return [[{ sku: 'SKU-EXISTING-123' }]];
        }
        return [[]];
      },
      rollback: async () => {},
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/admin/products',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        productName: 'Gaming Mouse',
        categoryIds: [1],
        variants: [
          { sku: 'SKU-EXISTING-123', variantName: 'Black RGB', price: 49.99, stockQuantity: 10 },
        ],
      },
    });
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.error.code, 'SKU_TAKEN');
  });

  await t.test('POST /api/v1/admin/products creates product, categories and variants atomically', async () => {
    let nextInsertId = 100;
    pool.getConnection = async () => ({
      beginTransaction: async () => {},
      query: async (sql) => {
        if (sql.includes('SELECT sku FROM VARIANT')) return [[]];
        if (sql.includes('INSERT INTO PRODUCT ')) return [{ insertId: 55 }];
        if (sql.includes('INSERT INTO VARIANT')) return [{ insertId: nextInsertId++ }];
        return [[]];
      },
      commit: async () => {},
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'POST',
      path: '/api/v1/admin/products',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        productName: 'Pixel 9',
        description: 'Google flagship smartphone',
        brand: 'Google',
        categoryIds: [1, 2],
        variants: [
          { sku: 'PIX9-BLK-128', variantName: 'Obsidian 128GB', price: 799.00, stockQuantity: 25 },
          { sku: 'PIX9-WHT-256', variantName: 'Porcelain 256GB', price: 899.00, stockQuantity: 15 },
        ],
      },
    });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.productId, 55);
    assert.deepEqual(res.body.data.variantIds, [100, 101]);
  });

  await t.test('PUT /api/v1/admin/variants/:variantId returns 404 for missing variant', async () => {
    pool.getConnection = async () => ({
      query: async () => [[]],
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'PUT',
      path: '/api/v1/admin/variants/9999',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { price: 120.00 },
    });
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  await t.test('PUT /api/v1/admin/variants/:variantId updates variant attributes and returns updated object', async () => {
    pool.getConnection = async () => ({
      query: async (sql) => {
        if (sql.includes('WHERE variant_id = ?') && !sql.includes('UPDATE')) {
          return [
            [
              {
                variantId: 10,
                sku: 'SKU-10',
                variantName: 'Updated Name',
                price: '299.99',
                status: 'ACTIVE',
                colour: 'Silver',
                memorySize: '256GB',
              },
            ],
          ];
        }
        return [{ affectedRows: 1 }];
      },
      release: () => {},
    });

    const res = await makeRequest(app, {
      method: 'PUT',
      path: '/api/v1/admin/variants/10',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { variantName: 'Updated Name', price: 299.99, status: 'ACTIVE' },
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, {
      variantId: 10,
      sku: 'SKU-10',
      variantName: 'Updated Name',
      price: 299.99,
      status: 'ACTIVE',
      colour: 'Silver',
      memorySize: '256GB',
    });
  });
});
