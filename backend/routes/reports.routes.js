// routes/reports.routes.js
// Express routes for management reports.
// Owned by Person 5.
//
// All routes in this module MUST be mounted behind requireRole('ADMIN') (REQ-9.6, Business Rule 5.5).

'use strict';

const router = require('express').Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const reportsController = require('../controllers/reports.controller');

// Enforce authentication and ADMIN role on all report endpoints
router.use(authenticateJWT, requireRole('ADMIN'));

// GET /api/v1/reports/quarterly-sales
router.get('/quarterly-sales', reportsController.getQuarterlySales);

// GET /api/v1/reports/top-selling-products
router.get('/top-selling-products', reportsController.getTopSellingProducts);

// GET /api/v1/reports/category-order-counts
router.get('/category-order-counts', reportsController.getCategoryOrderCounts);

// GET /api/v1/reports/delivery-estimates
router.get('/delivery-estimates', reportsController.getDeliveryEstimates);

// GET /api/v1/reports/customer-summary
router.get('/customer-summary', reportsController.getCustomerSummary);

module.exports = router;
