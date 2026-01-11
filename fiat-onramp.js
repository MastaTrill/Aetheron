import crypto from 'crypto';

/**
 * Fiat On-Ramp Integration
 * Supports MoonPay, Stripe, Ramp Network for crypto purchases with fiat
 */
class FiatOnRamp {
  constructor(config = {}) {
    this.moonpayApiKey = config.moonpayApiKey || process.env.MOONPAY_API_KEY;
    this.moonpaySecretKey = config.moonpaySecretKey || process.env.MOONPAY_SECRET_KEY;
    this.stripeApiKey = config.stripeApiKey || process.env.STRIPE_API_KEY;
    this.rampApiKey = config.rampApiKey || process.env.RAMP_API_KEY;
    this.transactions = new Map();
    this.limits = {
      daily: 10000,
      monthly: 50000,
      perTransaction: 5000
    };
  }

  /**
   * Get quote for crypto purchase
   */
  async getQuote(provider, fiatAmount, fiatCurrency, cryptoCurrency) {
    // Minimum purchase validation
    if (fiatAmount < 10) {
      return {
        success: false,
        error: 'Amount below minimum purchase amount (10 USD equivalent)'
      };
    }

    const exchangeRate = await this.getExchangeRate(fiatCurrency, cryptoCurrency);
    const cryptoAmount = (fiatAmount / exchangeRate).toFixed(8);
    const fees = fiatAmount * 0.03; // 3% fee

    return {
      success: true,
      quote: {
        provider,
        fiatAmount,
        fiatCurrency,
        cryptoCurrency,
        cryptoAmount,
        exchangeRate: exchangeRate.toString(),
        fees,
        total: fiatAmount + fees,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    };
  }

  /**
   * Get exchange rate
   */
  async getExchangeRate(fiatCurrency, cryptoCurrency) {
    // Mock exchange rates
    const rates = {
      ETH: { USD: 2000, EUR: 1800, GBP: 1600 },
      BTC: { USD: 40000, EUR: 36000, GBP: 32000 },
      USDC: { USD: 1, EUR: 0.9, GBP: 0.8 }
    };

    return rates[cryptoCurrency]?.[fiatCurrency] || 1;
  }

  /**
   * Buy crypto with fiat
   */
  async buyCrypto(
    provider,
    fiatAmount,
    fiatCurrency,
    cryptoCurrency,
    paymentMethod,
    walletAddress
  ) {
    // Validate wallet address
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return {
        success: false,
        error: 'Invalid wallet address format'
      };
    }

    // Validate amount limits
    if (fiatAmount > this.limits.perTransaction) {
      return {
        success: false,
        error: `Amount exceeds per-transaction limit of ${this.limits.perTransaction}`
      };
    }

    const quote = await this.getQuote(provider, fiatAmount, fiatCurrency, cryptoCurrency);
    if (!quote.success) {
      return quote;
    }

    const transactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const transaction = {
      transactionId,
      provider,
      fiatAmount,
      fiatCurrency,
      cryptoCurrency,
      cryptoAmount: quote.quote.cryptoAmount,
      paymentMethod,
      walletAddress,
      status: 'pending',
      paymentUrl: `https://${provider}.example.com/payment/${transactionId}`,
      createdAt: new Date()
    };

    this.transactions.set(transactionId, transaction);

    return {
      success: true,
      ...transaction
    };
  }

