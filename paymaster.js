/**
 * Paymaster Module - Gas Sponsorship for Gasless Transactions
 * Allows third parties to pay gas fees for users
 */

const crypto = require('crypto');

/**
 * Base Paymaster - Abstract gas sponsorship
 */
class Paymaster {
  constructor(owner, deposit = 0) {
    this.address = this.generateAddress(owner);
    this.owner = owner;
    this.deposit = deposit; // ETH deposited for gas payments
    this.isActive = true;
    this.totalSponsored = 0;
    this.sponsorshipCount = 0;
    this.createdAt = Date.now();
  }

  generateAddress(owner) {
    const hash = crypto
      .createHash('sha256')
      .update('PAYMASTER')
      .update(owner)
      .update(Date.now().toString())
      .digest('hex');
    return '0xPM' + hash.slice(0, 38);
  }

  /**
   * Validate sponsorship request
   */
  async validatePaymasterUserOp(userOp, requiredPreFund) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Post-operation accounting
   */
  async postOp(context, actualGasCost) {
    this.deposit -= actualGasCost;
    this.totalSponsored += actualGasCost;
    this.sponsorshipCount++;

    if (this.deposit < 0) {
      this.isActive = false;
      throw new Error('Paymaster out of funds');
    }

    return {
      success: true,
      remainingDeposit: this.deposit,
      cost: actualGasCost
    };
  }

  addDeposit(amount) {
    this.deposit += amount;
    if (this.deposit > 0) {
      this.isActive = true;
    }
  }

  withdraw(amount, to) {
    if (amount > this.deposit) {
      throw new Error('Insufficient deposit');
    }
    this.deposit -= amount;
    return { to, amount };
  }

  getStats() {
    return {
      address: this.address,
      owner: this.owner,
      deposit: this.deposit,
      totalSponsored: this.totalSponsored,
      sponsorshipCount: this.sponsorshipCount,
      isActive: this.isActive,
      averageCost: this.sponsorshipCount > 0 ? this.totalSponsored / this.sponsorshipCount : 0
    };
  }
}

/**
 * Whitelist Paymaster - Only sponsors whitelisted addresses
 */
class WhitelistPaymaster extends Paymaster {
  constructor(owner, deposit = 0) {
    super(owner, deposit);
    this.whitelist = new Set();
    this.perUserLimit = Infinity; // Max gas per user
    this.userSpending = new Map(); // Track per-user spending
  }

  addToWhitelist(addresses) {
    addresses.forEach((addr) => this.whitelist.add(addr));
  }

  removeFromWhitelist(addresses) {
    addresses.forEach((addr) => this.whitelist.delete(addr));
  }

  setPerUserLimit(limit) {
    this.perUserLimit = limit;
  }

  async validatePaymasterUserOp(userOp, requiredPreFund) {
    // Check if sender is whitelisted
    if (!this.whitelist.has(userOp.sender)) {
      return {
        valid: false,
        reason: 'Sender not whitelisted'
      };
    }

    // Check per-user spending limit
    const currentSpending = this.userSpending.get(userOp.sender) || 0;
    if (currentSpending + requiredPreFund > this.perUserLimit) {
      return {
        valid: false,
        reason: 'User spending limit exceeded'
      };
    }

    // Check paymaster has enough deposit
    if (this.deposit < requiredPreFund) {
      return {
        valid: false,
        reason: 'Paymaster insufficient deposit'
      };
    }

    // Update user spending
    this.userSpending.set(userOp.sender, currentSpending + requiredPreFund);

    return {
      valid: true,
      context: {
        sender: userOp.sender,
        preFund: requiredPreFund
      }
    };
  }

  getWhitelist() {
    return Array.from(this.whitelist);
  }

  getUserSpending(address) {
    return this.userSpending.get(address) || 0;
  }
}

/**
 * Token Paymaster - Users pay gas in ERC-20 tokens instead of ETH
 */
class TokenPaymaster extends Paymaster {
  constructor(owner, deposit, tokenAddress, tokenToEthRate) {
    super(owner, deposit);
    this.tokenAddress = tokenAddress;
    this.tokenToEthRate = tokenToEthRate; // How many tokens = 1 ETH
    this.tokenBalances = new Map(); // User token deposits
    this.tokenSymbol = 'TOKEN';
  }

