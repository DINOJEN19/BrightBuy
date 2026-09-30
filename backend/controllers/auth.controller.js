// controllers/auth.controller.js
// Thin HTTP layer — validates shape, calls the service, formats the response.
// No business logic or password handling here (those live in auth.service.js).

'use strict';

const authService = require('../services/auth.service');

/**
 * POST /api/v1/auth/register
 * Body: { fullName, email, password, phone, address, city }
 * Success: 201 { data: { customerId, email } }
 */
exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({ data: result });
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') {
      return res.status(409).json({
        error: { code: 'EMAIL_TAKEN', message: err.message },
      });
    }
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Success: 200 { data: { token, expiresIn, customer } }
 */
exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({ data: result });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: err.message },
      });
    }
    next(err);
  }
};


exports.logout = async (req, res, next) => {
  try {
    // Client is responsible for discarding the token.
    // Optional: add token to a server-side blacklist stored in Redis/DB here.
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};
