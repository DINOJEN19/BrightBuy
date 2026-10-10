// services/reports.service.js
// Business & database access layer for Person 5 management reports.
// Owned by Person 5.
//
// NOTE: Queries are optimized to leverage the indexes created in Task 5
// (05_reports_indexes.sql) on CUSTOMER_ORDER, ORDER_ITEM, VARIANT, PAYMENT, and DELIVERY.

'use strict';

const pool = require('../config/db');

/**
 * Report 1: Quarterly Sales Report for a given year (REQ-9.1).
 * Calls sp_QuarterlySalesReport or falls back to direct indexed query.
 *
 * @param {{ year?: number|string }} params
 * @returns {Promise<Array<{ quarter: string, totalSales: number, orderCount?: number }>>}
 */
async function getQuarterlySales({ year } = {}) {
  const targetYear = parseInt(year, 10) || new Date().getFullYear();
  const conn = await pool.getConnection();

  try {
    let rows;
    try {
      const [procRows] = await conn.query('CALL sp_QuarterlySalesReport(?)', [targetYear]);
      rows = Array.isArray(procRows[0]) ? procRows[0] : procRows;
    } catch {
      // Fallback query matching 05_reports_indexes.sql
      const [queryRows] = await conn.query(
        `SELECT
           QUARTER(order_date) AS sales_quarter,
           COUNT(*) AS order_count,
           SUM(total_amount) AS total_sales
         FROM CUSTOMER_ORDER
         WHERE YEAR(order_date) = ?
         GROUP BY QUARTER(order_date)
         ORDER BY sales_quarter`,
        [targetYear]
      );
      rows = queryRows;
    }

    return rows.map((r) => {
      const qNum = r.sales_quarter;
      const quarterLabel = typeof qNum === 'number'
        ? `Q${qNum}`
        : (String(qNum || '').startsWith('Q') ? qNum : `Q${qNum}`);

      return {
        quarter: quarterLabel,
        totalSales: parseFloat(r.total_sales ?? r.totalSales ?? 0),
        orderCount: r.order_count != null ? parseInt(r.order_count, 10) : undefined,
      };
    });
  } finally {
    conn.release();
  }
}

/**
 * Report 2: Top-Selling Products Report for a given date range (REQ-9.2).
 * Calls sp_TopSellingProducts or falls back to direct query.
 *
 * @param {{ from?: string, to?: string, limit?: number|string }} params
 * @returns {Promise<Array<{ productId: number, productName: string, unitsSold: number, revenue: number }>>}
 */
async function getTopSellingProducts({ from, to, limit } = {}) {
  const startDate = from && from.trim() ? from.trim() : '1970-01-01';
  const endDate = to && to.trim() ? to.trim() : '2099-12-31';
  let topN = parseInt(limit, 10);
  if (!Number.isInteger(topN) || topN <= 0) topN = 10;
  if (topN > 100) topN = 100;

  const conn = await pool.getConnection();
  try {
    let rows;
    try {
      const [procRows] = await conn.query(
        'CALL sp_TopSellingProducts(?, ?, ?)',
        [startDate, endDate, topN]
      );
      rows = Array.isArray(procRows[0]) ? procRows[0] : procRows;
    } catch {
      // Fallback query matching 05_reports_indexes.sql
      const [queryRows] = await conn.query(
        `SELECT
           p.product_id,
           p.product_name,
           SUM(oi.quantity) AS total_quantity_sold,
           SUM(oi.subtotal) AS total_revenue
         FROM ORDER_ITEM oi
         JOIN VARIANT v ON oi.variant_id = v.variant_id
         JOIN PRODUCT p ON v.product_id = p.product_id
         JOIN CUSTOMER_ORDER co ON oi.order_id = co.order_id
         WHERE co.order_date >= ? AND co.order_date < DATE_ADD(?, INTERVAL 1 DAY)
         GROUP BY p.product_id, p.product_name
         ORDER BY total_quantity_sold DESC
         LIMIT ?`,
        [startDate, endDate, topN]
      );
      rows = queryRows;
    }

    return rows.map((r) => ({
      productId: r.product_id ?? r.productId,
      productName: r.product_name ?? r.productName,
      unitsSold: parseInt(r.total_quantity_sold ?? r.unitsSold ?? 0, 10),
      revenue: parseFloat(r.total_revenue ?? r.revenue ?? 0),
    }));
  } finally {
    conn.release();
  }
}

/**
 * Report 3: Category-wise Order Count (REQ-9.3).
 * Queries vw_category_order_count or direct calculation.
 *
 * @returns {Promise<Array<{ categoryId: number, categoryName: string, orderCount: number }>>}
 */
