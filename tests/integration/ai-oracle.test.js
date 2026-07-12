// Integration tests for AI Assistant and Oracle endpoints
import request from 'supertest';

describe('AI Assistant Integration Tests', () => {
  const authHeader = 'Basic ' + Buffer.from('admin:admin123').toString('base64');

  describe('POST /api/ai/query', () => {
    test('should return 400 if query is missing', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).post('/api/ai/query').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should return 400 if query is too long', async () => {
      const { default: app } = await import('../../test-app.js');
      const longQuery = 'a'.repeat(1001);
      const res = await request(app).post('/api/ai/query').send({ query: longQuery });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('too long');
    });

    test('should return response for valid query', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).post('/api/ai/query').send({ query: 'What is the price of ETH?' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.response).toBeTruthy();
    });
  });

  describe('GET /api/ai/history', () => {
    test('should return conversation history', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/api/ai/history');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.history).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/ai/clear', () => {
    test('should clear conversation history', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).post('/api/ai/clear');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('Oracle Integration Tests', () => {
  describe('GET /api/oracle/price/:symbol', () => {
    test('should return price for valid symbol', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/api/oracle/price/ETH');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.symbol).toBe('ETH');
      expect(res.body.price).toBeDefined();
    });

    test('should handle invalid symbol', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/api/oracle/price/INVALID');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/oracle/prices', () => {
    test('should return multiple prices', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/api/oracle/prices?symbols=ETH,BTC');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.prices).toBeInstanceOf(Object);
    });
  });

  describe('GET /api/oracle/trending', () => {
    test('should return trending coins', async () => {
      const { default: app } = await import('../../test-app.js');
      const res = await request(app).get('/api/oracle/trending');
      expect([200, 500]).toContain(res.status);
    });
  });
});
