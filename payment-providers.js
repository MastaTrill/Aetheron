/**
 * Real Payment Provider Integration for Fiat On-Ramp
 * Adds MoonPay SDK and Stripe API with secure key management
 */

const crypto = require('crypto');
const https = require('https');

class PaymentProviderIntegration {
  constructor(config = {}) {
    this.moonpayApiKey = config.moonpayApiKey || process.env.MOONPAY_API_KEY;
    this.moonpaySecretKey = config.moonpaySecretKey || process.env.MOONPAY_SECRET_KEY;
    this.stripeSecretKey = config.stripeSecretKey || process.env.STRIPE_API_KEY;
    this.stripePublishableKey = config.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY;
    this.transakApiKey = config.transakApiKey || process.env.TRANSAK_API_KEY;
    this.transakSecretKey = config.transakSecretKey || process.env.TRANSAK_SECRET_KEY;

    this.validateKeys();
  }

  /**
   * Validate API keys are present
   */
  validateKeys() {
    if (!this.moonpayApiKey || !this.moonpaySecretKey) {
      console.warn('⚠️  MoonPay API keys not configured. MoonPay features will be unavailable.');
    }
    if (!this.stripeSecretKey || !this.stripePublishableKey) {
      console.warn('⚠️  Stripe API keys not configured. Stripe features will be unavailable.');
    }
    if (!this.transakApiKey || !this.transakSecretKey) {
      console.warn('⚠️  Transak API keys not configured. Transak features will be unavailable.');
    }
  }

