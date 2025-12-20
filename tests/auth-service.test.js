const authService = require('../auth/jwt-service');
const bcrypt = require('bcryptjs');

describe('AuthService', () => {
  const testPayload = {
    id: '123',
    address: '0xtest',
    role: 'user'
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = authService.generateToken(testPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should encode payload correctly', () => {
      const token = authService.generateToken(testPayload);
      const decoded = authService.verifyToken(token);
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.address).toBe(testPayload.address);
      expect(decoded.role).toBe(testPayload.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = authService.generateRefreshToken({ id: '123' });
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = authService.generateToken(testPayload);
      const decoded = authService.verifyToken(token);
      expect(decoded).toBeTruthy();
      expect(decoded.id).toBe(testPayload.id);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid.token.here');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxNjE2MTYxNjE3fQ.invalid';
      expect(() => {
        authService.verifyToken(expiredToken);
      }).toThrow();
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      const result = await authService.comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      const result = await authService.comparePassword('wrongPassword', hash);
      expect(result).toBe(false);
    });
  });

  describe('extractToken', () => {
    it('should extract token from Bearer header', () => {
      const token = 'abc123';
      const header = `Bearer ${token}`;
      const extracted = authService.extractToken(header);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = authService.extractToken(null);
      expect(extracted).toBeNull();
    });

    it('should return null for invalid format', () => {
      const extracted = authService.extractToken('InvalidFormat');
      expect(extracted).toBeNull();
    });

    it('should return null for wrong scheme', () => {
      const extracted = authService.extractToken('Basic abc123');
      expect(extracted).toBeNull();
    });
  });
});
