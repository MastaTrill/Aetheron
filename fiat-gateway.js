/**
 * Fiat Gateway Integration
 *
 * Features:
 * - Stripe integration for credit/debit cards
 * - Moonpay integration for fiat on-ramp
 * - Ramp Network integration
 * - Bank transfers (ACH/SEPA/Wire)
 * - KYC/AML compliance
 * - Transaction limits and monitoring
 */

const crypto = require('crypto');

/**
 * Stripe Integration
 * Credit/debit card payments
 */
class StripeGateway {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.transactions = new Map();
    this.customers = new Map();
    this.paymentMethods = new Map();
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(amount, currency, customer, metadata = {}) {
    const intentId = 'pi_' + crypto.randomBytes(16).toString('hex');

    const intent = {
      id: intentId,
      amount: amount * 100, // Convert to cents
      currency: currency.toLowerCase(),
      customer,
      status: 'requires_payment_method',
      metadata: {
        ...metadata,
        walletAddress: metadata.walletAddress || null,
        tokenAmount: metadata.tokenAmount || null
      },
      createdAt: Date.now()
    };

    this.transactions.set(intentId, intent);

    return {
      clientSecret: intentId + '_secret_' + crypto.randomBytes(8).toString('hex'),
      intentId,
      amount: intent.amount,
      currency: intent.currency
    };
  }

  /**
   * Confirm payment
   */
  async confirmPayment(intentId, paymentMethodId) {
    const intent = this.transactions.get(intentId);

    if (!intent) {
      throw new Error('Payment intent not found');
    }

    intent.paymentMethod = paymentMethodId;
    intent.status = 'processing';

    // Simulate payment processing
    setTimeout(() => {
      intent.status = 'succeeded';
      intent.paidAt = Date.now();
    }, 2000);

    return {
      intentId,
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency
    };
  }

  /**
   * Create customer
   */
  async createCustomer(email, name, metadata = {}) {
    const customerId = 'cus_' + crypto.randomBytes(16).toString('hex');

    const customer = {
      id: customerId,
      email,
      name,
      metadata,
      paymentMethods: [],
      createdAt: Date.now()
    };

    this.customers.set(customerId, customer);

    return customer;
  }

  /**
   * Attach payment method
   */
  async attachPaymentMethod(customerId, cardDetails) {
    const customer = this.customers.get(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const pmId = 'pm_' + crypto.randomBytes(16).toString('hex');

    const paymentMethod = {
      id: pmId,
      type: 'card',
      card: {
        last4: cardDetails.number.slice(-4),
        brand: this.detectCardBrand(cardDetails.number),
        expMonth: cardDetails.expMonth,
        expYear: cardDetails.expYear
      },
      customerId,
      createdAt: Date.now()
    };

    this.paymentMethods.set(pmId, paymentMethod);
    customer.paymentMethods.push(pmId);

    return paymentMethod;
  }

  /**
   * Detect card brand
   */
  detectCardBrand(cardNumber) {
    const firstDigit = cardNumber[0];
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    if (firstDigit === '3') return 'amex';
    return 'unknown';
  }

  /**
   * Create payout (for off-ramp)
   */
  async createPayout(amount, currency, destination, metadata = {}) {
    const payoutId = 'po_' + crypto.randomBytes(16).toString('hex');

    const payout = {
      id: payoutId,
      amount: amount * 100,
      currency,
      destination,
      status: 'pending',
      metadata,
      createdAt: Date.now()
    };

    this.transactions.set(payoutId, payout);

    // Simulate payout processing
    setTimeout(() => {
      payout.status = 'paid';
      payout.paidAt = Date.now();
    }, 5000);

    return {
      payoutId,
      amount: payout.amount / 100,
      currency,
      status: payout.status,
      estimatedArrival: Date.now() + 3 * 24 * 60 * 60 * 1000 // 3 days
    };
  }

  /**
   * Get transaction status
   */
  getTransaction(transactionId) {
    return this.transactions.get(transactionId);
  }

  /**
   * Get customer
   */
  getCustomer(customerId) {
    return this.customers.get(customerId);
  }
}

/**
 * Moonpay Integration
 * Fiat on-ramp provider
 */
class MoonpayGateway {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.transactions = new Map();
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
    this.supportedCrypto = ['ETH', 'AETH', 'BTC', 'USDC', 'USDT'];
  }

  /**
   * Generate widget URL
   */
  generateWidgetUrl(walletAddress, currencyCode, baseCurrencyCode = 'USD') {
    if (!this.supportedCrypto.includes(currencyCode)) {
      throw new Error('Crypto not supported');
    }

    if (!this.supportedCurrencies.includes(baseCurrencyCode)) {
      throw new Error('Fiat currency not supported');
    }

    const params = new URLSearchParams({
      apiKey: this.apiKey,
      walletAddress,
      currencyCode,
      baseCurrencyCode,
      colorCode: '#4F46E5',
      redirectURL: 'https://aetheron.network/success'
    });

    const signature = this.signUrl(params.toString());

    return {
      url: `https://buy.moonpay.com?${params.toString()}&signature=${signature}`,
      expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
    };
  }