async function getCategoryOrderCounts() {
  const conn = await pool.getConnection();
  try {
    let rows;
    try {
      const [viewRows] = await conn.query(
        `SELECT category_id, category_name, order_count
         FROM vw_category_order_count
         ORDER BY order_count DESC, category_name ASC`
      );
      rows = viewRows;
    } catch {
      // Direct query from schema
      const [queryRows] = await conn.query(
        `SELECT
           c.category_id,
           c.category_name,
           COUNT(DISTINCT oi.order_id) AS order_count
         FROM CATEGORY c
         JOIN PRODUCT_CATEGORY pc ON pc.category_id = c.category_id
         JOIN PRODUCT p ON p.product_id = pc.product_id
         JOIN VARIANT v ON v.product_id = p.product_id
         JOIN ORDER_ITEM oi ON oi.variant_id = v.variant_id
         GROUP BY c.category_id, c.category_name
         ORDER BY order_count DESC, c.category_name ASC`
      );
      rows = queryRows;
    }

    return rows.map((r) => ({
      categoryId: r.category_id ?? r.categoryId,
      categoryName: r.category_name ?? r.categoryName,
      orderCount: parseInt(r.order_count ?? r.orderCount ?? 0, 10),
    }));
  } finally {
    conn.release();
  }
}

/**
 * Report 4: Delivery Time Estimates for upcoming undelivered orders (REQ-9.4).
 * Queries vw_delivery_estimates or direct query on DELIVERY table.
 *
 * @returns {Promise<Array<{ orderId: number, destinationCity: string, estimatedDeliveryDate: string, deliveryStatus: string }>>}
 */
async function getDeliveryEstimates() {
  const conn = await pool.getConnection();
  try {
    let rows;
    try {
      const [viewRows] = await conn.query(
        `SELECT order_id, destination_city, estimated_delivery_date, delivery_status
         FROM vw_delivery_estimates
         ORDER BY estimated_delivery_date ASC`
      );
      rows = viewRows;
    } catch {
      const [queryRows] = await conn.query(
        `SELECT
           order_id,
           destination_city,
           estimated_delivery_date,
           delivery_status
         FROM DELIVERY
         WHERE delivery_status <> 'DELIVERED'
         ORDER BY estimated_delivery_date ASC`
      );
      rows = queryRows;
    }

    return rows.map((r) => {
      let estDate = r.estimated_delivery_date ?? r.estimatedDeliveryDate;
      if (estDate instanceof Date) {
        estDate = estDate.toISOString().slice(0, 10);
      } else if (typeof estDate === 'string') {
        estDate = estDate.slice(0, 10);
      }

      return {
        orderId: r.order_id ?? r.orderId,
        destinationCity: r.destination_city ?? r.destinationCity,
        estimatedDeliveryDate: estDate,
        deliveryStatus: r.delivery_status ?? r.deliveryStatus,
      };
    });
  } finally {
    conn.release();
  }
}

/**
 * Report 5: Customer-wise Order Summary with payment status (REQ-9.5).
 * Grouped by customer_id.
 *
 * @returns {Promise<Array<{ customerId: number, fullName: string, orders: Array<{ orderId: number, totalAmount: number, paymentStatus: string }> }>>}
 */
async function getCustomerSummary() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT
         cu.customer_id,
         cu.full_name,
         co.order_id,
         co.total_amount,
         p.payment_status
       FROM CUSTOMER cu
       JOIN CUSTOMER_ORDER co ON co.customer_id = cu.customer_id
       LEFT JOIN PAYMENT p ON p.order_id = co.order_id
       ORDER BY cu.customer_id ASC, co.order_date DESC, co.order_id DESC`
    );

    const customerMap = new Map();
    for (const r of rows) {
      const cid = r.customer_id;
      if (!customerMap.has(cid)) {
        customerMap.set(cid, {
          customerId: cid,
          fullName: r.full_name,
          orders: [],
        });
      }

      if (r.order_id != null) {
        customerMap.get(cid).orders.push({
          orderId: r.order_id,
          totalAmount: parseFloat(r.total_amount || 0),
          paymentStatus: r.payment_status || 'PENDING',
        });
      }
    }

    return Array.from(customerMap.values());
  } finally {
    conn.release();
  }
}

module.exports = {
  getQuarterlySales,
  getTopSellingProducts,
  getCategoryOrderCounts,
  getDeliveryEstimates,
  getCustomerSummary,
};
