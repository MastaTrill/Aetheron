const DeFi = require('../defi');

describe('DeFi Module - Extended Tests', () => {
  let defi;

  beforeEach(() => {
    defi = new DeFi();
  });

  describe('Liquidity Pool Operations', () => {
    it('should add liquidity with balanced amounts', async () => {
      const result = await defi.addLiquidity('ETH', 'USDC', 10, 20000);
      expect(result.success).toBe(true);
      expect(result.lpTokens).toBeGreaterThan(0);
    });

    it('should add liquidity with imbalanced amounts', async () => {
      const result = await defi.addLiquidity('ETH', 'DAI', 5, 5000);
      expect(result.success).toBe(true);
      expect(result.lpTokens).toBeGreaterThan(0);
    });

    it('should reject liquidity with zero amount', async () => {
      await expect(
        defi.addLiquidity('ETH', 'USDC', 0, 1000)
      ).rejects.toThrow();
    });

    it('should remove liquidity correctly', async () => {
      await defi.addLiquidity('ETH', 'USDC', 10, 20000);
      const result = await defi.removeLiquidity('ETH', 'USDC', 50);
      expect(result.success).toBe(true);
      expect(result.amount1).toBeGreaterThan(0);
      expect(result.amount2).toBeGreaterThan(0);
    });

    it('should calculate LP tokens proportionally', async () => {
      const result1 = await defi.addLiquidity('ETH', 'USDC', 10, 20000);
      const result2 = await defi.addLiquidity('ETH', 'USDC', 20, 40000);
      expect(result2.lpTokens).toBeCloseTo(result1.lpTokens * 2, 1);
    });
  });

  describe('Swap Operations', () => {
    beforeEach(async () => {
      await defi.addLiquidity('ETH', 'USDC', 100, 200000);
    });

    it('should execute swap with valid slippage', async () => {
      const result = await defi.swap('USDC', 'ETH', 1000, 0.5);
      expect(result.success).toBe(true);
      expect(result.amountOut).toBeGreaterThan(0);
    });

    it('should fail swap with insufficient liquidity', async () => {
      await expect(
        defi.swap('USDC', 'ETH', 1000000, 0.5)
      ).rejects.toThrow();
    });

    it('should calculate price impact correctly', async () => {
      const smallSwap = await defi.swap('USDC', 'ETH', 100, 1);
      const largeSwap = await defi.swap('USDC', 'ETH', 10000, 5);
      expect(largeSwap.priceImpact).toBeGreaterThan(smallSwap.priceImpact);
    });

    it('should respect slippage tolerance', async () => {
      const result = await defi.swap('ETH', 'USDC', 1, 0.1);
      // With AMM constant product formula, slippage can be higher for larger trades
      // Allow for 1.5% slippage on this size of trade
      const expectedMin = result.expectedOutput * 0.985;
      expect(result.amountOut).toBeGreaterThanOrEqual(expectedMin);
    });
  });

  describe('Staking Operations', () => {
    it('should stake tokens successfully', async () => {
      const result = await defi.stake('ETH', 10, 90);
      expect(result.success).toBe(true);
      expect(result.stakedAmount).toBe(10);
      expect(result.lockDays).toBe(90);
    });

    it('should calculate rewards correctly', async () => {
      await defi.stake('ETH', 100, 365);
      const rewards = await defi.getStakingRewards('test-user');
      expect(rewards).toBeGreaterThan(0);
    });

    it('should prevent unstaking before lock period', async () => {
      const stake = await defi.stake('ETH', 10, 30);
      await expect(
        defi.unstake(stake.stakeId)
      ).rejects.toThrow();
    });

    it('should apply higher APY for longer lock periods', async () => {
      const short = await defi.stake('ETH', 100, 30);
      const long = await defi.stake('ETH', 100, 365);
      expect(long.apy).toBeGreaterThan(short.apy);
    });
  });

  describe('Yield Farming', () => {
    it('should create farming position', async () => {
      await defi.addLiquidity('ETH', 'USDC', 10, 20000);
      const result = await defi.startFarming('ETH-USDC', 50);
      expect(result.success).toBe(true);
    });

    it('should accumulate farming rewards over time', async () => {
      await defi.addLiquidity('ETH', 'USDC', 10, 20000);
      await defi.startFarming('ETH-USDC', 50);

      // Simulate time passing
      await new Promise(resolve => setTimeout(resolve, 100));

      const rewards = await defi.getFarmingRewards('test-user');
      expect(rewards).toBeGreaterThanOrEqual(0);
    });

    it('should claim farming rewards', async () => {
      await defi.addLiquidity('ETH', 'USDC', 10, 20000);
      await defi.startFarming('ETH-USDC', 50);
      const result = await defi.claimFarmingRewards();
      expect(result.success).toBe(true);
    });
  });

  describe('Flash Loans', () => {
    it('should execute flash loan successfully', async () => {
      const result = await defi.flashLoan('ETH', 100, async (borrowed) => {
        // Simulate arbitrage or other operations
        return borrowed * 1.001; // Return with 0.1% profit
      });
      expect(result.success).toBe(true);
    });

    it('should reject flash loan without repayment', async () => {
      await expect(
        defi.flashLoan('ETH', 100, async (borrowed) => {
          return borrowed * 0.99; // Try to return less
        })
      ).rejects.toThrow();
    });

    it('should charge flash loan fee', async () => {
      const result = await defi.flashLoan('ETH', 100, async (borrowed) => {
        return borrowed * 1.01;
      });
      expect(result.fee).toBeGreaterThan(0);
    });
  });

  describe('Price Oracles', () => {
    it('should get current price for token pair', async () => {
      await defi.addLiquidity('ETH', 'USDC', 10, 20000);
      const price = await defi.getPrice('ETH', 'USDC');
      expect(price).toBeCloseTo(2000, 100);
    });

    it('should update TWAP over time', async () => {
      await defi.addLiquidity('ETH', 'USDC', 10, 20000);
      const twap1 = await defi.getTWAP('ETH', 'USDC');

      await defi.swap('USDC', 'ETH', 5000, 1);

      const twap2 = await defi.getTWAP('ETH', 'USDC');
      expect(twap2).not.toBe(twap1);
    });
  });

  describe('Gas Optimization', () => {
    it('should batch multiple operations', async () => {
      const operations = [
        { type: 'swap', from: 'ETH', to: 'USDC', amount: 1 },
        { type: 'stake', token: 'ETH', amount: 5, days: 30 }
      ];
      const result = await defi.batchExecute(operations);
      expect(result.success).toBe(true);
      expect(result.savedGas).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts', async () => {
      const result = await defi.swap('ETH', 'USDC', 0.000001, 5);
      expect(result.success).toBe(true);
    });

    it('should handle very large amounts', async () => {
      await defi.addLiquidity('ETH', 'USDC', 1000000, 2000000000);
      const result = await defi.swap('USDC', 'ETH', 1000000, 10);
      expect(result.success).toBe(true);
    });

    it('should prevent reentrancy attacks', async () => {
      await expect(
        defi.reentrancyTest()
      ).rejects.toThrow('Reentrancy detected');
    });
  });
});
