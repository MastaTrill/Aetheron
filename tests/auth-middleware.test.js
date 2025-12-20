const { jwtAuth, requireRole, optionalAuth } = require('../auth/middleware');
const authService = require('../auth/jwt-service');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('jwtAuth', () => {
    it('should authenticate valid token', () => {
      const token = authService.generateToken({
        id: '123',
        address: '0xtest',
        role: 'user'
      });
      req.headers.authorization = `Bearer ${token}`;

      jwtAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeTruthy();
      expect(req.user.id).toBe('123');
    });

    it('should reject missing token', () => {
      jwtAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid.token';

      jwtAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access for authorized role', () => {
      req.user = { id: '123', role: 'admin' };
      const middleware = requireRole('admin', 'moderator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      req.user = { id: '123', role: 'user' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access for missing user', () => {
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });
  });

  describe('optionalAuth', () => {
    it('should add user for valid token', () => {
      const token = authService.generateToken({
        id: '123',
        role: 'user'
      });
      req.headers.authorization = `Bearer ${token}`;

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeTruthy();
    });

    it('should continue without user for invalid token', () => {
      req.headers.authorization = 'Bearer invalid';

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    it('should continue without user for missing token', () => {
      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });
  });
});
