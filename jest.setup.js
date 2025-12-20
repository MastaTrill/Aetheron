// Jest setup file - runs before all tests
process.env.NODE_ENV = 'test';

// Mock database models
jest.mock('./database/models', () => {
  const mockUser = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: '123', address: '0xtest' }),
    count: jest.fn().mockResolvedValue(0)
  };

  const mockLog = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: '123' })
  };

  const mockTransaction = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: '123' }),
    count: jest.fn().mockResolvedValue(0),
    sum: jest.fn().mockResolvedValue(0)
  };

  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(),
    sync: jest.fn().mockResolvedValue(),
    define: jest.fn()
  };

  return {
    sequelize: mockSequelize,
    User: mockUser,
    Log: mockLog,
    Transaction: mockTransaction
  };
});