  /**
   * Deposit tokens for future gas payments
   */
  depositToken(user, amount) {
    const current = this.tokenBalances.get(user) || 0;
    this.tokenBalances.set(user, current + amount);

    return {
      user,
      balance: current + amount,
      ethEquivalent: (current + amount) / this.tokenToEthRate
    };
  }

  async validatePaymasterUserOp(userOp, requiredPreFund) {
    const userTokenBalance = this.tokenBalances.get(userOp.sender) || 0;
    const requiredTokens = requiredPreFund * this.tokenToEthRate;

    // Check user has enough tokens
    if (userTokenBalance < requiredTokens) {
      return {
        valid: false,
        reason: `Insufficient tokens. Need ${requiredTokens}, have ${userTokenBalance}`
      };
    }

    // Check paymaster has ETH to pay network
    if (this.deposit < requiredPreFund) {
      return {
        valid: false,
        reason: 'Paymaster insufficient ETH deposit'
      };
    }

    return {
      valid: true,
      context: {
        sender: userOp.sender,
        tokenAmount: requiredTokens,
        ethAmount: requiredPreFund
      }
    };
  }

  async postOp(context, actualGasCost) {
    // Deduct tokens from user
    const actualTokenCost = actualGasCost * this.tokenToEthRate;
    const userBalance = this.tokenBalances.get(context.sender) || 0;
    this.tokenBalances.set(context.sender, userBalance - actualTokenCost);

    // Paymaster pays ETH
    return super.postOp(context, actualGasCost);
  }

  updateTokenRate(newRate) {
    this.tokenToEthRate = newRate;
  }

  getTokenBalance(user) {
    return this.tokenBalances.get(user) || 0;
  }
}

/**
 * Verifying Paymaster - Sponsors with signature verification
 */
class VerifyingPaymaster extends Paymaster {
  constructor(owner, deposit, signerAddress) {
    super(owner, deposit);
    this.signer = signerAddress;
    this.validUntil = Infinity;
    this.validAfter = 0;
  }

  async validatePaymasterUserOp(userOp, requiredPreFund) {
    // Extract paymaster data
    const paymasterData = this.parsePaymasterData(userOp.paymasterAndData);

    if (!paymasterData) {
      return { valid: false, reason: 'Invalid paymaster data' };
    }

    // Check time bounds
    const now = Date.now();
    if (now < paymasterData.validAfter || now > paymasterData.validUntil) {
      return { valid: false, reason: 'Signature expired or not yet valid' };
    }

    // Verify signature
    const hash = this.getHash(userOp, paymasterData.validUntil, paymasterData.validAfter);
    const isValid = this.verifySignature(hash, paymasterData.signature);

    if (!isValid) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // Check deposit
    if (this.deposit < requiredPreFund) {
      return { valid: false, reason: 'Insufficient deposit' };
    }

    return {
      valid: true,
      context: {
        sender: userOp.sender,
        validUntil: paymasterData.validUntil,
        validAfter: paymasterData.validAfter
      }
    };
  }

  parsePaymasterData(paymasterAndData) {
    if (!paymasterAndData || paymasterAndData === '0x') {
      return null;
    }

    // In real implementation, decode ABI-encoded data
    // For now, return mock data
    return {
      validUntil: Date.now() + 3600000, // 1 hour
      validAfter: Date.now(),
      signature: paymasterAndData.slice(-130) // Last 65 bytes
    };
  }

  getHash(userOp, validUntil, validAfter) {
    return crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          sender: userOp.sender,
          nonce: userOp.nonce,
          validUntil,
          validAfter
        })
      )
      .digest('hex');
  }

  verifySignature(hash, signature) {
    // In real implementation, verify ECDSA signature
    // For now, simple validation
    return signature && signature.length > 0;
  }

  /**
   * Create signature for user operation
   */
  signUserOp(userOp, validUntil, validAfter) {
    const hash = this.getHash(userOp, validUntil, validAfter);
    // In real implementation, sign with private key
    const signature = '0x' + crypto.createHash('sha256').update(hash).digest('hex');

    return {
      paymasterAndData:
        this.address +
        validUntil.toString(16).padStart(16, '0') +
        validAfter.toString(16).padStart(16, '0') +
        signature.slice(2),
      validUntil,
      validAfter
    };
  }
}

/**
 * Subscription Paymaster - Monthly/yearly gas subscriptions
 */
class SubscriptionPaymaster extends Paymaster {
  constructor(owner, deposit) {
    super(owner, deposit);
    this.subscriptions = new Map();
    this.plans = new Map();
  }

