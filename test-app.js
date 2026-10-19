import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';

import authRoutes from './auth/routes.js';
import { OracleService } from './oracle.js';
import { basicAuth, jwtAuth, optionalAuth } from './auth/middleware.js';
import { AIAssistant } from './ai-assistant.js';
import { Blockchain } from './blockchain.js';
import { AetheronWebSocket } from './websocket.js';

// ES Module __dirname workaround
const __dirname = process.cwd();

// Import new feature modules
import { AccountAbstraction } from './account-abstraction.js';
import FiatOnRamp from './fiat-onramp.js';
import { LimitOrderManager } from './limit-orders.js';
import { RWATokenization } from './rwa-tokenization.js';
import L2Integration from './l2-integration.js';

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:3000'];

// Initialize new feature modules
const accountAbstraction = new AccountAbstraction();
const fiatOnRamp = new FiatOnRamp();
const limitOrders = new LimitOrderManager();
const rwaTokenization = new RWATokenization();
const l2Integration = new L2Integration();

// Middleware
app.use(express.json({ limit: '10mb' }));

// JSON parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});
// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Serve static files (CSS, JS, etc.)
app.use(express.static(__dirname, { index: false }));

// Rate limiting (simplified for tests)
const rateLimiter = (req, res, next) => {
  next();
};

app.use(rateLimiter);

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

// Compatibility health endpoint for integration clients.
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Newsletter subscription mirrors server.js (validation + per-IP rate limit),
// but keeps subscribers in memory so tests never write to the data directory.
const newsletterSubscribers = new Set();
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
  const email = req.body?.email;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }
  if (!checkNewsletterRateLimit(req.ip)) {
    return res.status(429).json({ success: false, error: 'Too many requests, try again later' });
  }
  const normalizedEmail = email.toLowerCase();
  if (newsletterSubscribers.has(normalizedEmail)) {
    return res.json({ success: true, message: 'Already subscribed!' });
  }
  newsletterSubscribers.add(normalizedEmail);
  return res.json({ success: true, message: 'Successfully subscribed!' });
});

// AI assistant routes use the same AIAssistant as server.js. Without
// OPENAI_API_KEY it answers through its built-in intent handlers (no external
// provider is called); with a key it uses the configured provider.
const aiAssistant = new AIAssistant(new Blockchain(), null);

app.post('/api/ai/query', optionalAuth, async (req, res) => {
  const query = req.body?.query;
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }
  if (query.length > 1000) {
    return res.status(400).json({ success: false, error: 'Query is too long' });
  }
  try {
    const response = await aiAssistant.query(query);
    return res.json({ success: true, response });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'AI assistant error' });
  }
});

app.get('/api/ai/history', optionalAuth, (req, res) => {
  res.json({ success: true, history: aiAssistant.getHistory(20) });
});

app.post('/api/ai/clear', optionalAuth, (req, res) => {
  aiAssistant.clearHistory();
  res.json({ success: true, message: 'History cleared' });
});

// Oracle routes use the existing CoinGecko-backed service; no synthetic prices.
const oracleService = new OracleService();
app.get('/api/oracle/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(symbol))
    return res.status(400).json({ success: false, error: 'Invalid symbol' });
  try {
    const price = await oracleService.getTokenPrice(symbol);
    if (!Number.isFinite(price) || price <= 0)
      return res.status(503).json({ success: false, error: 'Price unavailable' });
    return res.json({ success: true, symbol, price });
  } catch (error) {
    return res.status(503).json({ success: false, error: 'Price unavailable' });
  }
});
app.get('/api/oracle/prices', async (req, res) => {
  const symbols =
    typeof req.query.symbols === 'string'
      ? req.query.symbols.split(',').map((s) => s.trim().toUpperCase())
      : [];
  if (!symbols.length || symbols.length > 20 || symbols.some((s) => !/^[A-Z0-9]{2,12}$/.test(s))) {
    return res.status(400).json({ success: false, error: 'Invalid symbols' });
  }
  try {
    const prices = await oracleService.getMultiplePrices(symbols);
    if (symbols.some((symbol) => !Number.isFinite(prices[symbol]) || prices[symbol] <= 0)) {
      return res.status(503).json({ success: false, error: 'Prices unavailable' });
    }
    return res.json({ success: true, prices });
  } catch (error) {
    return res.status(503).json({ success: false, error: 'Prices unavailable' });
  }
});
app.get('/api/oracle/trending', async (req, res) => {
  try {
    const coins = await oracleService.getTrendingCoins();
    if (!coins.length)
      return res.status(503).json({ success: false, error: 'Trending data unavailable' });
    return res.json({ success: true, coins });
  } catch (error) {
    return res.status(503).json({ success: false, error: 'Trending data unavailable' });
  }
});