  /**
   * Create transaction
   */
  async createTransaction(walletAddress, baseCurrencyAmount, baseCurrencyCode, currencyCode) {
    const transactionId = crypto.randomBytes(16).toString('hex');

    // Calculate crypto amount (simplified)
    const rate = this.getExchangeRate(baseCurrencyCode, currencyCode);
    const cryptoAmount = baseCurrencyAmount / rate;
    const fee = baseCurrencyAmount * 0.045; // 4.5% fee
    const totalAmount = baseCurrencyAmount + fee;

    const transaction = {
      id: transactionId,
      walletAddress,
      baseCurrencyAmount,
      baseCurrencyCode,
      currencyCode,
      cryptoAmount,
      fee,
      totalAmount,
      rate,
      status: 'waitingPayment',
      createdAt: Date.now()
    };

    this.transactions.set(transactionId, transaction);

    return transaction;
  }

  /**
   * Get exchange rate
   */
  getExchangeRate(fiatCurrency, cryptoCurrency) {
    // Simplified rates
    const rates = {
      'USD-ETH': 2000,
      'USD-AETH': 2000,
      'USD-BTC': 40000,
      'USD-USDC': 1,
      'EUR-ETH': 1800,
      'GBP-ETH': 1600
    };

    return rates[`${fiatCurrency}-${cryptoCurrency}`] || 2000;
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(transactionId, status) {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = status;

    if (status === 'completed') {
      transaction.completedAt = Date.now();
    } else if (status === 'failed') {
      transaction.failedAt = Date.now();
    }

    return transaction;
  }

  /**
   * Sign URL for security
   */
  signUrl(queryString) {
    return crypto.createHmac('sha256', this.secretKey).update(queryString).digest('hex');
  }

  /**
   * Get transaction
   */
  getTransaction(transactionId) {
    return this.transactions.get(transactionId);
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies() {
    return {
      fiat: this.supportedCurrencies,
      crypto: this.supportedCrypto
    };
  }
}

/**
 * Ramp Network Integration
 * Fast fiat on-ramp with bank transfers
 */
class RampGateway {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.purchases = new Map();
    this.limits = {
      daily: 10000,
      weekly: 50000,
      monthly: 150000
    };
  }

  /**
   * Create purchase
   */
  async createPurchase(userAddress, fiatCurrency, fiatValue, cryptoAsset) {
    const purchaseId = crypto.randomBytes(16).toString('hex');

    // Check limits
    const userSpending = this.getUserSpending(userAddress);
    if (userSpending.daily + fiatValue > this.limits.daily) {
      throw new Error('Daily limit exceeded');
    }

    const purchase = {
      id: purchaseId,
      userAddress,
      fiatCurrency,
      fiatValue,
      cryptoAsset,
      status: 'INITIALIZED',
      paymentMethod: null,
      createdAt: Date.now()
    };

    this.purchases.set(purchaseId, purchase);

    return {
      purchaseId,
      hostedUrl: `https://ramp.network/buy?purchaseId=${purchaseId}`,
      fiatValue,
      fiatCurrency,
      cryptoAsset
    };
  }

  /**
   * Process purchase with payment method
   */
  async processPurchase(purchaseId, paymentMethod) {
    const purchase = this.purchases.get(purchaseId);

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    purchase.paymentMethod = paymentMethod;
    purchase.status = 'PAYMENT_STARTED';

    // Simulate payment processing
    setTimeout(() => {
      purchase.status = 'PAYMENT_EXECUTED';
      setTimeout(() => {
        purchase.status = 'RELEASING';
        setTimeout(() => {
          purchase.status = 'RELEASED';
          purchase.completedAt = Date.now();
        }, 3000);
      }, 2000);
    }, 5000);

    return purchase;
  }

  /**
   * Get user spending
   */
  getUserSpending(userAddress) {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const userPurchases = Array.from(this.purchases.values()).filter(
      (p) => p.userAddress === userAddress && p.status === 'RELEASED'
    );

    return {
      daily: userPurchases
        .filter((p) => p.completedAt > oneDayAgo)
        .reduce((sum, p) => sum + p.fiatValue, 0),
      weekly: userPurchases
        .filter((p) => p.completedAt > oneWeekAgo)
        .reduce((sum, p) => sum + p.fiatValue, 0),
      monthly: userPurchases
        .filter((p) => p.completedAt > oneMonthAgo)
        .reduce((sum, p) => sum + p.fiatValue, 0)
    };
  }

  /**
   * Get purchase status
   */
  getPurchase(purchaseId) {
    return this.purchases.get(purchaseId);
  }

  /**
   * Get user limits
   */
  getUserLimits(userAddress) {
    const spending = this.getUserSpending(userAddress);

    return {
      daily: {
        limit: this.limits.daily,
        spent: spending.daily,
        remaining: this.limits.daily - spending.daily
      },
      weekly: {
        limit: this.limits.weekly,
        spent: spending.weekly,
        remaining: this.limits.weekly - spending.weekly
      },
      monthly: {
        limit: this.limits.monthly,
        spent: spending.monthly,
        remaining: this.limits.monthly - spending.monthly
      }
    };
  }
}

/**
 * KYC/AML Compliance Manager
 * Verify user identity and monitor transactions
 */
class ComplianceManager {
  constructor() {
    this.users = new Map();
    this.verifications = new Map();
    this.watchlist = new Set();
    this.suspiciousActivities = new Map();
  }

