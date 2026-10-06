// controllers/reports.controller.js
// HTTP layer for Person 5 management report endpoints.
// Owned by Person 5.

'use strict';

const reportsService = require('../services/reports.service');

/**
 * GET /api/v1/reports/quarterly-sales?year=
 * Auth required: ADMIN
 * Success response: 200 { data: [ { quarter: 'Q1', totalSales } ] }
 */
exports.getQuarterlySales = async (req, res, next) => {
  try {
    const { year } = req.query;
    const data = await reportsService.getQuarterlySales({ year });
    return res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/reports/top-selling-products?from=&to=&limit=10
 * Auth required: ADMIN
 * Success response: 200 { data: [ { productId, productName, unitsSold, revenue } ] }
 */
exports.getTopSellingProducts = async (req, res, next) => {
  try {
    const { from, to, limit } = req.query;
    const data = await reportsService.getTopSellingProducts({ from, to, limit });
    return res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/reports/category-order-counts
 * Auth required: ADMIN
 * Success response: 200 { data: [ { categoryId, categoryName, orderCount } ] }
 */
exports.getCategoryOrderCounts = async (req, res, next) => {
  try {
    const data = await reportsService.getCategoryOrderCounts();
    return res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/reports/delivery-estimates
 * Auth required: ADMIN
 * Success response: 200 { data: [ { orderId, destinationCity, estimatedDeliveryDate, deliveryStatus } ] }
 */
exports.getDeliveryEstimates = async (req, res, next) => {
  try {
    const data = await reportsService.getDeliveryEstimates();
    return res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/reports/customer-summary
 * Auth required: ADMIN
 * Success response: 200 { data: [ { customerId, fullName, orders: [ { orderId, totalAmount, paymentStatus } ] } ] }
 */
exports.getCustomerSummary = async (req, res, next) => {
  try {
    const data = await reportsService.getCustomerSummary();
    return res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
};