// Routes
app.get('/', (req, res) => {
  // Serve the actual admin dashboard HTML for E2E tests
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Admin endpoints (protected with Basic Auth for legacy compatibility)
app.get('/users', basicAuth, async (req, res) => {
  try {
    // Mock response for tests
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users/add', basicAuth, async (req, res) => {
  try {
    // Mock response for tests
    res.json({ success: true, user: { id: '123', ...req.body } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users/role', basicAuth, async (req, res) => {
  try {
    // Mock response for tests
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logs endpoint
app.get('/logs', basicAuth, async (req, res) => {
  try {
    // Mock response for tests
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logs', optionalAuth, async (req, res) => {
  try {
    // Mock response for tests
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint
app.get('/stats', basicAuth, async (req, res) => {
  try {
    // Mock response for tests
    res.json({
      totalUsers: 0,
      totalTransactions: 0,
      totalVolume: '0M AETH',
      networkStatus: 'Healthy',
      websocketConnections: 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API status endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Multichain endpoints
app.get('/multichain/chains', (req, res) => {
  res.json([
    { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 42161, name: 'Arbitrum One', symbol: 'ETH' }
  ]);
});

app.get('/multichain/config/:chain', (req, res) => {
  const chainId = parseInt(req.params.chain);
  if (chainId === 1 || req.params.chain.toLowerCase() === 'ethereum') {
    res.json({
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      blockExplorer: 'https://etherscan.io'
    });
  } else {
    res.status(404).json({ error: 'Chain not found' });
  }
});

// Account Abstraction endpoints
app.post('/api/aa/create-account', jwtAuth, async (req, res) => {
  try {
    const result = await accountAbstraction.createSmartAccount(req.body.provider, req.body.profile);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/aa/create-session', jwtAuth, async (req, res) => {
  try {
    const result = await accountAbstraction.createSessionKey(
      req.body.accountAddress,
      req.body.permissions
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/aa/execute', jwtAuth, async (req, res) => {
  try {
    const result = await accountAbstraction.executeWithSessionKey(
      req.body.sessionKey,
      req.body.transaction
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/aa/accounts', jwtAuth, (req, res) => {
  const accounts = accountAbstraction.getAllAccounts();
  res.json(accounts);
});

// Fiat on-ramp endpoints
app.post('/api/fiat/quote', async (req, res) => {
  try {
    const quote = await fiatOnRamp.getQuote(req.body);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fiat/buy', jwtAuth, async (req, res) => {
  try {
    const result = await fiatOnRamp.initiatePurchase(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fiat/transaction/:id', jwtAuth, (req, res) => {
  const transaction = fiatOnRamp.getTransactionStatus(req.params.id);
  res.json(transaction);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// WebSocket server attached to an HTTP server wrapping the app, as in server.js.
// The HTTP server is not started here; callers may listen on it if needed.
const httpServer = http.createServer(app);
const wsServer = new AetheronWebSocket(httpServer);

export { app, httpServer, wsServer };
export default app;
