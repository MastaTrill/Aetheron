const express = require('express');
const authService = require('./jwt-service');
const { User, Log } = require('../database/models');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { address, email, username, password } = req.body;

    // Validate input
    if (!address || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Address, username, and password are required'
      });
    }

    // Check if user exists
    const existing = await User.findOne({
      where: {
        $or: [
          { address },
          { email: email || null },
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

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const user = await User.create({
      address,
      email,
      username,
      passwordHash,
      role: 'user',
      kycStatus: 'pending',
      isActive: true
    });

    // Log registration
    await Log.create({
      type: 'SUCCESS',
      details: {
        action: 'user_registered',
        username,
        address
      },
      userId: user.id
    });

    // Generate tokens
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
    const validPassword = await authService.comparePassword(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Log login
    await Log.create({
      type: 'INFO',
      details: {
        action: 'user_login',
        username
      },
      userId: user.id
    });

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

module.exports = router;
