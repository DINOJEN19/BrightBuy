// routes/admin.routes.js
// Express routes for catalogue administration.
// Owned by Person 5.
//
// All routes in this module MUST be mounted behind requireRole('ADMIN') (REQ-9.6, Business Rule 5.5).

'use strict';

const router = require('express').Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');
const Joi=require('joi');
const {validateBody}=require('../middleware/validateBody');

// Enforce authentication and ADMIN role on all admin routes
router.use(authenticateJWT, requireRole('ADMIN'));

// POST /api/v1/admin/categories
router.post('/categories', adminController.createCategory);

// POST /api/v1/admin/products
router.post('/products', adminController.createProduct);

// PUT /api/v1/admin/variants/:variantId
router.put('/variants/:variantId', validateBody(Joi.object({variantName:Joi.string().trim().max(100),price:Joi.number().positive().max(99999999.99),status:Joi.string().valid('ACTIVE','DISCONTINUED')})), adminController.updateVariant);

module.exports = router;
