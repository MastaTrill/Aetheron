const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Mock data storage
let logs = [
  { time: new Date().toISOString(), type: 'INFO', details: { message: 'Server started', port: PORT } },
  { time: new Date().toISOString(), type: 'SUCCESS', details: { message: 'Database connected' } }
];

let users = [
  { address: '0x1234...5678', balance: '1000 AETH', role: 'user' },
  { address: '0xabcd...efgh', balance: '500 AETH', role: 'admin' }
];

let stats = {
  totalUsers: 1250,
  totalTransactions: 45623,
  totalVolume: '2.5M AETH',
  networkStatus: 'Healthy'
};

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [username, password] = credentials.split(':');
  
  // Simple authentication (admin:admin123)
  if (username === 'admin' && password === 'admin123') {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Stats endpoint
app.get('/stats', authMiddleware, (req, res) => {
  res.json(stats);
});

// Users endpoints
app.get('/users', authMiddleware, (req, res) => {
  res.json(users);
});

app.post('/users/add', authMiddleware, (req, res) => {
  const { address, balance } = req.body;
  users.push({ address, balance, role: 'user' });
  logs.push({
    time: new Date().toISOString(),
    type: 'INFO',
    details: { action: 'user_added', address, balance }
  });
  res.json({ success: true });
});

app.post('/users/role', authMiddleware, (req, res) => {
  const { address, role } = req.body;
  const user = users.find(u => u.address === address);
  if (user) {
    user.role = role;
    logs.push({
      time: new Date().toISOString(),
      type: 'INFO',
      details: { action: 'role_updated', address, role }
    });
  }
  res.json({ success: true });
});

app.post('/users/kyc', authMiddleware, (req, res) => {
  const { address, kyc } = req.body;
  const user = users.find(u => u.address === address);
  if (user) {
    user.kyc = kyc;
    logs.push({
      time: new Date().toISOString(),
      type: 'SUCCESS',
      details: { action: 'kyc_updated', address, kyc }
    });
  }
  res.json({ success: true });
});

// Logs endpoints
app.get('/logs', authMiddleware, (req, res) => {
  res.json(logs.slice(-50)); // Return last 50 logs
});

app.post('/api/logs', (req, res) => {
  const logEntry = req.body;
  logs.push(logEntry);
  res.json({ success: true });
});

// Reputation endpoint
app.get('/reputation/:address', authMiddleware, (req, res) => {
  res.json({
    address: req.params.address,
    reputation: Math.floor(Math.random() * 100),
    level: 'Trusted'
  });
});

// Education endpoint
app.get('/education/:address', authMiddleware, (req, res) => {
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

// Blockchain endpoint
app.get('/chain', authMiddleware, (req, res) => {
  res.json({
    height: Math.floor(Math.random() * 1000000),
    hash: '0x' + Math.random().toString(16).substr(2, 64),
    transactions: Math.floor(Math.random() * 1000)
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Aetheron Admin Dashboard Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
  console.log(`🔐 Login credentials: admin / admin123`);
  
  // Add startup log
  logs.push({
    time: new Date().toISOString(),
    type: 'SUCCESS',
    details: { message: 'Admin dashboard server started', port: PORT }
  });
});

module.exports = app;
