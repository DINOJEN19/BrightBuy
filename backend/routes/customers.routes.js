

'use strict';

const router = require('express').Router();
const Joi = require('joi');
const { authenticateJWT } = require('../middleware/auth');
const { validateBody } = require('../middleware/validateBody');
const ctrl = require('../controllers/customers.controller');

// --- Joi schemas -----------------------------------------------------------

const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().max(20).optional().allow('', null),
  address: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
}).min(1); // at least one field must be provided

// --- Routes ----------------------------------------------------------------

// GET /api/v1/customers/me  — own profile
router.get('/me', authenticateJWT, ctrl.getMe);

// PUT /api/v1/customers/me  — update own profile
router.put('/me', authenticateJWT, validateBody(updateProfileSchema), ctrl.updateMe);

module.exports = router;