  /**
   * Define subscription plans
   */
  createPlan(planId, config) {
    this.plans.set(planId, {
      id: planId,
      price: config.price, // in tokens or ETH
      gasLimit: config.gasLimit, // max gas per period
      duration: config.duration, // in milliseconds
      features: config.features || []
    });
  }

  /**
   * Subscribe user to plan
   */
  subscribe(user, planId, payment) {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    if (payment < plan.price) {
      throw new Error('Insufficient payment');
    }

    const subscription = {
      user,
      plan: planId,
      startDate: Date.now(),
      endDate: Date.now() + plan.duration,
      gasUsed: 0,
      gasLimit: plan.gasLimit,
      active: true
    };

    this.subscriptions.set(user, subscription);
    this.deposit += payment; // Add payment to paymaster deposit

    return subscription;
  }

  async validatePaymasterUserOp(userOp, requiredPreFund) {
    const sub = this.subscriptions.get(userOp.sender);

    if (!sub) {
      return { valid: false, reason: 'No active subscription' };
    }

    // Check subscription is active
    const now = Date.now();
    if (now > sub.endDate) {
      sub.active = false;
      return { valid: false, reason: 'Subscription expired' };
    }

    // Check gas limit
    if (sub.gasUsed + requiredPreFund > sub.gasLimit) {
      return { valid: false, reason: 'Subscription gas limit exceeded' };
    }

    // Check paymaster deposit
    if (this.deposit < requiredPreFund) {
      return { valid: false, reason: 'Paymaster insufficient funds' };
    }

    sub.gasUsed += requiredPreFund;

    return {
      valid: true,
      context: {
        sender: userOp.sender,
        subscription: sub.plan,
        remainingGas: sub.gasLimit - sub.gasUsed
      }
    };
  }

  getSubscription(user) {
    return this.subscriptions.get(user);
  }

  cancelSubscription(user) {
    const sub = this.subscriptions.get(user);
    if (sub) {
      sub.active = false;
    }
  }

  getAllPlans() {
    return Array.from(this.plans.values());
  }
}

/**
 * Paymaster Manager - Manages multiple paymasters
 */
class PaymasterManager {
  constructor() {
    this.paymasters = new Map();
    this.defaultPaymaster = null;
  }

  registerPaymaster(paymaster) {
    this.paymasters.set(paymaster.address, paymaster);

    if (!this.defaultPaymaster) {
      this.defaultPaymaster = paymaster.address;
    }

    return paymaster.address;
  }

  getPaymaster(address) {
    return this.paymasters.get(address);
  }

  setDefaultPaymaster(address) {
    if (!this.paymasters.has(address)) {
      throw new Error('Paymaster not registered');
    }
    this.defaultPaymaster = address;
  }

  async processUserOperation(userOp) {
    let paymasterAddress = userOp.paymasterAndData?.slice(0, 42);

    if (!paymasterAddress || paymasterAddress === '0x') {
      paymasterAddress = this.defaultPaymaster;
    }

    if (!paymasterAddress) {
      return { sponsored: false, reason: 'No paymaster available' };
    }

    const paymaster = this.paymasters.get(paymasterAddress);
    if (!paymaster) {
      return { sponsored: false, reason: 'Paymaster not found' };
    }

    const requiredGas =
      userOp.callGasLimit + userOp.verificationGasLimit + userOp.preVerificationGas;
    const requiredPreFund = requiredGas * userOp.maxFeePerGas;

    const validation = await paymaster.validatePaymasterUserOp(userOp, requiredPreFund);

    return {
      sponsored: validation.valid,
      paymaster: paymasterAddress,
      validation,
      requiredPreFund
    };
  }

  getAllPaymasters() {
    return Array.from(this.paymasters.values()).map((pm) => pm.getStats());
  }

  getTotalStats() {
    const all = Array.from(this.paymasters.values());
    return {
      totalPaymasters: all.length,
      activePaymasters: all.filter((pm) => pm.isActive).length,
      totalDeposit: all.reduce((sum, pm) => sum + pm.deposit, 0),
      totalSponsored: all.reduce((sum, pm) => sum + pm.totalSponsored, 0),
      totalSponsorships: all.reduce((sum, pm) => sum + pm.sponsorshipCount, 0)
    };
  }
}

module.exports = {
  Paymaster,
  WhitelistPaymaster,
  TokenPaymaster,
  VerifyingPaymaster,
  SubscriptionPaymaster,
  PaymasterManager
};
