// controllers/customers.controller.js
// HTTP layer for customer profile endpoints.

'use strict';

const customersService = require('../services/customers.service');

/**
 * GET /api/v1/customers/me
 * Auth required: Customer
 * Success: 200 { data: { customerId, fullName, email, phone, address, city } }
 */
exports.getMe = async (req, res, next) => {
  try {
    const profile = await customersService.getProfile(req.user.customerId);
    if (!profile) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Customer not found.' },
      });
    }
    return res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/customers/me
 * Auth required: Customer
 * Body: { fullName?, phone?, address?, city? }
 * Success: 200 { data: { ...updated profile } }
 */
exports.updateMe = async (req, res, next) => {
  try {
    const updated = await customersService.updateProfile(req.user.customerId, req.body);
    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
};
