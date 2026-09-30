

'use strict';

const router = require('express').Router();
const Joi = require('joi');
const { authenticateJWT } = require('../middleware/auth');
const { validateBody } = require('../middleware/validateBody');
const ctrl = require('../controllers/auth.controller');

// --- Joi schemas -----------------------------------------------------------

const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().max(150).required(),
  password: Joi.string().min(8).max(72).required(), // bcrypt max is 72 bytes
  phone: Joi.string().max(20).optional().allow('', null),
  address: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// --- Routes ----------------------------------------------------------------

// POST /api/v1/auth/register  — no auth required (guest)
router.post('/register', validateBody(registerSchema), ctrl.register);

// POST /api/v1/auth/login  — no auth required (guest)
router.post('/login', validateBody(loginSchema), ctrl.login);

// POST /api/v1/auth/logout  — requires a valid JWT
router.post('/logout', authenticateJWT, ctrl.logout);

module.exports = router;
