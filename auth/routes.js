import express from 'express';
import { Op } from 'sequelize';
import authService from './jwt-service.js';
import { User, Log } from '../database/models.js';

const router = express.Router();

const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimit.get(key) || { count: 0, firstAttempt: now };
  
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimit.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  record.count++;
  rateLimit.set(key, record);
  return true;
}

function getRateLimitKey(req, identifier) {
  return `${identifier}:${req.ip}`;
}

function validateAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function validateEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

async function safeLog(type, details, userId = null) {
  try {
    await Log.create({ type, details, userId });
  } catch (e) {
    console.error('Logging failed:', e.message);
  }
}

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const rateKey = getRateLimitKey(req, 'register');
    if (!checkRateLimit(rateKey)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, try again later'
      });
    }

    const { address, email, username, password } = req.body;

    if (!address || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Address, username, and password are required'
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { address },
          ...(email ? [{ email }] : []),
          { username }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    const passwordHash = await authService.hashPassword(password);

    const user = await User.create({
      address,
      email,
      username,
      passwordHash,
      role: 'user',
      kycStatus: 'pending',
      isActive: true
    });

    await safeLog('SUCCESS', {
      action: 'user_registered',
      username,
      address
    }, user.id);

    const token = authService.generateToken({
      id: user.id,
      address: user.address,
      role: user.role
    });

    const refreshToken = authService.generateRefreshToken({
      id: user.id
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          address: user.address,
          username: user.username,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const rateKey = getRateLimitKey(req, 'login');
    if (!checkRateLimit(rateKey)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, try again later'
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { username } });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const validPassword = await authService.comparePassword(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    await user.update({ lastLogin: new Date() });

    await safeLog('INFO', {
      action: 'user_login',
      username
    }, user.id);

    // Generate tokens
    const token = authService.generateToken({
      id: user.id,
      address: user.address,
      role: user.role
    });

    const refreshToken = authService.generateRefreshToken({
      id: user.id
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          address: user.address,
          username: user.username,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus,
          balance: user.balance
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = authService.verifyToken(refreshToken);

    // Get user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Generate new access token
    const token = authService.generateToken({
      id: user.id,
      address: user.address,
      role: user.role
    });

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', async (req, res) => {
  try {
    const token = authService.extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = authService.verifyToken(token);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