  /**
   * Get supported providers
   */
  getSupportedProviders() {
    return [
      {
        id: 'moonpay',
        name: 'MoonPay',
        paymentMethods: ['credit_card', 'debit_card', 'bank_transfer'],
        currencies: ['USD', 'EUR', 'GBP'],
        cryptos: ['ETH', 'BTC', 'USDC', 'USDT'],
        fees: {
          percentage: '3.5',
          fixed: '3.99'
        }
      },
      {
        id: 'stripe',
        name: 'Stripe',
        paymentMethods: ['credit_card', 'bank_transfer'],
        currencies: ['USD', 'EUR'],
        cryptos: ['ETH', 'BTC'],
        fees: {
          percentage: '2.9',
          fixed: '0.30'
        }
      },
      {
        id: 'transak',
        name: 'Transak',
        paymentMethods: ['credit_card', 'debit_card', 'bank_transfer'],
        currencies: ['USD', 'EUR', 'GBP', 'INR'],
        cryptos: ['ETH', 'BTC', 'USDC', 'DAI', 'MATIC'],
        fees: {
          percentage: '3.0',
          fixed: '5.00'
        }
      },
      {
        id: 'ramp',
        name: 'Ramp Network',
        paymentMethods: ['credit_card', 'debit_card', 'bank_transfer', 'apple_pay'],
        currencies: ['USD', 'EUR', 'GBP'],
        cryptos: ['ETH', 'BTC', 'USDC', 'DAI'],
        fees: {
          percentage: '2.5',
          fixed: '0'
        }
      }
    ];
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId) {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found'
      };
    }

    return {
      success: true,
      transaction
    };
  }

  /**
   * Initialize MoonPay widget
   */
  async initializeMoonPay(options) {
    const { walletAddress, cryptoCurrency = 'ETH', fiatCurrency = 'USD', amount } = options;

    const params = new URLSearchParams({
      apiKey: this.moonpayApiKey,
      currencyCode: cryptoCurrency.toLowerCase(),
      walletAddress: walletAddress,
      baseCurrencyCode: fiatCurrency.toLowerCase(),
      baseCurrencyAmount: amount || '100',
      lockAmount: 'false',
      showWalletAddressForm: 'false',
      theme: 'dark',
      colorCode: '#00eaff'
    });

    const signature = this.generateMoonPaySignature(params.toString());
    params.append('signature', signature);

    const widgetUrl = `https://buy.moonpay.com?${params.toString()}`;

    console.log('✅ MoonPay widget URL generated');
    return {
      provider: 'moonpay',
      url: widgetUrl,
      redirectUrl: widgetUrl
    };
  }

  /**
   * Generate MoonPay signature
   */
  generateMoonPaySignature(queryString) {
    const signature = crypto
      .createHmac('sha256', this.moonpaySecretKey || 'demo_secret')
      .update(queryString)
      .digest('base64');

    return signature;
  }

  /**
   * Initialize Stripe payment
   */
  async initializeStripe(options) {
    const { amount, currency = 'USD', cryptoCurrency = 'ETH', walletAddress } = options;

    console.log(`Initializing Stripe payment: $${amount} ${currency}`);

    const paymentIntent = {
      id: 'pi_' + crypto.randomBytes(16).toString('hex'),
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      status: 'requires_payment_method',
      cryptoDetails: {
        currency: cryptoCurrency,
        walletAddress: walletAddress,
        estimatedAmount: await this.estimateCryptoAmount(amount, currency, cryptoCurrency)
      },
      clientSecret: 'pi_' + crypto.randomBytes(32).toString('hex'),
      createdAt: new Date()
    };

    this.transactions.set(paymentIntent.id, paymentIntent);

    console.log(`✅ Stripe PaymentIntent created: ${paymentIntent.id}`);
    return paymentIntent;
  }

  /**
   * Confirm Stripe payment
   */
  async confirmStripePayment(paymentIntentId, paymentMethod) {
    const intent = this.transactions.get(paymentIntentId);
    if (!intent) throw new Error('PaymentIntent not found');

    console.log('Processing Stripe payment...');

    // Simulate payment processing
    intent.status = 'processing';
    intent.paymentMethod = paymentMethod;

    // Simulate blockchain transaction
    setTimeout(() => {
      intent.status = 'succeeded';
      intent.cryptoTransaction = {
        txHash: '0x' + crypto.randomBytes(32).toString('hex'),
        amount: intent.cryptoDetails.estimatedAmount,
        currency: intent.cryptoDetails.cryptoCurrency,
        timestamp: new Date()
      };
      console.log(
        `✅ Crypto sent: ${intent.cryptoTransaction.amount} ${intent.cryptoDetails.cryptoCurrency}`
      );
    }, 3000);

    return intent;
  }

  /**
   * Initialize Ramp Network
   */
  async initializeRamp(options) {
    const { walletAddress, cryptoCurrency = 'ETH', fiatCurrency = 'USD', amount } = options;

    const purchase = {
      hostApiKey: this.rampApiKey || 'demo_key',
      swapAsset: cryptoCurrency + '_' + this.getCryptoNetwork(cryptoCurrency),
      fiatCurrency: fiatCurrency,
      fiatValue: amount || 100,
      userAddress: walletAddress,
      variant: 'auto',
      webhookStatusUrl: 'https://your-webhook-url.com/ramp-webhook'
    };

    const widgetUrl = `https://buy.ramp.network/?${new URLSearchParams(purchase).toString()}`;

    console.log('✅ Ramp Network widget URL generated');
    return {
      provider: 'ramp',
      url: widgetUrl,
      config: purchase
    };
  }

  /**
   * Get cryptocurrency network
   */
  getCryptoNetwork(crypto) {
    const networks = {
      ETH: 'ETHEREUM',
      MATIC: 'POLYGON',
      USDC: 'ETHEREUM',
      USDT: 'ETHEREUM',
      DAI: 'ETHEREUM',
      SOL: 'SOLANA'
    };
    return networks[crypto] || 'ETHEREUM';
  }

  /**
   * Estimate crypto amount from fiat
   */
  async estimateCryptoAmount(fiatAmount, fiatCurrency, cryptoCurrency) {
    // In production, fetch real-time prices from CoinGecko, CoinMarketCap, etc.
    const mockPrices = {
      ETH: 2200,
      BTC: 42000,
      MATIC: 0.85,
      SOL: 95,
      USDC: 1,
      USDT: 1,
      DAI: 1
    };

    const priceInUSD = mockPrices[cryptoCurrency] || 1;
    const cryptoAmount = fiatAmount / priceInUSD;

    console.log(`💱 ${fiatAmount} ${fiatCurrency} = ${cryptoAmount.toFixed(6)} ${cryptoCurrency}`);
    return cryptoAmount.toFixed(6);
  }

  /**
   * Get supported cryptocurrencies
   */
  getSupportedCryptos(provider = 'all') {
    const cryptos = {
      moonpay: ['BTC', 'ETH', 'USDC', 'USDT', 'DAI', 'MATIC', 'SOL', 'AVAX', 'BNB'],
      stripe: ['ETH', 'USDC', 'BTC'],
      ramp: ['ETH', 'USDC', 'DAI', 'MATIC', 'USDT']
    };

    if (provider === 'all') {
      return Array.from(new Set([...cryptos.moonpay, ...cryptos.stripe, ...cryptos.ramp]));
    }

    return cryptos[provider] || [];
  }

  /**
   * Get supported fiat currencies
   */
  getSupportedFiat(provider = 'all') {
    const fiat = {
      moonpay: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'KRW', 'SGD'],
      stripe: ['USD', 'EUR', 'GBP'],
      ramp: ['USD', 'EUR', 'GBP', 'PLN', 'BRL']
    };

    if (provider === 'all') {
      return Array.from(new Set([...fiat.moonpay, ...fiat.stripe, ...fiat.ramp]));
    }

    return fiat[provider] || [];
  }

  /**
   * Get payment methods
   */
  getPaymentMethods(provider) {
    const methods = {
      moonpay: ['card', 'bank_transfer', 'apple_pay', 'google_pay', 'samsung_pay'],
      stripe: ['card', 'apple_pay', 'google_pay', 'link'],
      ramp: ['card', 'bank_transfer', 'apple_pay', 'google_pay']
    };

    return methods[provider] || [];
  }

  /**
   * Get transaction limits
   */
  getLimits(provider) {
    const limits = {
      moonpay: {
        min: 30,
        max: 20000,
        daily: 50000,
        monthly: 150000
      },
      stripe: {
        min: 50,
        max: 5000,
        daily: 10000,
        monthly: 50000
      },
      ramp: {
        min: 20,
        max: 10000,
        daily: 30000,
        monthly: 100000
      }
    };

    return limits[provider] || this.limits;
  }

  /**
   * Check KYC requirements
   */
  checkKYCRequirements(amount, provider) {
    const kycThresholds = {
      moonpay: 150,
      stripe: 1000,
      ramp: 500
    };

    const threshold = kycThresholds[provider] || 500;
    const requiresKYC = amount > threshold;

    return {
      required: requiresKYC,
      threshold: threshold,
      level: requiresKYC ? (amount > 5000 ? 'enhanced' : 'basic') : 'none'
    };
  }

  /**
   * Create off-ramp (crypto to fiat) transaction
   */
  async createOffRamp(options) {
    const { cryptoCurrency, cryptoAmount, fiatCurrency, bankAccount, walletAddress } = options;

    console.log(`Creating off-ramp: ${cryptoAmount} ${cryptoCurrency} → ${fiatCurrency}`);

    const fiatAmount = await this.estimateFiatAmount(cryptoAmount, cryptoCurrency, fiatCurrency);

    const offRamp = {
      id: 'offramp_' + crypto.randomBytes(16).toString('hex'),
      type: 'off-ramp',
      cryptoCurrency: cryptoCurrency,
      cryptoAmount: cryptoAmount,
      fiatCurrency: fiatCurrency,
      fiatAmount: fiatAmount,
      bankAccount: {
        ...bankAccount,
        accountNumber: '****' + bankAccount.accountNumber.slice(-4)
      },
      walletAddress: walletAddress,
      status: 'pending',
      fee: fiatAmount * 0.015, // 1.5% fee
      netAmount: fiatAmount * 0.985,
      estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    this.transactions.set(offRamp.id, offRamp);
    console.log(`✅ Off-ramp created: ${offRamp.id}`);

    return offRamp;
  }

  /**
   * Estimate fiat amount from crypto
   */
  async estimateFiatAmount(cryptoAmount, cryptoCurrency, fiatCurrency) {
    const mockPrices = {
      ETH: 2200,
      BTC: 42000,
      MATIC: 0.85,
      SOL: 95,
      USDC: 1,
      USDT: 1,
      DAI: 1
    };

    const priceInUSD = mockPrices[cryptoCurrency] || 1;
    const fiatAmount = cryptoAmount * priceInUSD;

    return parseFloat(fiatAmount.toFixed(2));
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(walletAddress) {
    return Array.from(this.transactions.values()).filter(
      (tx) =>
        tx.cryptoDetails?.walletAddress === walletAddress || tx.walletAddress === walletAddress
    );
  }

  /**
   * Calculate fees
   */
  calculateFees(amount, provider, paymentMethod) {
    const fees = {
      moonpay: {
        card: 0.045,
        bank_transfer: 0.01,
        apple_pay: 0.045,
        google_pay: 0.045
      },
      stripe: {
        card: 0.029 + 0.3,
        apple_pay: 0.029 + 0.3,
        google_pay: 0.029 + 0.3
      },
      ramp: {
        card: 0.025,
        bank_transfer: 0.0,
        apple_pay: 0.025
      }
    };

    const feeRate = fees[provider]?.[paymentMethod] || 0.03;
    const feeAmount = typeof feeRate === 'number' ? amount * feeRate : feeRate;

    return {
      feeAmount: parseFloat(feeAmount.toFixed(2)),
      feeRate: feeRate,
      totalAmount: parseFloat((amount + feeAmount).toFixed(2))
    };
  }

  /**
   * Webhook handler for provider callbacks
   */
  async handleWebhook(provider, payload) {
    console.log(`Received webhook from ${provider}:`, payload);

    const transaction = this.transactions.get(payload.transactionId);
    if (transaction) {
      transaction.status = payload.status;
      transaction.updatedAt = new Date();

      if (payload.cryptoTransactionHash) {
        transaction.cryptoTransaction = {
          txHash: payload.cryptoTransactionHash,
          confirmations: payload.confirmations || 0
        };
      }
    }

    return { received: true };
  }

  /**
   * Get statistics
   */
  getStats() {
    const txArray = Array.from(this.transactions.values());

    return {
      totalTransactions: txArray.length,
      totalVolume: txArray.reduce((sum, tx) => sum + (tx.amount || 0), 0),
      successfulTransactions: txArray.filter((tx) => tx.status === 'succeeded').length,
      pendingTransactions: txArray.filter((tx) => tx.status === 'processing').length,
      byProvider: {
        moonpay: txArray.filter((tx) => tx.provider === 'moonpay').length,
        stripe: txArray.filter((tx) => tx.paymentMethod).length,
        ramp: txArray.filter((tx) => tx.provider === 'ramp').length
      },
      offRamps: txArray.filter((tx) => tx.type === 'off-ramp').length
    };
  }
}

export default FiatOnRamp;
