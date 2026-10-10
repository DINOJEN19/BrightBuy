

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
        message: 'A record with these unique details already exists.',
      },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({error:{code:'INVALID_JSON',message:'The request body must be valid JSON.'}});
  }
  const status = err.status || {VALIDATION_ERROR:400, INVALID_QUANTITY:400, NOT_FOUND:404, FORBIDDEN:403}[err.code];
  if (status >= 400 && status < 500) return res.status(status).json({error:{code:err.code || 'REQUEST_ERROR',message:err.message}});

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
