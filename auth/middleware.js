const authService = require('./jwt-service');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Basic Authentication Middleware (for admin endpoints)
 */
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Aetheron Admin"');
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');

    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      req.user = { username: user, role: 'admin' };
      return next();
    }
  } catch (error) {
    // Invalid base64 or malformed header
  }

  res.set('WWW-Authenticate', 'Basic realm="Aetheron Admin"');
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
}

/**
 * JWT Authentication Middleware
 */
function jwtAuth(req, res, next) {
  try {
    const token = authService.extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Role-based authorization middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

/**
 * Optional authentication - adds user if token is valid but doesn't require it
 */
function optionalAuth(req, res, next) {
  try {
    const token = authService.extractToken(req.headers.authorization);

    if (token) {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
    }
  } catch (error) {
    // Token invalid but that's okay for optional auth
  }

  next();
}

module.exports = {
  basicAuth,
  jwtAuth,
  requireRole,
  optionalAuth
};
