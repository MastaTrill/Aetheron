import express from 'express';
import path from 'path';
import cors from 'cors';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AetheronWebSocket } from './websocket.js';
import 'dotenv/config';

// ES Module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database and Auth
import { sequelize, User, Log, Transaction } from './database/models.js';
import authRoutes from './auth/routes.js';
import { basicAuth, jwtAuth, requireRole, optionalAuth } from './auth/middleware.js';

// Import new feature modules
import { AccountAbstraction } from './account-abstraction.js';
import FiatOnRamp from './fiat-onramp.js';
import { LimitOrderManager } from './limit-orders.js';
import { RWATokenization } from './rwa-tokenization.js';
import L2Integration from './l2-integration.js';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:3000'];

const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new AetheronWebSocket(server);

// Initialize new feature modules
const accountAbstraction = new AccountAbstraction();
const fiatOnRamp = new FiatOnRamp();
const limitOrders = new LimitOrderManager();
const rwaTokenization = new RWATokenization();
const l2Integration = new L2Integration();

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

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Simple rate limiting (track requests per IP)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = NODE_ENV === 'production' ? 100 : 1000;

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
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }

  next();
};

app.use(rateLimiter);

// Test database connection on startup (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  sequelize.authenticate()
    .then(() => console.log('✅ Database connected successfully'))
    .catch(err => console.error('❌ Database connection failed:', err.message));
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
    const totalVolume = await Transaction.sum('amount') || 0;

    res.json({
      totalUsers,
      totalTransactions,
      totalVolume: `${(totalVolume / 1e18).toFixed(2)}M AETH`,
      networkStatus: 'Healthy',
      websocketConnections: wsServer.getConnectionCount(),
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
app.use((err, req, res, _next) => {
  console.error(err.stack);

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Aetheron Platform - ${NODE_ENV.toUpperCase()} Mode`);
  console.log('='.repeat(60));
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔐 Auth: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD === 'admin123' ? '⚠️  DEFAULT PASSWORD' : '✓ Custom'}`);
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

  if (NODE_ENV === 'production' && ADMIN_PASSWORD === 'admin123') {
    console.warn('⚠️  WARNING: Using default admin password in production!');
    console.warn('⚠️  Set ADMIN_PASSWORD environment variable immediately!');
  }

  // Notify about server start
  wsServer.notifySystemAlert('success', 'Server started successfully', { port: PORT });
});

export { app, wsServer };
