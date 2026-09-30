// middleware/errorHandler.js
// Owned by Person 1 — mounted LAST in app.js so it catches errors from all routes.
// Maps MySQL SIGNAL SQLSTATE '45000' errors (business-rule violations from stored
// procedures and triggers) to HTTP 422, and everything else to HTTP 500.

'use strict';

/**
 * Centralized Express error-handling middleware.
 * Must have exactly 4 parameters so Express treats it as an error handler.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next  (required signature; never called)
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // MySQL SIGNAL from stored procedures / triggers (business-rule violations)
  if (err.sqlState === '45000') {
    return res.status(422).json({
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: err.sqlMessage || 'A business rule was violated.',
      },
    });
  }

  // Duplicate-entry constraint (e.g. unique email)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_ENTRY',
        message: err.sqlMessage || 'A duplicate entry was detected.',
      },
    });
  }

  // Unhandled / unexpected errors
  console.error('[ErrorHandler]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
}

module.exports = errorHandler;
