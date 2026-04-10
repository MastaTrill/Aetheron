import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AetheronWebSocket } from './websocket.js';
import helmet from 'helmet';
import sanitizeHtml from 'sanitize-html';
import 'dotenv/config';

// ES Module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database and Auth
import { sequelize, User, Log, Transaction } from './database/models.js';
import authRoutes from './auth/routes.js';
import { basicAuth, jwtAuth, requireRole, optionalAuth } from './auth/middleware.js';

// Import new feature modules

import { createRequire } from 'module';
const requireCJS = createRequire(import.meta.url);
const {
  RealTimeMonitoringSystem,
  CrossChainMetricsSystem,
  UserBehaviorAnalyticsSystem,
  PredictiveMaintenanceSystem
} = requireCJS('./advanced-analytics.js');

import { AccountAbstraction } from './account-abstraction.js';
import FiatOnRamp from './fiat-onramp.js';
import { LimitOrderManager } from './limit-orders.js';
import { RWATokenization } from './rwa-tokenization.js';
import L2Integration from './l2-integration.js';

import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:3000', 'https://aetheron.online'];

// Validate admin credentials on startup
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('❌ ERROR: ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}

const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new AetheronWebSocket(server);

// Initialize new feature modules
const accountAbstraction = new AccountAbstraction();
const fiatOnRamp = new FiatOnRamp();
const limitOrders = new LimitOrderManager();
const rwaTokenization = new RWATokenization();
const l2Integration = new L2Integration();

// === Advanced Analytics Modules ===
const analyticsRealtime = new RealTimeMonitoringSystem({}, {});
const analyticsCrossChain = new CrossChainMetricsSystem({});
const analyticsUser = new UserBehaviorAnalyticsSystem();
const analyticsMaintenance = new PredictiveMaintenanceSystem();

// Start a default monitoring session for real-time analytics
let defaultMonitoringId;
analyticsRealtime.startMonitoring().then((monitoring) => {
  defaultMonitoringId = monitoring.id;
});

// === Analytics API Endpoints ===
// Real-time monitoring metrics
app.get('/api/analytics/realtime/metrics', basicAuth, (req, res) => {
  if (!defaultMonitoringId) return res.status(503).json({ error: 'Monitoring not started' });
  const metrics = analyticsRealtime.getLatestMetrics(defaultMonitoringId);
  res.json(metrics ? metrics : { error: 'No metrics available' });
});

// Real-time monitoring alerts
app.get('/api/analytics/realtime/alerts', basicAuth, (req, res) => {
  if (!defaultMonitoringId) return res.status(503).json({ error: 'Monitoring not started' });
  const alerts = analyticsRealtime.getActiveAlerts(defaultMonitoringId);
  res.json(alerts);
});

// Real-time system health
app.get('/api/analytics/realtime/health', basicAuth, (req, res) => {
  res.json(analyticsRealtime.getSystemHealth());
});

// Cross-chain metrics
app.get('/api/analytics/crosschain/metrics', basicAuth, async (req, res) => {
  const metrics = await analyticsCrossChain.collectCrossChainMetrics();
  res.json(metrics);
});

// Cross-chain analytics trends
app.get('/api/analytics/crosschain/analytics', basicAuth, (req, res) => {
  const { timeframe } = req.query;
  const result = analyticsCrossChain.getCrossChainAnalytics(Number(timeframe) || 24);
  res.json(result);
});

// Cross-chain bridge performance
app.get('/api/analytics/crosschain/bridges', basicAuth, (req, res) => {
  res.json(analyticsCrossChain.getBridgePerformance());
});

// Cross-chain transfer stats
app.get('/api/analytics/crosschain/transfers', basicAuth, (req, res) => {
  const { timeframe } = req.query;
  res.json(analyticsCrossChain.getTransferStatistics(Number(timeframe) || 24));
});

// User analytics (summary for a user)
app.get('/api/analytics/user/:userId', basicAuth, (req, res) => {
  const { userId } = req.params;
  res.json(analyticsUser.getUserAnalytics(userId));
});

// User segmentation
app.get('/api/analytics/user/segmentation', basicAuth, (req, res) => {
  res.json(analyticsUser.getUserSegmentation());
});

// Predictive maintenance recommendations
app.get('/api/analytics/maintenance/recommendations', basicAuth, (req, res) => {
  res.json(analyticsMaintenance.getMaintenanceRecommendations());
});

// Predictive maintenance component health
app.get('/api/analytics/maintenance/component/:componentId', basicAuth, (req, res) => {
  const { componentId } = req.params;
  res.json(analyticsMaintenance.getComponentHealthStatus(componentId));
});

// Middleware
// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else if (NODE_ENV === 'development') {
      callback(null, true); // Allow all in development
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj) return;
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeHtml(obj[key], {
          allowedTags: [],
          allowedAttributes: {},
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  next();
};

app.use(sanitizeInput);
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

app.use((req, res, next) => {
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  console.log(`[${req.id}] ${req.method} ${req.path}`);
  next();
});

// Simple rate limiting (track requests per IP)
const requestCounts = new Map();
const userRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000;
const USER_RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = NODE_ENV === 'production' ? 100 : 1000;
const MAX_USER_REQUESTS = NODE_ENV === 'production' ? 500 : 5000;

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW;
  } else {
    record.count++;
  }

  requestCounts.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ success: false, error: 'Too many requests, try again later' });
  }

  if (req.user?.id) {
    const userRecord = userRequestCounts.get(req.user.id) || { count: 0, resetTime: now + USER_RATE_LIMIT_WINDOW };
    if (now > userRecord.resetTime) {
      userRecord.count = 1;
      userRecord.resetTime = now + USER_RATE_LIMIT_WINDOW;
    } else {
      userRecord.count++;
    }
    userRequestCounts.set(req.user.id, userRecord);
    if (userRecord.count > MAX_USER_REQUESTS) {
      return res.status(429).json({ success: false, error: 'Too many requests, try again later' });
    }
  }

  next();
};

