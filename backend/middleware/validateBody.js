// middleware/validateBody.js
// Owned by Person 1 — consumed by all route modules.
// Factory that returns an Express middleware validating req.body against a Joi schema.
// Any validation failure is short-circuited with a 400 VALIDATION_ERROR before reaching
// the controller, so controllers can assume req.body is clean.

'use strict';

const Joi = require('joi');

/**
 * validateBody(schema)
 * @param {Joi.ObjectSchema} schema  A Joi schema describing the expected request body.
 * @returns Express middleware
 *
 * Usage:
 *   const { validateBody } = require('../middleware/validateBody');
 *   router.post('/register', validateBody(registerSchema), ctrl.register);
 */
function validateBody(schema) {
  return function (req, res, next) {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,   // collect ALL validation errors, not just the first
      stripUnknown: true,  // silently drop unrecognised keys (safe default)
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: messages,
        },
      });
    }

    // Replace req.body with the sanitised (strip-unknown) value
    req.body = value;
    next();
  };
}

module.exports = { validateBody };