  /**
   * MoonPay Integration - Get Quote
   */
  async getMoonPayQuote(params) {
    const { baseCurrency = 'USD', cryptocurrency = 'ETH', amount } = params;

    if (!this.moonpayApiKey) {
      throw new Error('MoonPay API key not configured');
    }

    return new Promise((resolve, reject) => {
      const queryParams = new URLSearchParams({
        apiKey: this.moonpayApiKey,
        baseCurrency,
        currency: cryptocurrency.toLowerCase(),
        baseCurrencyAmount: amount
      });

      const options = {
        hostname: 'api.moonpay.com',
        path: `/v3/currencies/${cryptocurrency.toLowerCase()}/quote?${queryParams}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`MoonPay API error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * MoonPay Integration - Generate Widget URL
   */
  generateMoonPayWidgetUrl(params) {
    const {
      walletAddress,
      cryptoCurrency = 'ETH',
      fiatCurrency = 'USD',
      amount,
      email,
      externalCustomerId
    } = params;

    if (!this.moonpayApiKey || !this.moonpaySecretKey) {
      throw new Error('MoonPay credentials not configured');
    }

    const queryParams = new URLSearchParams({
      apiKey: this.moonpayApiKey,
      currencyCode: cryptoCurrency.toLowerCase(),
      walletAddress,
      baseCurrencyCode: fiatCurrency.toLowerCase(),
      baseCurrencyAmount: amount.toString(),
      lockAmount: 'false',
      showWalletAddressForm: 'false',
      theme: 'dark',
      colorCode: '#00eaff'
    });

    if (email) queryParams.append('email', email);
    if (externalCustomerId) queryParams.append('externalCustomerId', externalCustomerId);

    // Generate signature for security
    const originalUrl = `?${queryParams.toString()}`;
    const signature = crypto
      .createHmac('sha256', this.moonpaySecretKey)
      .update(originalUrl)
      .digest('base64');

    queryParams.append('signature', signature);

    return {
      url: `https://buy.moonpay.com?${queryParams.toString()}`,
      provider: 'moonpay'
    };
  }

  /**
   * Stripe Integration - Create Payment Intent
   */
  async createStripePaymentIntent(params) {
    const { amount, currency = 'USD', metadata = {} } = params;

    if (!this.stripeSecretKey) {
      throw new Error('Stripe API key not configured');
    }

    return new Promise((resolve, reject) => {
      const data = new URLSearchParams({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        'metadata[cryptoCurrency]': metadata.cryptoCurrency || 'ETH',
        'metadata[walletAddress]': metadata.walletAddress || '',
        'metadata[userId]': metadata.userId || ''
      });

      const options = {
        hostname: 'api.stripe.com',
        path: '/v1/payment_intents',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.toString().length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            const paymentIntent = JSON.parse(responseData);
            resolve({
              id: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: paymentIntent.status
            });
          } else {
            reject(new Error(`Stripe API error: ${res.statusCode} - ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data.toString());
      req.end();
    });
  }

  /**
   * Stripe Integration - Confirm Payment Intent
   */
  async confirmStripePaymentIntent(paymentIntentId, paymentMethodId) {
    if (!this.stripeSecretKey) {
      throw new Error('Stripe API key not configured');
    }

    return new Promise((resolve, reject) => {
      const data = new URLSearchParams({
        payment_method: paymentMethodId
      });

      const options = {
        hostname: 'api.stripe.com',
        path: `/v1/payment_intents/${paymentIntentId}/confirm`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.toString().length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(responseData));
          } else {
            reject(new Error(`Stripe API error: ${res.statusCode} - ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data.toString());
      req.end();
    });
  }

  /**
   * Stripe Integration - Get Publishable Key (for frontend)
   */
  getStripePublishableKey() {
    if (!this.stripePublishableKey) {
      throw new Error('Stripe publishable key not configured');
    }
    return this.stripePublishableKey;
  }

  /**
   * Transak Integration - Generate Widget URL
   */
  generateTransakWidgetUrl(params) {
    const {
      walletAddress,
      cryptoCurrency = 'ETH',
      fiatCurrency = 'USD',
      amount,
      email,
      networks = 'ethereum'
    } = params;

    if (!this.transakApiKey) {
      throw new Error('Transak API key not configured');
    }

    const queryParams = new URLSearchParams({
      apiKey: this.transakApiKey,
      cryptoCurrencyCode: cryptoCurrency,
      walletAddress,
      fiatCurrency,
      fiatAmount: amount.toString(),
      networks,
      defaultCryptoCurrency: cryptoCurrency,
      defaultFiatCurrency: fiatCurrency,
      defaultPaymentMethod: 'credit_debit_card',
      themeColor: '00eaff',
      hideMenu: 'true'
    });

    if (email) queryParams.append('email', email);

    return {
      url: `https://global.transak.com/?${queryParams.toString()}`,
      provider: 'transak'
    };
  }

  /**
   * Webhook verification for MoonPay
   */
  verifyMoonPayWebhook(signature, payload) {
    if (!this.moonpaySecretKey) {
      throw new Error('MoonPay secret key not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.moonpaySecretKey)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Webhook verification for Stripe
   */
  verifyStripeWebhook(signature, payload) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      // In production, use: stripe.webhooks.constructEvent(payload, signature, webhookSecret)
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      return signature.includes(expectedSignature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if all required keys are configured
   */
  isFullyConfigured() {
    return {
      moonpay: !!(this.moonpayApiKey && this.moonpaySecretKey),
      stripe: !!(this.stripeSecretKey && this.stripePublishableKey),
      transak: !!(this.transakApiKey && this.transakSecretKey)
    };
  }

  /**
   * Get supported providers
   */
  getSupportedProviders() {
    const configured = this.isFullyConfigured();
    const providers = [];

    if (configured.moonpay) {
      providers.push({
        id: 'moonpay',
        name: 'MoonPay',
        supportedCurrencies: ['ETH', 'BTC', 'USDC', 'USDT'],
        supportedFiat: ['USD', 'EUR', 'GBP'],
        fees: '3.5% + network fees'
      });
    }

    if (configured.stripe) {
      providers.push({
        id: 'stripe',
        name: 'Stripe',
        supportedCurrencies: ['ETH', 'BTC', 'USDC'],
        supportedFiat: ['USD', 'EUR', 'GBP'],
        fees: '2.9% + $0.30'
      });
    }

    if (configured.transak) {
      providers.push({
        id: 'transak',
        name: 'Transak',
        supportedCurrencies: ['ETH', 'BTC', 'USDC', 'USDT', 'MATIC'],
        supportedFiat: ['USD', 'EUR', 'GBP', 'INR'],
        fees: '0.99% - 5.5%'
      });
    }

    return providers;
  }
}

module.exports = PaymentProviderIntegration;