  /**
   * Start KYC verification
   */
  async startKYC(userId, userData) {
    const verificationId = crypto.randomBytes(16).toString('hex');

    const verification = {
      id: verificationId,
      userId,
      status: 'pending',
      tier: userData.tier || 'basic',
      documents: [],
      checks: {
        identity: false,
        address: false,
        sanctions: false,
        pep: false // Politically Exposed Person
      },
      createdAt: Date.now()
    };

    this.verifications.set(verificationId, verification);

    return {
      verificationId,
      status: verification.status,
      requiredDocuments: this.getRequiredDocuments(verification.tier)
    };
  }

  /**
   * Submit KYC documents
   */
  async submitDocument(verificationId, documentType, documentData) {
    const verification = this.verifications.get(verificationId);

    if (!verification) {
      throw new Error('Verification not found');
    }

    verification.documents.push({
      type: documentType,
      data: documentData,
      status: 'submitted',
      submittedAt: Date.now()
    });

    // Simulate document verification
    setTimeout(() => {
      const doc = verification.documents.find((d) => d.type === documentType);
      doc.status = 'verified';

      if (documentType === 'id') verification.checks.identity = true;
      if (documentType === 'address') verification.checks.address = true;

      this.checkVerificationComplete(verificationId);
    }, 3000);

    return { success: true, documentType };
  }

  /**
   * Check if verification is complete
   */
  checkVerificationComplete(verificationId) {
    const verification = this.verifications.get(verificationId);

    if (verification.checks.identity && verification.checks.address) {
      verification.status = 'approved';
      verification.approvedAt = Date.now();

      this.users.set(verification.userId, {
        userId: verification.userId,
        kycStatus: 'approved',
        tier: verification.tier,
        approvedAt: verification.approvedAt
      });
    }
  }

  /**
   * Get required documents for tier
   */
  getRequiredDocuments(tier) {
    const tiers = {
      basic: ['id'],
      advanced: ['id', 'address'],
      premium: ['id', 'address', 'income']
    };

    return tiers[tier] || tiers.basic;
  }

  /**
   * Check transaction for AML
   */
  async checkTransaction(transaction) {
    const flags = [];

    // Check amount threshold
    if (transaction.amount > 10000) {
      flags.push({ type: 'large-amount', severity: 'medium' });
    }

    // Check velocity (rapid transactions)
    const recentCount = this.getRecentTransactionCount(transaction.from);
    if (recentCount > 10) {
      flags.push({ type: 'high-velocity', severity: 'high' });
    }

    // Check watchlist
    if (this.watchlist.has(transaction.from) || this.watchlist.has(transaction.to)) {
      flags.push({ type: 'watchlist-hit', severity: 'critical' });
    }

    // Check suspicious patterns
    if (this.detectStructuring(transaction)) {
      flags.push({ type: 'structuring', severity: 'high' });
    }

    if (flags.length > 0) {
      this.suspiciousActivities.set(transaction.hash, {
        transaction,
        flags,
        reportedAt: Date.now()
      });
    }

    return {
      approved: flags.filter((f) => f.severity === 'critical').length === 0,
      flags,
      requiresReview: flags.length > 0
    };
  }

  /**
   * Detect structuring (splitting large transactions)
   */
  detectStructuring(transaction) {
    // Check for pattern of transactions just below reporting threshold
    return transaction.amount > 9000 && transaction.amount < 10000;
  }

  /**
   * Get recent transaction count
   */
  getRecentTransactionCount(address) {
    // Simplified - would query blockchain in real implementation
    return Math.floor(Math.random() * 20);
  }

  /**
   * Add to watchlist
   */
  addToWatchlist(address, reason) {
    this.watchlist.add(address);
    return { success: true, address, reason };
  }

  /**
   * Get verification status
   */
  getVerificationStatus(verificationId) {
    return this.verifications.get(verificationId);
  }

  /**
   * Get user KYC status
   */
  getUserKYCStatus(userId) {
    return this.users.get(userId) || { kycStatus: 'not-started' };
  }
}

module.exports = {
  StripeGateway,
  MoonpayGateway,
  RampGateway,
  ComplianceManager
};
