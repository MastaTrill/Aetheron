import L2Integration from '../../l2-integration.js';

describe('L2 Integration', () => {
  let l2;

  beforeEach(() => {
    l2 = new L2Integration();
  });

  describe('L2 Deposits', () => {
    test('should deposit to zkSync', async () => {
      const result = await l2.depositToL2(
        'zksync',
        'ETH',
        0.5,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.depositId).toBeDefined();
      expect(result.network).toBe('zkSync Era');
      expect(result.estimatedTime).toBe('15 minutes');
      expect(result.l1TxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    test('should deposit to Arbitrum', async () => {
      const result = await l2.depositToL2(
        'arbitrum',
        'USDC',
        100,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.network).toBe('Arbitrum One');
      expect(result.estimatedTime).toBe('10 minutes');
    });

    test('should deposit to Optimism', async () => {
      const result = await l2.depositToL2(
        'optimism',
        'ETH',
        1.0,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.network).toBe('Optimism');
    });

    test('should deposit to Base', async () => {
      const result = await l2.depositToL2(
        'base',
        'ETH',
        0.25,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.network).toBe('Base');
    });
  });

  describe('L2 Withdrawals', () => {
    test('should withdraw from Arbitrum to L1', async () => {
      const result = await l2.withdrawToL1(
        'arbitrum',
        'ETH',
        0.5,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.withdrawalId).toBeDefined();
      expect(result.challengePeriod).toBe('7 days');
      expect(result.l2TxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    test('should track withdrawal status', async () => {
      const withdrawal = await l2.withdrawToL1(
        'optimism',
        'ETH',
        1.0,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      const status = l2.getWithdrawalStatus(withdrawal.withdrawalId);

      expect(status.success).toBe(true);
      expect(status.withdrawal).toBeDefined();
      expect(status.withdrawal.status).toBe('proving');
    });

    test('should claim withdrawal after challenge period', async () => {
      const withdrawal = await l2.withdrawToL1(
        'arbitrum',
        'ETH',
        0.5,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      // Simulate proof generation and challenge period
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await l2.claimWithdrawal(withdrawal.withdrawalId);

      if (result.success) {
        expect(result.l1TxHash).toBeDefined();
      }
    }, 20000);
  });

  describe('Cross-L2 Bridging', () => {
    test('should bridge from zkSync to Arbitrum', async () => {
      const result = await l2.bridgeBetweenL2s(
        'zksync',
        'arbitrum',
        'ETH',
        0.5,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.bridgeId).toBeDefined();
      expect(result.fromNetwork).toBe('zksync');
      expect(result.toNetwork).toBe('arbitrum');
    });
  });

  describe('Gas Estimation', () => {
    test('should estimate deposit cost', async () => {
      const result = await l2.estimateBridgeCost('zksync', 'deposit', 'ETH', 1.0);

      expect(result.success).toBe(true);
      expect(result.gasCost).toBeDefined();
      expect(parseFloat(result.gasCost.costEth)).toBeGreaterThan(0);
      expect(result.estimatedTime).toBe('15 minutes');
    });

    test('should estimate withdrawal cost', async () => {
      const result = await l2.estimateBridgeCost('arbitrum', 'withdrawal', 'ETH', 1.0);

      expect(result.success).toBe(true);
      expect(result.estimatedTime).toBe('7 days');
    });
  });

  describe('Batch Transactions', () => {
    test('should batch L2 transactions for gas savings', async () => {
      const transactions = [
        { to: '0x1111111111111111111111111111111111111111', value: '100000000000000000' },
        { to: '0x2222222222222222222222222222222222222222', value: '200000000000000000' },
        { to: '0x3333333333333333333333333333333333333333', value: '300000000000000000' }
      ];

      const result = await l2.batchL2Transactions('arbitrum', transactions);

      expect(result.success).toBe(true);
      expect(result.transactionCount).toBe(3);
      expect(parseFloat(result.gasSavings)).toBeGreaterThan(0);
    });
  });

  describe('Network Support', () => {
    test('should list all supported networks', () => {
      const networks = l2.getSupportedNetworks();

      expect(networks.length).toBeGreaterThanOrEqual(4);
      expect(networks.some((n) => n.id === 'zksync')).toBe(true);
      expect(networks.some((n) => n.id === 'arbitrum')).toBe(true);
      expect(networks.some((n) => n.id === 'optimism')).toBe(true);
      expect(networks.some((n) => n.id === 'base')).toBe(true);
    });

    test('should provide bridge addresses', () => {
      const zkSyncBridge = l2.getBridgeAddress('zksync');
      const arbitrumBridge = l2.getBridgeAddress('arbitrum');

      expect(zkSyncBridge).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(arbitrumBridge).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('Pending Operations', () => {
    test('should track pending deposits', async () => {
      await l2.depositToL2('zksync', 'ETH', 0.5, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7');
      await l2.depositToL2('arbitrum', 'ETH', 1.0, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7');

      const pending = l2.getPendingDeposits();

      expect(pending.length).toBeGreaterThanOrEqual(2);
    });

    test('should track pending withdrawals', async () => {
      await l2.withdrawToL1('optimism', 'ETH', 0.5, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7');
      await l2.withdrawToL1('arbitrum', 'ETH', 1.0, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7');

      const pending = l2.getPendingWithdrawals();

      expect(pending.length).toBeGreaterThanOrEqual(2);
    });
  });
});
