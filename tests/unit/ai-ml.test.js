// Unit tests for AI/ML Fraud Detection
const path = require('path');
const { FraudDetector } = require(path.join(__dirname, '../../ai-ml'));

describe('Fraud Detector', () => {
  let detector;

  beforeEach(() => {
    detector = new FraudDetector();
  });

  describe('Transaction Analysis', () => {
    test('should analyze transaction and return verdict', () => {
      const tx = {
        hash: '0x123',
        sender: 'addr1',
        receiver: 'addr2',
        amount: 1000,
        gasPrice: 100
      };

      const result = detector.analyzeTransaction(tx);

      expect(result).toHaveProperty('transaction', tx.hash);
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('patterns');
      expect(result).toHaveProperty('verdict');
      expect(result).toHaveProperty('recommendations');
    });

    test('should detect blacklisted addresses', () => {
      detector.blacklist.add('bad-addr');

      const tx = {
        hash: '0x123',
        sender: 'bad-addr',
        receiver: 'addr2',
        amount: 100
      };

      const result = detector.analyzeTransaction(tx);
      expect(result.riskScore).toBeGreaterThan(80);
      expect(result.verdict).toBe('BLOCK');
    });

    test('should allow whitelisted addresses', () => {
      detector.whitelist.add('good-addr1');
      detector.whitelist.add('good-addr2');

      const tx = {
        hash: '0x123',
        sender: 'good-addr1',
        receiver: 'good-addr2',
        amount: 1000000 // Large amount
      };

      const result = detector.analyzeTransaction(tx);
      expect(result.riskScore).toBe(0);
      expect(result.verdict).toBe('PASS');
    });
  });

  describe('Risk Score Calculation', () => {
    test('should calculate high risk for large amounts', () => {
      const tx = {
        hash: '0x123',
        sender: 'addr1',
        receiver: 'addr2',
        amount: 2000000 // Very large amount
      };

      const score = detector.calculateRiskScore(tx);
      expect(score).toBeGreaterThan(75); // 30 + 50 = 80
    });

    test('should increase risk for high gas prices', () => {
      const tx = {
        hash: '0x123',
        sender: 'addr1',
        receiver: 'addr2',
        amount: 100,
        gasPrice: 1000 // High gas price
      };

      const score = detector.calculateRiskScore(tx);
      expect(score).toBeGreaterThan(15);
    });

    test('should increase risk for new addresses', () => {
      const tx = {
        hash: '0x123',
        sender: 'addr1',
        receiver: 'addr2',
        amount: 100,
        senderAge: 3600000 // 1 hour old
      };

      const score = detector.calculateRiskScore(tx);
      expect(score).toBeGreaterThan(20);
    });

    test('should increase risk for round numbers', () => {
      const tx = {
        hash: '0x123',
        sender: 'addr1',
        receiver: 'addr2',
        amount: 1000 // Round number
      };

      const score = detector.calculateRiskScore(tx);
      expect(score).toBeGreaterThan(10);
    });
  });

  describe('Pattern Detection', () => {
    test('should detect suspicious patterns', () => {
      const tx = {
        hash: '0x123',
        sender: 'addr1',
        receiver: 'contract-addr',
        amount: 2000, // Large amount to contract
        contractAddress: 'contract-addr',
        type: 'CONTRACT_WITHDRAWAL',
        contractBalance: 2000
      };

      const patterns = detector.detectPatterns(tx);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty('type');
      expect(patterns[0]).toHaveProperty('confidence');
    });

    test('should identify known scams', () => {
      detector.knownScams.add('scam-addr');

      const tx = {
        hash: '0x123',
        sender: 'addr1',
        receiver: 'scam-addr',
        amount: 100
      };

      const patterns = detector.detectPatterns(tx);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some((p) => p.type === 'PHISHING')).toBe(true);
    });
  });

  describe('Verdict System', () => {
    test('should return PASS for low risk', () => {
      const verdict = detector.makeVerdict(10, []);
      expect(verdict).toBe('PASS');
    });

    test('should return REVIEW for medium risk', () => {
      const verdict = detector.makeVerdict(50, []);
      expect(verdict).toBe('REVIEW');
    });

    test('should return BLOCK for high risk', () => {
      const verdict = detector.makeVerdict(80, []);
      expect(verdict).toBe('BLOCK');
    });
  });

  describe('Recommendations', () => {
    test('should provide recommendations for flagged transactions', () => {
      const recommendations = detector.getRecommendations('REVIEW', ['LARGE_AMOUNT']);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('should provide recommendations for blocked transactions', () => {
      const recommendations = detector.getRecommendations('BLOCK', ['BLACKLISTED']);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.some((rec) => rec.includes('block') || rec.includes('reject'))).toBe(
        true
      );
    });
  });

  describe('Utility Functions', () => {
    test('should identify round numbers', () => {
      expect(detector.isRoundNumber(1000)).toBe(true);
      expect(detector.isRoundNumber(100.5)).toBe(false);
      expect(detector.isRoundNumber(999)).toBe(false);
    });
  });

  describe('Learning and Adaptation', () => {
    test('should add to blacklist', () => {
      detector.addToBlacklist('bad-addr');
      expect(detector.blacklist.has('bad-addr')).toBe(true);
    });

    test('should add to whitelist', () => {
      detector.addToWhitelist('good-addr');
      expect(detector.whitelist.has('good-addr')).toBe(true);
    });
  });
});
