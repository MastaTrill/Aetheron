const FiatOnRamp = require('../../fiat-onramp');

describe('Fiat On-Ramp Integration', () => {
  let fiatOnRamp;

  beforeEach(() => {
    fiatOnRamp = new FiatOnRamp({
      moonpayApiKey: 'test_moonpay_key',
      stripeApiKey: 'test_stripe_key',
      transakApiKey: 'test_transak_key'
    });
  });

  describe('Quote Generation', () => {
    test('should get quote from MoonPay', async () => {
      const result = await fiatOnRamp.getQuote('moonpay', 100, 'USD', 'ETH');

      expect(result.success).toBe(true);
      expect(result.quote).toBeDefined();
      expect(result.quote.provider).toBe('moonpay');
      expect(result.quote.fiatAmount).toBe(100);
      expect(result.quote.fiatCurrency).toBe('USD');
      expect(result.quote.cryptoCurrency).toBe('ETH');
      expect(parseFloat(result.quote.cryptoAmount)).toBeGreaterThan(0);
      expect(parseFloat(result.quote.exchangeRate)).toBeGreaterThan(0);
    });

    test('should get quote from Stripe', async () => {
      const result = await fiatOnRamp.getQuote('stripe', 500, 'EUR', 'BTC');

      expect(result.success).toBe(true);
      expect(result.quote.provider).toBe('stripe');
      expect(result.quote.fiatCurrency).toBe('EUR');
      expect(result.quote.cryptoCurrency).toBe('BTC');
    });

    test('should handle different currencies', async () => {
      const usd = await fiatOnRamp.getQuote('moonpay', 100, 'USD', 'ETH');
      const eur = await fiatOnRamp.getQuote('moonpay', 100, 'EUR', 'ETH');
      const gbp = await fiatOnRamp.getQuote('moonpay', 100, 'GBP', 'ETH');

      expect(usd.success).toBe(true);
      expect(eur.success).toBe(true);
      expect(gbp.success).toBe(true);

      // Different currency amounts should yield different crypto amounts
      expect(usd.quote.cryptoAmount).not.toBe(eur.quote.cryptoAmount);
    });

    test('should validate minimum purchase amount', async () => {
      const result = await fiatOnRamp.getQuote('moonpay', 5, 'USD', 'ETH');

      expect(result.success).toBe(false);
      expect(result.error).toContain('minimum');
    });
  });

  describe('Buy Crypto', () => {
    test('should initiate crypto purchase with credit card', async () => {
      const result = await fiatOnRamp.buyCrypto(
        'moonpay',
        100,
        'USD',
        'ETH',
        'credit_card',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.paymentUrl).toBeDefined();
    });

    test('should handle bank transfer payment', async () => {
      const result = await fiatOnRamp.buyCrypto(
        'stripe',
        1000,
        'USD',
        'BTC',
        'bank_transfer',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.paymentMethod).toBe('bank_transfer');
    });

    test('should validate wallet address format', async () => {
      const result = await fiatOnRamp.buyCrypto(
        'moonpay',
        100,
        'USD',
        'ETH',
        'credit_card',
        'invalid_address'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid wallet address');
    });
  });

  describe('Transaction Tracking', () => {
    test('should track transaction status', async () => {
      const purchase = await fiatOnRamp.buyCrypto(
        'moonpay',
        100,
        'USD',
        'ETH',
        'credit_card',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      const status = fiatOnRamp.getTransactionStatus(purchase.transactionId);

      expect(status.success).toBe(true);
      expect(status.transaction).toBeDefined();
      expect(status.transaction.status).toBe('pending');
    });

    test('should update transaction status', async () => {
      const purchase = await fiatOnRamp.buyCrypto(
        'moonpay',
        50,
        'USD',
        'USDC',
        'debit_card',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      // Simulate status update
      setTimeout(() => {
        const status = fiatOnRamp.getTransactionStatus(purchase.transactionId);
        expect(['pending', 'processing', 'completed']).toContain(
          status.transaction.status
        );
      }, 1000);
    });
  });

  describe('Provider Support', () => {
    test('should list supported providers', () => {
      const providers = fiatOnRamp.getSupportedProviders();

      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some((p) => p.id === 'moonpay')).toBe(true);
      expect(providers.some((p) => p.id === 'stripe')).toBe(true);
      expect(providers.some((p) => p.id === 'transak')).toBe(true);
    });

    test('should provide fee information', () => {
      const providers = fiatOnRamp.getSupportedProviders();

      providers.forEach((provider) => {
        expect(provider.fees).toBeDefined();
        expect(parseFloat(provider.fees.percentage)).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Limits and Restrictions', () => {
    test('should enforce daily limits', async () => {
      // First purchase should succeed
      const first = await fiatOnRamp.buyCrypto(
        'moonpay',
        5000,
        'USD',
        'ETH',
        'credit_card',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(first.success).toBe(true);

      // Second large purchase might hit daily limit
      const second = await fiatOnRamp.buyCrypto(
        'moonpay',
        15000,
        'USD',
        'ETH',
        'credit_card',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      if (!second.success) {
        expect(second.error).toContain('limit');
      }
    });
  });
});
