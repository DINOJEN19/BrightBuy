// middleware/auth.js
// Owned by Person 1 — consumed (imported) by all other people's route modules.
// Exports: authenticateJWT, requireRole

'use strict';

const jwt = require('jsonwebtoken');

/**
 * authenticateJWT
 * Verifies the Bearer token present in the Authorization header.
 * On success, attaches the decoded payload to req.user:
 *   { customerId, role, iat, exp }
 * On failure, returns 401.
 */
function authenticateJWT(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Login required' },
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid' },
    });
  }
}

/**
 * requireRole(...roles)
 * Factory that returns middleware enforcing that req.user.role is one of the
 * allowed roles. Must be called AFTER authenticateJWT in the middleware chain.
 * Roles: 'CUSTOMER', 'WAREHOUSE_STAFF', 'ADMIN'
 *
 * Usage:
 *   router.post('/admin/something', authenticateJWT, requireRole('ADMIN'), ctrl.handler);
 *   router.post('/stock', authenticateJWT, requireRole('WAREHOUSE_STAFF', 'ADMIN'), ctrl.handler);
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Login required' },
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access restricted to: ${roles.join(', ')}`,
        },
      });
    }
    next();
  };
}

module.exports = { authenticateJWT, requireRole };
