// Unit tests for Analytics Engine
const path = require('path');
const { AnalyticsEngine } = require(path.join(__dirname, '../../analytics'));

describe('Analytics Engine', () => {
  let analytics;
  let mockBlockchain;

  beforeEach(() => {
    mockBlockchain = {
      chain: [
        { transactions: [{ hash: 'tx1', amount: 100, sender: 'addr1', receiver: 'addr2' }] },
        { transactions: [{ hash: 'tx2', amount: 200, sender: 'addr2', receiver: 'addr3' }] }
      ],
      getBalance: jest.fn()
    };
    analytics = new AnalyticsEngine(mockBlockchain);
  });

  describe('Transaction Analysis', () => {
    test('should analyze standard transaction', () => {
      const tx = {
        hash: '0x123',
        amount: 50,
        sender: 'addr1',
        receiver: 'addr2',
        timestamp: Date.now()
      };

      const result = analytics.analyzeTransaction(tx);

      expect(result).toHaveProperty('hash', tx.hash);
      expect(result).toHaveProperty('value', tx.amount);
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('risk');
      expect(result).toHaveProperty('timestamp');
    });

    test('should classify NFT mint transaction', () => {
      const tx = {
        hash: '0x123',
        amount: 0,
        data: 'mintNFT'
      };

      const type = analytics.classifyTransaction(tx);
      expect(type).toBe('NFT_MINT');
    });

    test('should classify DEX swap transaction', () => {
      const tx = {
        hash: '0x123',
        amount: 100,
        data: 'swapTokens'
      };

      const type = analytics.classifyTransaction(tx);
      expect(type).toBe('DEX_SWAP');
    });

    test('should classify large transfer', () => {
      const tx = {
        hash: '0x123',
        amount: 2000
      };

      const type = analytics.classifyTransaction(tx);
      expect(type).toBe('LARGE_TRANSFER');
    });

    test('should classify self transfer', () => {
      const tx = {
        hash: '0x123',
        amount: 100,
        sender: 'addr1',
        receiver: 'addr1'
      };

      const type = analytics.classifyTransaction(tx);
      expect(type).toBe('SELF_TRANSFER');
    });
  });

  describe('Risk Calculation', () => {
    test('should calculate low risk for normal transaction', () => {
      const tx = {
        hash: '0x123',
        amount: 100,
        sender: 'known-addr',
        receiver: 'addr2'
      };

      analytics.metrics.activeAddresses.add('known-addr');
      const risk = analytics.calculateRiskScore(tx);

      expect(risk).toBeLessThan(30);
    });

    test('should calculate high risk for large transaction', () => {
      const tx = {
        hash: '0x123',
        amount: 50000,
        sender: 'addr1',
        receiver: 'addr2'
      };

      const risk = analytics.calculateRiskScore(tx);
      expect(risk).toBeGreaterThan(25);
    });

    test('should increase risk for new addresses', () => {
      const tx = {
        hash: '0x123',
        amount: 100,
        sender: 'new-addr',
        receiver: 'addr2'
      };

      const risk = analytics.calculateRiskScore(tx);
      expect(risk).toBeGreaterThan(15);
    });
  });

  describe('Network Health', () => {
    test('should track active addresses', () => {
      const tx = {
        hash: '0x123',
        amount: 100,
        sender: 'addr1',
        receiver: 'addr2'
      };

      analytics.analyzeTransaction(tx);
      expect(analytics.metrics.activeAddresses.has('addr1')).toBe(true);
    });

    test('should maintain network health score', () => {
      expect(analytics.metrics.networkHealth).toBe(100);
      expect(typeof analytics.metrics.networkHealth).toBe('number');
    });
  });

  describe('Gas Estimation', () => {
    test('should estimate gas price for transaction', () => {
      const tx = {
        hash: '0x123',
        amount: 100,
        sender: 'addr1',
        receiver: 'addr2'
      };

      const gasPrice = analytics.estimateGasPrice(tx);
      expect(typeof gasPrice).toBe('number');
      expect(gasPrice).toBeGreaterThan(0);
    });

    test('should calculate average gas price', () => {
      // Add some gas usage data
      analytics.metrics.gasUsage = [10, 20, 30];

      const avgGas = analytics.getAverageGasPrice();
      expect(avgGas).toBe(20);
    });
  });

  describe('Alert System', () => {
    test('should initialize with empty alerts', () => {
      expect(Array.isArray(analytics.alerts)).toBe(true);
      expect(analytics.alerts.length).toBe(0);
    });

    test('should track transaction volume', () => {
      expect(Array.isArray(analytics.metrics.transactionVolume)).toBe(true);
    });

    test('should track block times', () => {
      expect(Array.isArray(analytics.metrics.blockTimes)).toBe(true);
    });
  });
});