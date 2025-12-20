// Integration tests for API endpoints
const request = require('supertest');
const { app } = require('../../server');

describe('API Integration Tests', () => {
  const authHeader = 'Basic ' + Buffer.from('admin:admin123').toString('base64');

  describe('Health & Status', () => {
    test('GET / should return dashboard HTML', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.type).toMatch(/html/);
    });

    test('GET /api should return API status', async () => {
      const res = await request(app).get('/api');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.version).toBeTruthy();
    });
  });

  describe('Authentication', () => {
    test('should require authentication for protected routes', async () => {
      const res = await request(app).get('/stats');
      expect(res.status).toBe(401);
    });

    test('should accept valid credentials', async () => {
      const res = await request(app).get('/stats').set('Authorization', authHeader);
      expect(res.status).toBe(200);
    });

    test('should reject invalid credentials', async () => {
      const badAuth = 'Basic ' + Buffer.from('wrong:wrong').toString('base64');
      const res = await request(app).get('/stats').set('Authorization', badAuth);
      expect(res.status).toBe(401);
    });
  });

  describe('Stats Endpoint', () => {
    test('GET /stats should return statistics', async () => {
      const res = await request(app).get('/stats').set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalTransactions');
      expect(res.body).toHaveProperty('websocketConnections');
    });
  });

  describe('User Management', () => {
    test('GET /users should return user list', async () => {
      const res = await request(app).get('/users').set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /users/add should add new user', async () => {
      const res = await request(app).post('/users/add').set('Authorization', authHeader).send({
        address: '0xtest123',
        balance: '1000 AETH'
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('POST /users/role should update user role', async () => {
      const res = await request(app).post('/users/role').set('Authorization', authHeader).send({
        address: '0x1234...5678',
        role: 'admin'
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Logs Endpoint', () => {
    test('GET /logs should return log entries', async () => {
      const res = await request(app).get('/logs').set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/logs should accept new log', async () => {
      const res = await request(app)
        .post('/api/logs')
        .send({
          time: new Date().toISOString(),
          type: 'INFO',
          details: { message: 'test log' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Multi-Chain Endpoints', () => {
    test('GET /multichain/chains should return supported chains', async () => {
      const res = await request(app).get('/multichain/chains');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /multichain/config/:chain should return chain config', async () => {
      const res = await request(app).get('/multichain/config/ethereum');

      expect(res.status).toBe(200);
      expect(res.body.chainId).toBe(1);
      expect(res.body.name).toBe('Ethereum Mainnet');
    });

    test('should return 404 for invalid chain', async () => {
      const res = await request(app).get('/multichain/config/invalid');
      expect(res.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
    });

    test('should handle malformed JSON', async () => {
      const res = await request(app)
        .post('/api/logs')
        .set('Content-Type', 'application/json')
        .send('invalid json{');

      expect(res.status).toBe(400);
    });
  });
});
