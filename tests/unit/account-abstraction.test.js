import AccountAbstraction from '../../account-abstraction.js';

describe('Account Abstraction (ERC-4337)', () => {
  let aa;

  beforeEach(() => {
    aa = new AccountAbstraction({
      bundlerUrl: 'https://test-bundler.example.com',
      paymasterUrl: 'https://test-paymaster.example.com'
    });
  });

  describe('Smart Account Creation', () => {
    test('should create smart account with Google login', async () => {
      const result = await aa.createSmartAccount('google', {
        id: 'test@example.com',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg'
      });

      expect(result.success).toBe(true);
      expect(result.account).toBeDefined();
      expect(result.account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.account.provider).toBe('google');
      expect(result.account.profile.email).toBe('test@example.com');
    });

    test('should generate deterministic addresses', async () => {
      const profile = {
        id: 'user123',
        name: 'Same User',
        email: 'same@example.com'
      };

      const result1 = await aa.createSmartAccount('twitter', profile);
      const result2 = await aa.createSmartAccount('twitter', profile);

      expect(result1.account.address).toBe(result2.account.address);
    });

    test('should handle different social providers', async () => {
      const profile = { id: '123', name: 'User', email: 'user@test.com' };

      const google = await aa.createSmartAccount('google', profile);
      const twitter = await aa.createSmartAccount('twitter', profile);
      const facebook = await aa.createSmartAccount('facebook', profile);

      expect(google.account.address).not.toBe(twitter.account.address);
      expect(twitter.account.address).not.toBe(facebook.account.address);
    });
  });

  describe('Session Keys', () => {
    test('should create session key with permissions', async () => {
      const account = await aa.createSmartAccount('google', {
        id: 'test@example.com',
        name: 'Test',
        email: 'test@example.com'
      });

      const result = await aa.createSessionKey(account.account.address, {
        maxAmount: '1000000000000000000',
        validUntil: Date.now() + 86400000,
        allowedContracts: ['0x1234567890123456789012345678901234567890']
      });

      expect(result.success).toBe(true);
      expect(result.sessionKey).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    test('should execute transaction with session key', async () => {
      const account = await aa.createSmartAccount('google', {
        id: 'user@test.com',
        name: 'User',
        email: 'user@test.com'
      });

      const session = await aa.createSessionKey(account.account.address, {
        maxAmount: '2000000000000000000',
        validUntil: Date.now() + 3600000
      });

      const result = await aa.executeWithSessionKey(session.sessionKey, {
        to: '0x1234567890123456789012345678901234567890',
        value: '100000000000000000',
        data: '0x'
      });

      expect(result.success).toBe(true);
      expect(result.userOpHash).toBeDefined();
      expect(result.txHash).toBeDefined();
    });

    test('should reject transaction exceeding session limit', async () => {
      const account = await aa.createSmartAccount('google', {
        id: 'limited@test.com',
        name: 'Limited',
        email: 'limited@test.com'
      });

      const session = await aa.createSessionKey(account.account.address, {
        maxAmount: '100000000000000000',
        validUntil: Date.now() + 3600000
      });

      const result = await aa.executeWithSessionKey(session.sessionKey, {
        to: '0x1234567890123456789012345678901234567890',
        value: '500000000000000000',
        data: '0x'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds session key limit');
    });

    test('should revoke session key', async () => {
      const account = await aa.createSmartAccount('google', {
        id: 'revoke@test.com',
        name: 'Revoke',
        email: 'revoke@test.com'
      });

      const session = await aa.createSessionKey(account.account.address, {
        maxAmount: '1000000000000000000'
      });

      const revoke = aa.revokeSessionKey(session.sessionKey);
      expect(revoke.success).toBe(true);

      const sessions = aa.getActiveSessions(account.account.address);
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Gasless Transactions', () => {
    test('should sponsor gas for account', async () => {
      const account = await aa.createSmartAccount('google', {
        id: 'sponsor@test.com',
        name: 'Sponsored',
        email: 'sponsor@test.com'
      });

      const result = await aa.sponsorGas(
        account.account.address,
        '0xSponsor1234567890123456789012345678901234',
        '5000000000000000000'
      );

      expect(result.success).toBe(true);
      expect(result.sponsoredAmount).toBe('5000000000000000000');
    });
  });

  describe('Batch Transactions', () => {
    test('should batch multiple transactions', async () => {
      const account = await aa.createSmartAccount('google', {
        id: 'batch@test.com',
        name: 'Batch',
        email: 'batch@test.com'
      });

      const transactions = [
        {
          to: '0x1111111111111111111111111111111111111111',
          value: '100000000000000000',
          data: '0x'
        },
        {
          to: '0x2222222222222222222222222222222222222222',
          value: '200000000000000000',
          data: '0x'
        },
        {
          to: '0x3333333333333333333333333333333333333333',
          value: '300000000000000000',
          data: '0x'
        }
      ];

      const result = await aa.batchTransactions(account.account.address, transactions);

      expect(result.success).toBe(true);
      expect(result.batchSize).toBe(3);
      expect(result.userOpHash).toBeDefined();
    });
  });

  describe('Account Recovery', () => {
    test('should recover account with same social login', async () => {
      const profile = {
        id: 'recover@test.com',
        name: 'Recovery User',
        email: 'recover@test.com'
      };

      const original = await aa.createSmartAccount('google', profile);
      const recovered = await aa.recoverAccount('google', profile);

      expect(recovered.success).toBe(true);
      expect(recovered.account.address).toBe(original.account.address);
      expect(recovered.recovered).toBe(true);
    });
  });
});
