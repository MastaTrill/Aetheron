// Unit tests for API endpoints
import request from 'supertest';

// Mock all dependencies to avoid actual blockchain operations
jest.mock('../../blockchain', () => ({
  Blockchain: jest.fn().mockImplementation(() => ({
    chain: [{ index: 0, timestamp: Date.now(), transactions: [], hash: 'genesis' }],
    getBalance: jest.fn((address) => address === 'test-address' ? 100 : 0),
    addTransaction: jest.fn(),
    createBlock: jest.fn(() => ({ index: 1, hash: 'block-hash' }))
  })),
  Transaction: jest.fn().mockImplementation((sender, receiver, amount, signature, fee) => ({
    sender,
    receiver,
    amount,
    signature,
    fee,
    signTransaction: jest.fn(),
    isValid: jest.fn(() => true)
  })),
  Wallet: jest.fn().mockImplementation((password) => ({
    publicKey: 'mock-public-key-' + Math.random().toString(36).substr(2, 9),
    privateKey: password ? 'encrypted-private-key' : 'plain-private-key',
    encrypted: !!password,
    getDecryptedPrivateKey: jest.fn((pwd) => pwd === password ? 'decrypted-private-key' : null)
  })),
  saveBlockchain: jest.fn(),
  loadBlockchain: jest.fn()
}));

jest.mock('../../persistence', () => ({
  saveBlockchain: jest.fn(),
  loadBlockchain: jest.fn()
}));

jest.mock('../../dex', () => ({
  DEX: jest.fn().mockImplementation(() => ({
    addLiquidity: jest.fn(),
    swap: jest.fn(() => 50)
  }))
}));

jest.mock('../../dao', () => ({
  DAO: jest.fn().mockImplementation(() => ({
    addMember: jest.fn(),
    propose: jest.fn(() => 'proposal-1'),
    vote: jest.fn()
  }))
}));

jest.mock('../../social', () => ({
  SocialNetwork: jest.fn().mockImplementation(() => ({
    createProfile: jest.fn(),
    post: jest.fn(),
    follow: jest.fn()
  }))
}));

jest.mock('../../reputation', () => ({
  Reputation: jest.fn().mockImplementation(() => ({
    addScore: jest.fn(),
    getScore: jest.fn(() => 85)
  }))
}));

jest.mock('../../carbon', () => ({
  CarbonMarket: jest.fn().mockImplementation(() => ({
    issueCredit: jest.fn(),
    transferCredit: jest.fn()
  }))
}));

jest.mock('../../education', () => ({
  Education: jest.fn().mockImplementation(() => ({
    issueCertificate: jest.fn(),
    getCertificates: jest.fn(() => ['cert1', 'cert2'])
  }))
}));

jest.mock('../../defi', () => ({
  DeFiLending: jest.fn().mockImplementation(() => ({
    lend: jest.fn(),
    repay: jest.fn()
  }))
}));

jest.mock('../../game', () => ({
  GamePlatform: jest.fn().mockImplementation(() => ({
    addAsset: jest.fn(),
    updateLeaderboard: jest.fn()
  }))
}));

jest.mock('../../crowdfunding', () => ({
  Crowdfunding: jest.fn().mockImplementation(() => ({
    createCampaign: jest.fn(() => 'campaign-1'),
    donate: jest.fn()
  }))
}));

jest.mock('../../multichain', () => ({
  MultiChainIntegration: jest.fn().mockImplementation(() => ({
    getSupportedChains: jest.fn(() => ['ethereum', 'polygon', 'base', 'solana']),
    getEVMBalance: jest.fn(() => '1000000000000000000'),
    getTokenBalance: jest.fn(() => '500000000000000000'),
    getBlockNumber: jest.fn(() => 12345678),
    getChainConfig: jest.fn((chain) => {
      const configs = {
        ethereum: { rpcUrl: 'https://mainnet.infura.io', chainId: 1, nativeCurrency: { symbol: 'ETH' } },
        polygon: { rpcUrl: 'https://polygon-rpc.com', chainId: 137, nativeCurrency: { symbol: 'MATIC' } }
      };
      if (!configs[chain]) throw new Error('Chain not found');
      return configs[chain];
    })
  }))
}));

jest.mock('../../solana', () => ({
  SolanaIntegration: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn(() => '1000000000'),
    getTokenBalance: jest.fn(() => '500000000')
  }))
}));

jest.mock('../../admin-auth.js', () => ({
  ADMIN_USER: 'admin',
  checkAdminPassword: jest.fn(() => true)
}));

import apiModule from '../../api.js';
const app = apiModule;

describe('API Endpoints', () => {
  beforeEach(() => {
    // Reset global state for each test
    if (process.env.NODE_ENV === 'test' && apiModule.resetState) {
      apiModule.resetState();
    }
  });

  describe('GET /chain', () => {
    test('should return blockchain data', async () => {
      const response = await request(app)
        .get('/chain')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('index');
      expect(response.body[0]).toHaveProperty('transactions');
      expect(response.body[0]).toHaveProperty('hash');
    });
  });

  describe('GET /balance/:address', () => {
    test('should return balance for address', async () => {
      const response = await request(app)
        .get('/balance/test-address')
        .expect(200);

      expect(response.body).toHaveProperty('balance');
      expect(typeof response.body.balance).toBe('number');
    });
  });

  describe('POST /transaction', () => {
    test('should create transaction with valid data', async () => {
      // First create a wallet for the sender
      const walletResponse = await request(app)
        .post('/wallet')
        .send({ password: 'test-password' })
        .expect(200);

      const senderAddress = walletResponse.body.publicKey;

      const txData = {
        sender: senderAddress,
        receiver: 'receiver-address',
        amount: 50,
        password: 'test-password'
      };

      const response = await request(app)
        .post('/transaction')
        .send(txData)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Transaction added');
    });

    test('should reject transaction with missing fields', async () => {
      const response = await request(app)
        .post('/transaction')
        .send({ sender: 'test' }) // Missing receiver and amount
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /stats', () => {
    test('should return platform statistics', async () => {
      const response = await request(app)
        .get('/stats')
        .expect(200);

      expect(response.body).toHaveProperty('txCount');
      expect(response.body).toHaveProperty('blockCount');
      expect(response.body).toHaveProperty('userCount');
      expect(response.body).toHaveProperty('proposals');
      expect(response.body).toHaveProperty('liquidity');

      expect(typeof response.body.txCount).toBe('number');
      expect(typeof response.body.blockCount).toBe('number');
    });
  });

  describe('Multi-Chain Endpoints', () => {
    describe('GET /multichain/chains', () => {
      test('should return list of supported chains', async () => {
        const response = await request(app)
          .get('/multichain/chains')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('GET /multichain/config/:chain', () => {
      test('should return config for valid chain', async () => {
        const response = await request(app)
          .get('/multichain/config/ethereum')
          .expect(200);

        expect(response.body).toHaveProperty('rpcUrl');
        expect(response.body).toHaveProperty('chainId');
      });

      test('should return 404 for invalid chain', async () => {
        const response = await request(app)
          .get('/multichain/config/invalid-chain')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      // Send a request that will cause a validation error
      const response = await request(app)
        .post('/transaction')
        .send({ invalidField: 'test' }) // Missing required fields
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });
  });
});