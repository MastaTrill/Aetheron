// Integration tests for core API endpoints
import request from 'supertest';

describe('Core API Integration Tests', () => {
  const authHeader = 'Basic ' + Buffer.from('admin:admin123').toString('base64');

  describe('GET /api', () => {
    test('should return API status', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/api');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.version).toBeTruthy();
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('GET /health', () => {
    test('should return health check', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('Authentication', () => {
    test('should reject unauthenticated stats request', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/stats');
      expect(res.status).toBe(401);
    });

    test('should accept valid credentials', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/stats').set('Authorization', authHeader);
      expect([200, 503]).toContain(res.status);
    });
  });

  describe('GET /multichain/chains', () => {
    test('should return supported chains', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/multichain/chains');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /multichain/config/:chain', () => {
    test('should return ethereum config', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/multichain/config/ethereum');
      expect(res.status).toBe(200);
      expect(res.body.chainId).toBe(1);
    });

    test('should return 404 for invalid chain', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/multichain/config/invalid');
      expect(res.status).toBe(404);
    });
  });

  describe('Newsletter', () => {
    test('should subscribe with valid email', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'test@example.com' });
      expect([200, 429]).toContain(res.status);
    });

    test('should reject invalid email', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'invalid-email' });
      expect(res.status).toBe(400);
    });
  });
});

describe('WebSocket Connection Tests', () => {
  test('should have WebSocket server available', async () => {
    const { wsServer } = await import('../../test-app.js');
    expect(wsServer).toBeDefined();
    expect(typeof wsServer.getConnectionCount).toBe('function');
  });
});
