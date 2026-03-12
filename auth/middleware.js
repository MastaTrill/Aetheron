import authService from './jwt-service.js';
import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Warn if default credentials are used in production
if (process.env.NODE_ENV === 'production' && process.env.ADMIN_PASSWORD === undefined) {
  console.error('[SECURITY] ADMIN_PASSWORD not set — using insecure default. Set ADMIN_PASSWORD env var!');
}

// Constant-time comparison to prevent timing attacks
function safeCompare(a, b) {
  if (a.length !== b.length) {
    // Compare against self to burn same CPU time, then return false
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

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

    if (safeCompare(user, ADMIN_USERNAME) && safeCompare(pass, ADMIN_PASSWORD)) {
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

export { basicAuth, jwtAuth, requireRole, optionalAuth };