app.use(rateLimiter);

// Test database connection on startup (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  sequelize
    .authenticate()
    .then(() => console.log('✅ Database connected successfully'))
    .catch((err) => console.error('❌ Database connection failed:', err.message));
}

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Admin endpoints (protected with Basic Auth for legacy compatibility)
app.get('/users', basicAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users/add', basicAuth, async (req, res) => {
  try {
    const { address, balance } = req.body;
    const user = await User.create({
      address,
      balance: balance || '0',
      username: address.substring(0, 10),
      role: 'user'
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users/role', basicAuth, async (req, res) => {
  try {
    const { address, role } = req.body;
    const user = await User.findOne({ where: { address } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ role });

    await Log.create({
      type: 'INFO',
      details: { action: 'role_updated', address, role },
      userId: req.user?.id
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users/kyc', jwtAuth, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { address, kycStatus } = req.body;
    const user = await User.findOne({ where: { address } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ kycStatus });

    await Log.create({
      type: 'SUCCESS',
      details: { action: 'kyc_updated', address, kycStatus },
      userId: req.user.id
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logs endpoints
app.get('/logs', basicAuth, async (req, res) => {
  try {
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [{ model: User, as: 'user', attributes: ['username', 'address'], required: false }]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logs', optionalAuth, async (req, res) => {
  try {
    const logEntry = req.body;
    const log = await Log.create({
      type: logEntry.type,
      details: logEntry.details,
      userId: req.user?.id
    });

    // Broadcast log to WebSocket clients
    wsServer.broadcast(
      {
        type: 'newLog',
        log: log,
        timestamp: new Date().toISOString()
      },
      'dashboard'
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint
app.get('/stats', basicAuth, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalTransactions = await Transaction.count();
    const totalVolume = (await Transaction.sum('amount')) || 0;
    const aiStats = aiAssistant.getStats();

    res.json({
      totalUsers,
      totalTransactions,
      totalVolume: `${(totalVolume / 1e18).toFixed(2)}M AETH`,
      networkStatus: 'Healthy',
      websocketConnections: wsServer.getConnectionCount(),
      aiStats: {
        totalQueries: aiStats.totalQueries,
        gptQueries: aiStats.gptQueries,
        fallbackQueries: aiStats.fallbackQueries
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Education endpoint
app.get('/education/:address', jwtAuth, (req, res) => {
  res.json({
    address: req.params.address,
    coursesCompleted: Math.floor(Math.random() * 10),
    certificates: ['Blockchain Basics', 'DeFi Fundamentals']
  });
});

// API status
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// AI Assistant endpoint
import { AIAssistant } from './ai-assistant.js';
import { Blockchain } from './blockchain.js';

const blockchain = new Blockchain();
const aiAssistant = new AIAssistant(blockchain, null);

const aiRateLimit = new Map();
const oracleRateLimit = new Map();
const AI_RATE_LIMIT = 30;
const ORACLE_RATE_LIMIT = 60;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(map, key, limit) {
  const now = Date.now();
  const record = map.get(key);
  if (!record || now > record.resetTime) {
    map.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

app.post('/api/ai/query', optionalAuth, async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(aiRateLimit, clientIp, AI_RATE_LIMIT)) {
    return res.status(429).json({ success: false, error: 'Too many AI requests, try again later' });
  }

  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    if (query.length > 1000) {
      return res.status(400).json({ success: false, error: 'Query too long (max 1000 chars)' });
    }
    const response = await aiAssistant.query(query);
    res.json({ success: true, response });
  } catch (error) {
    console.error('[AI] Query error:', error);
    res.status(500).json({ success: false, error: 'AI assistant error' });
  }
});

app.get('/api/ai/history', optionalAuth, (req, res) => {
  const history = aiAssistant.getHistory(20);
  res.json({ success: true, history });
});

app.post('/api/ai/clear', optionalAuth, (req, res) => {
  aiAssistant.clearHistory();
  res.json({ success: true, message: 'History cleared' });
});

app.get('/api/ai/suggestions', optionalAuth, (req, res) => {
  const suggestions = aiAssistant.suggestActions();
  res.json({ success: true, suggestions });
});

app.get('/api/ai/stats', basicAuth, (req, res) => {
  const stats = aiAssistant.getStats();
  res.json({ success: true, stats });
});

// Oracle/Price Feed endpoints
import { OracleService } from './oracle.js';
const oracleService = new OracleService();

app.get('/api/oracle/price/:symbol', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(oracleRateLimit, clientIp, ORACLE_RATE_LIMIT)) {
    return res.status(429).json({ success: false, error: 'Too many requests, try again later' });
  }

  try {
    const { symbol } = req.params;
    const price = await oracleService.getTokenPrice(symbol.toUpperCase());
    res.json({ success: true, symbol: symbol.toUpperCase(), price, currency: 'USD' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/oracle/prices', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(oracleRateLimit, clientIp, ORACLE_RATE_LIMIT)) {
    return res.status(429).json({ success: false, error: 'Too many requests, try again later' });
  }

  try {
    const symbols = (req.query.symbols || 'ETH,BTC,AETH').split(',');
    const prices = await oracleService.getMultiplePrices(symbols.map(s => s.trim().toUpperCase()));
    res.json({ success: true, prices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/oracle/market/:symbol', async (req, res) => {
  try {
    const data = await oracleService.getMarketData(req.params.symbol);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/oracle/trending', async (req, res) => {
  try {
    const coins = await oracleService.getTrendingCoins();
    res.json({ success: true, coins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multichain endpoints
import { MultiChainIntegration } from './multichain.js';
const multichain = new MultiChainIntegration();

app.get('/multichain/chains', (req, res) => {
  try {
    const chains = multichain.getSupportedChains();
    res.json(chains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/multichain/config/:chain', (req, res) => {
  const config = multichain.getChainConfig(req.params.chain);
  if (!config) {
    return res.status(404).json({ error: `Chain config not found for '${req.params.chain}'` });
  }
  res.json(config);
});

// Health check endpoint (for Railway and monitoring)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Newsletter subscribers (persistent)
const SUBSCRIBERS_FILE = path.join(__dirname, 'data', 'subscribers.json');

function loadSubscribers() {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8')));
    }
  } catch (e) {
    console.error('Failed to load subscribers:', e.message);
  }
  return new Set();
}

function saveSubscribers(subscribers) {
  try {
    const dir = path.dirname(SUBSCRIBERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([...subscribers]));
  } catch (e) {
    console.error('Failed to save subscribers:', e.message);
  }
}

const subscribers = loadSubscribers();

const newsletterRateLimit = new Map();
const NEWSLETTER_RATE_LIMIT = 5;
const NEWSLETTER_WINDOW = 60 * 60 * 1000;

function checkNewsletterRateLimit(ip) {
  const now = Date.now();
  const record = newsletterRateLimit.get(ip);
  if (!record || now > record.resetTime) {
    newsletterRateLimit.set(ip, { count: 1, resetTime: now + NEWSLETTER_WINDOW });
    return true;
  }
  if (record.count >= NEWSLETTER_RATE_LIMIT) return false;
  record.count++;
  return true;
}

app.post('/api/newsletter/subscribe', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkNewsletterRateLimit(clientIp)) {
    return res.status(429).json({ success: false, error: 'Too many requests, try again later' });
  }

  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }
  const normalizedEmail = email.toLowerCase();
  if (subscribers.has(normalizedEmail)) {
    return res.json({ success: true, message: 'Already subscribed!' });
  }
  subscribers.add(normalizedEmail);
  saveSubscribers(subscribers);
  console.log(`📧 New newsletter subscriber: ${normalizedEmail}`);
  res.json({ success: true, message: 'Successfully subscribed!' });
});

// ===== Account Abstraction Endpoints =====
app.post('/api/aa/create-account', jwtAuth, async (req, res) => {
  const { provider, profile } = req.body;
  const result = await accountAbstraction.createSmartAccount(provider, profile);
  res.json(result);
});

app.post('/api/aa/create-session', jwtAuth, async (req, res) => {
  const { accountAddress, permissions } = req.body;
  const result = await accountAbstraction.createSessionKey(accountAddress, permissions);
  res.json(result);
});

app.post('/api/aa/execute', jwtAuth, async (req, res) => {
  const { sessionKey, transaction } = req.body;
  const result = await accountAbstraction.executeWithSessionKey(sessionKey, transaction);
  wsServer.notifySystemAlert('info', 'AA transaction executed', result);
  res.json(result);
});

app.get('/api/aa/accounts', jwtAuth, (req, res) => {
  const accounts = accountAbstraction.getAllAccounts();
  res.json({ success: true, accounts });
});

// ===== Fiat On-Ramp Endpoints =====
app.post('/api/fiat/quote', async (req, res) => {
  const { provider, fiatAmount, fiatCurrency, cryptoCurrency } = req.body;
  const result = await fiatOnRamp.getQuote(provider, fiatAmount, fiatCurrency, cryptoCurrency);
  res.json(result);
});

app.post('/api/fiat/buy', jwtAuth, async (req, res) => {
  const { provider, fiatAmount, fiatCurrency, cryptoCurrency, paymentMethod, recipient } = req.body;
  const result = await fiatOnRamp.buyCrypto(
    provider,
    fiatAmount,
    fiatCurrency,
    cryptoCurrency,
    paymentMethod,
    recipient
  );
  wsServer.notifySystemAlert('success', 'Fiat purchase initiated', result);
  res.json(result);
});

app.get('/api/fiat/transaction/:id', jwtAuth, (req, res) => {
  const result = fiatOnRamp.getTransactionStatus(req.params.id);
  res.json(result);
});

app.get('/api/fiat/providers', (req, res) => {
  const providers = fiatOnRamp.getSupportedProviders();
  res.json({ success: true, providers });
});

// ===== Limit Orders Endpoints =====
app.post('/api/orders/create', jwtAuth, async (req, res) => {
  const { type, pair, amount, price, stopPrice, expiresAt } = req.body;
  const result = await limitOrders.createOrder(type, pair, amount, price, stopPrice, expiresAt);
  wsServer.broadcast({ type: 'newOrder', order: result.order }, 'trading');
  res.json(result);
});

app.post('/api/orders/cancel/:orderId', jwtAuth, async (req, res) => {
  const result = await limitOrders.cancelOrder(req.params.orderId);
  res.json(result);
});

app.get('/api/orders/active', jwtAuth, (req, res) => {
  const orders = limitOrders.getActiveOrders();
  res.json({ success: true, orders });
});

app.get('/api/orders/:orderId', jwtAuth, (req, res) => {
  const order = limitOrders.getOrder(req.params.orderId);
  res.json(order ? { success: true, order } : { success: false, error: 'Order not found' });
});

// ===== RWA Tokenization Endpoints =====
app.post('/api/rwa/tokenize', jwtAuth, async (req, res) => {
  const { assetType, assetDetails, totalValue, tokenSupply, owner } = req.body;
  const result = await rwaTokenization.tokenizeAsset(
    assetType,
    assetDetails,
    totalValue,
    tokenSupply,
    owner
  );
  wsServer.notifySystemAlert('success', 'RWA asset tokenized', result);
  res.json(result);
});

app.post('/api/rwa/transfer', jwtAuth, async (req, res) => {
  const { tokenId, from, to, amount } = req.body;
  const result = await rwaTokenization.transferTokens(tokenId, from, to, amount);
  res.json(result);
});

app.get('/api/rwa/assets', jwtAuth, (req, res) => {
  const assets = rwaTokenization.getAllAssets();
  res.json({ success: true, assets });
});

app.get('/api/rwa/asset/:tokenId', jwtAuth, (req, res) => {
  const asset = rwaTokenization.getAsset(req.params.tokenId);
  res.json(asset ? { success: true, asset } : { success: false, error: 'Asset not found' });
});

// ===== L2 Integration Endpoints =====
app.post('/api/l2/deposit', jwtAuth, async (req, res) => {
  const { network, token, amount, recipient } = req.body;
  const result = await l2Integration.depositToL2(network, token, amount, recipient);
  wsServer.notifySystemAlert('info', 'L2 deposit initiated', result);
  res.json(result);
});

app.post('/api/l2/withdraw', jwtAuth, async (req, res) => {
  const { network, token, amount, recipient } = req.body;
  const result = await l2Integration.withdrawToL1(network, token, amount, recipient);
  wsServer.notifySystemAlert('info', 'L2 withdrawal initiated', result);
  res.json(result);
});

app.post('/api/l2/bridge', jwtAuth, async (req, res) => {
  const { fromNetwork, toNetwork, token, amount, recipient } = req.body;
  const result = await l2Integration.bridgeBetweenL2s(
    fromNetwork,
    toNetwork,
    token,
    amount,
    recipient
  );
  res.json(result);
});

app.get('/api/l2/networks', (req, res) => {
  const networks = l2Integration.getSupportedNetworks();
  res.json({ success: true, networks });
});

app.get('/api/l2/deposit/:id', jwtAuth, (req, res) => {
  const result = l2Integration.getDepositStatus(req.params.id);
  res.json(result);
});

app.get('/api/l2/withdrawal/:id', jwtAuth, (req, res) => {
  const result = l2Integration.getWithdrawalStatus(req.params.id);
  res.json(result);
});

// Blockchain endpoint
app.get('/chain', jwtAuth, (req, res) => {
  res.json({
    height: Math.floor(Math.random() * 1000000),
    hash: '0x' + Math.random().toString(16).substr(2, 64),
    transactions: Math.floor(Math.random() * 1000)
  });
});

// React app fallback - serve index.html for client-side routes only (not API routes)
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use((err, req, res, _next) => {
  console.error('Error:', err.message);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Invalid JSON' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: err.message });
  }

  res.status(500).json({ success: false, error: 'Internal server error' });
});

function cleanupRateLimitMaps() {
  const now = Date.now();
  for (const [key, record] of requestCounts) {
    if (now > record.resetTime + RATE_LIMIT_WINDOW) requestCounts.delete(key);
  }
  for (const [key, record] of userRequestCounts) {
    if (now > record.resetTime + USER_RATE_LIMIT_WINDOW) userRequestCounts.delete(key);
  }
  for (const [key] of newsletterRateLimit) {
    if (now > (newsletterRateLimit.get(key)?.resetTime || 0) + NEWSLETTER_WINDOW) {
      newsletterRateLimit.delete(key);
    }
  }
  for (const [key, record] of aiRateLimit) {
    if (now > record.resetTime + RATE_WINDOW) aiRateLimit.delete(key);
  }
  for (const [key, record] of oracleRateLimit) {
    if (now > record.resetTime + RATE_WINDOW) oracleRateLimit.delete(key);
  }
  console.log('[Cleanup] Rate limit maps cleaned');
}

setInterval(cleanupRateLimitMaps, 60 * 60 * 1000);

// Start server
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Aetheron Platform - ${NODE_ENV.toUpperCase()} Mode`);
  console.log('='.repeat(60));
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
  console.log(
    `🔐 Auth: ${ADMIN_USERNAME} / ${
      ADMIN_PASSWORD === 'admin123' ? '⚠️  DEFAULT PASSWORD' : '✓ Custom'
    }`
  );
  console.log(`🛡️  Rate limit: ${MAX_REQUESTS} req/min`);
  console.log(`🌍 CORS: ${ALLOWED_ORIGINS.length} allowed origin(s)`);
  console.log('='.repeat(60));
  console.log('✨ Enterprise Features:');
  console.log('   • Account Abstraction (ERC-4337)');
  console.log('   • Fiat On-Ramp Integration');
  console.log('   • Advanced Trading (Limit Orders)');
  console.log('   • RWA Tokenization');
  console.log('   • Layer 2 Integration');
  console.log('='.repeat(60));

  wsServer.notifySystemAlert('success', 'Server started successfully', { port: PORT });
});

export { app, wsServer };
