/**
 * Account Abstraction Module (ERC-4337 Compatible)
 * Implements smart contract wallets with flexible validation and execution logic
 */

const crypto = require('crypto');
const { verifySignature } = require('./encryption');

/**
 * Smart Account - User's programmable wallet
 */
class SmartAccount {
  constructor(owner, options = {}) {
    this.address = this.generateAccountAddress(owner);
    this.owner = owner;
    this.nonce = 0;
    this.balance = 0;
    this.isDeployed = false;

    // Configurable validation logic
    this.validationRules = options.validationRules || [];
    this.executionRules = options.executionRules || [];

    // Multi-sig support
    this.signers = options.signers || [owner];
    this.threshold = options.threshold || 1;

    // Module plugins
    this.modules = new Map(); // Additional functionality
    this.hooks = { pre: [], post: [] }; // Execution hooks

    this.createdAt = Date.now();
  }

  generateAccountAddress(owner) {
    const hash = crypto
      .createHash('sha256')
      .update(owner)
      .digest('hex');
    return '0xAA' + hash.slice(0, 38); // AA prefix for Account Abstraction
  }

  /**
   * Create and validate user operation
   */
  createUserOperation(operation) {
    return {
      sender: this.address,
      nonce: this.nonce,
      initCode: this.isDeployed ? '0x' : this.getInitCode(),
      callData: this.encodeCallData(operation),
      callGasLimit: operation.gasLimit || 100000,
      verificationGasLimit: 50000,
      preVerificationGas: 21000,
      maxFeePerGas: operation.maxFeePerGas || 1000000000,
      maxPriorityFeePerGas: operation.maxPriorityFeePerGas || 1000000000,
      paymasterAndData: operation.paymaster || '0x',
      signature: '0x',
      timestamp: Date.now()
    };
  }

  getInitCode() {
    // Deployment bytecode for account creation
    return '0x608060405234801561001057600080fd5b50...'; // Simplified
  }

  encodeCallData(operation) {
    const { target, value, data } = operation;
    // ABI encode: function execute(address target, uint256 value, bytes data)
    return crypto
      .createHash('sha256')
      .update(JSON.stringify({ target, value, data }))
      .digest('hex');
  }

  /**
   * Validate user operation signature and rules
   */
  async validateUserOperation(userOp, signature) {
    // 1. Check nonce
    if (userOp.nonce !== this.nonce) {
      return { valid: false, reason: 'Invalid nonce' };
    }

    // 2. Verify signature
    const message = this.getUserOpHash(userOp);
    const isValidSig = await verifySignature(message, signature, this.owner);

    if (!isValidSig) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // 3. Check multi-sig threshold
    if (this.signers.length > 1) {
      const validSigners = await this.verifyMultiSig(userOp, signature);
      if (validSigners < this.threshold) {
        return { valid: false, reason: `Need ${this.threshold} signatures, got ${validSigners}` };
      }
    }

    // 4. Custom validation rules
    for (const rule of this.validationRules) {
      const result = await rule(userOp, this);
      if (!result.valid) {
        return result;
      }
    }

    // 5. Check gas limits
    if (userOp.callGasLimit > 1000000) {
      return { valid: false, reason: 'Gas limit too high' };
    }

    return { valid: true, validUntil: Date.now() + 300000, validAfter: Date.now() };
  }

  getUserOpHash(userOp) {
    return crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          sender: userOp.sender,
          nonce: userOp.nonce,
          callData: userOp.callData,
          callGasLimit: userOp.callGasLimit
        })
      )
      .digest('hex');
  }

  async verifyMultiSig(userOp, signatures) {
    // In real implementation, verify multiple signatures
    return this.threshold;
  }

  /**
   * Execute user operation after validation
   */
  async executeUserOperation(userOp, blockchain) {
    try {
      // Run pre-execution hooks
      for (const hook of this.hooks.pre) {
        await hook(userOp, this);
      }

      // Parse call data
      const { target, value, data } = this.decodeCallData(userOp.callData);

      // Execute the operation
      const result = await this.executeCall(target, value, data, blockchain);

      // Update nonce
      this.nonce++;

      // Run post-execution hooks
      for (const hook of this.hooks.post) {
        await hook(userOp, result, this);
      }

      return {
        success: true,
        result,
        gasUsed: userOp.callGasLimit,
        transactionHash: crypto.randomBytes(32).toString('hex')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        gasUsed: userOp.callGasLimit
      };
    }
  }

  decodeCallData(callData) {
    // Simplified decoding
    return {
      target: '0x' + callData.slice(0, 40),
      value: 0,
      data: '0x' + callData.slice(40)
    };
  }

  async executeCall(target, value, data, blockchain) {
    // Execute the actual transaction on blockchain
    if (value > this.balance) {
      throw new Error('Insufficient balance');
    }

    this.balance -= value;

    return {
      to: target,
      value,
      data,
      from: this.address
    };
  }

  /**
   * Add module to extend account functionality
   */
  addModule(name, module) {
    this.modules.set(name, module);
    if (module.onInstall) {
      module.onInstall(this);
    }
  }

  removeModule(name) {
    const module = this.modules.get(name);
    if (module && module.onUninstall) {
      module.onUninstall(this);
    }
    this.modules.delete(name);
  }

  /**
   * Add execution hook
   */
  addHook(type, hook) {
    if (type === 'pre' || type === 'post') {
      this.hooks[type].push(hook);
    }
  }
}

/**
 * Account Factory - Creates new smart accounts
 */
class AccountFactory {
  constructor() {
    this.accounts = new Map();
    this.deploymentCost = 50000; // Gas cost
  }

  /**
   * Create new smart account
   */
  createAccount(owner, options = {}) {
    const account = new SmartAccount(owner, options);
    this.accounts.set(account.address, account);

    return {
      address: account.address,
      owner: account.owner,
      isDeployed: false,
      deploymentCost: this.deploymentCost
    };
  }

  /**
   * Deploy account on-chain
   */
  async deployAccount(address, blockchain) {
    const account = this.accounts.get(address);
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.isDeployed) {
      throw new Error('Account already deployed');
    }

    // Create deployment transaction
    const deployTx = {
      from: '0x0000000000000000000000000000000000000000',
      to: null,
      data: account.getInitCode(),
      gasLimit: this.deploymentCost,
      timestamp: Date.now()
    };

    // Deploy to blockchain
    account.isDeployed = true;
    account.balance = 0;

    return {
      success: true,
      address: account.address,
      deploymentTx: deployTx,
      gasUsed: this.deploymentCost
    };
  }

  getAccount(address) {
    return this.accounts.get(address);
  }

  getAllAccounts() {
    return Array.from(this.accounts.values()).map((acc) => ({
      address: acc.address,
      owner: acc.owner,
      nonce: acc.nonce,
      balance: acc.balance,
      isDeployed: acc.isDeployed,
      signers: acc.signers.length,
      modules: acc.modules.size
    }));
  }
}

/**
 * User Operation Mempool - Stores pending operations
 */
class UserOperationMempool {
  constructor() {
    this.operations = new Map();
    this.maxSize = 1000;
  }

  /**
   * Add user operation to mempool
   */
  async addUserOperation(userOp, account) {
    if (this.operations.size >= this.maxSize) {
      this.evictOldest();
    }

    const opHash = this.getOperationHash(userOp);

    // Validate operation
    const validation = await account.validateUserOperation(userOp, userOp.signature);

    if (!validation.valid) {
      throw new Error(`Invalid operation: ${validation.reason}`);
    }

    this.operations.set(opHash, {
      userOp,
      account: account.address,
      validation,
      addedAt: Date.now()
    });

    return opHash;
  }

  getOperationHash(userOp) {
    return crypto.createHash('sha256').update(JSON.stringify(userOp)).digest('hex');
  }

  /**
   * Get operations ready for bundling
   */
  getPendingOperations(limit = 10) {
    const pending = Array.from(this.operations.entries())
      .filter(([hash, op]) => {
        // Check if still valid
        return op.validation.validUntil > Date.now();
      })
      .slice(0, limit);

    return pending.map(([hash, op]) => ({
      hash,
      ...op.userOp
    }));
  }

  removeOperation(hash) {
    this.operations.delete(hash);
  }

  evictOldest() {
    const oldest = Array.from(this.operations.entries()).sort(
      (a, b) => a[1].addedAt - b[1].addedAt
    )[0];

    if (oldest) {
      this.operations.delete(oldest[0]);
    }
  }

  getSize() {
    return this.operations.size;
  }

  clear() {
    this.operations.clear();
  }
}

/**
 * Entry Point - Main contract for handling user operations
 */
class EntryPoint {
  constructor(accountFactory, mempool) {
    this.accountFactory = accountFactory;
    this.mempool = mempool;
    this.bundlers = new Set();
    this.depositBalances = new Map(); // For gas payments
  }

  /**
   * Handle user operation (main entry point)
   */
  async handleOps(userOps, beneficiary) {
    const results = [];

    for (const userOp of userOps) {
      const account = this.accountFactory.getAccount(userOp.sender);

      if (!account) {
        results.push({
          success: false,
          reason: 'Account not found'
        });
        continue;
      }

      // Deploy account if needed
      if (!account.isDeployed && userOp.initCode !== '0x') {
        await this.accountFactory.deployAccount(account.address);
      }

      // Validate
      const validation = await account.validateUserOperation(userOp, userOp.signature);

      if (!validation.valid) {
        results.push({
          success: false,
          reason: validation.reason
        });
        continue;
      }

      // Execute
      const result = await account.executeUserOperation(userOp, null);

      // Handle gas payment
      if (userOp.paymasterAndData === '0x') {
        // User pays gas
        this.chargeGas(account.address, result.gasUsed);
      }

      results.push(result);

      // Remove from mempool if it was there
      const opHash = this.mempool.getOperationHash(userOp);
      this.mempool.removeOperation(opHash);
    }

    // Pay beneficiary (bundler)
    const totalGas = results.reduce((sum, r) => sum + (r.gasUsed || 0), 0);
    this.rewardBundler(beneficiary, totalGas);

    return results;
  }

  chargeGas(account, gasUsed) {
    const acc = this.accountFactory.getAccount(account);
    if (acc) {
      acc.balance -= gasUsed * 1000000000; // Simple gas price
    }
  }

  rewardBundler(beneficiary, gasAmount) {
    const current = this.depositBalances.get(beneficiary) || 0;
    this.depositBalances.set(beneficiary, current + gasAmount * 1000000000);
  }

  /**
   * Deposit for gas payments
   */
  depositTo(account, amount) {
    const current = this.depositBalances.get(account) || 0;
    this.depositBalances.set(account, current + amount);
  }

  getDepositBalance(account) {
    return this.depositBalances.get(account) || 0;
  }

  /**
   * Register bundler
   */
  registerBundler(address) {
    this.bundlers.add(address);
  }

  isBundler(address) {
    return this.bundlers.has(address);
  }
}

/**
 * Validation Rules - Common validation logic
 */
const ValidationRules = {
  // Spending limit per day
  dailySpendingLimit: (limit) => async (userOp, account) => {
    const today = new Date().toDateString();
    if (!account._dailySpending) account._dailySpending = {};
    if (!account._dailySpending[today]) account._dailySpending[today] = 0;

    const { value } = account.decodeCallData(userOp.callData);

    if (account._dailySpending[today] + value > limit) {
      return { valid: false, reason: 'Daily spending limit exceeded' };
    }

    account._dailySpending[today] += value;
    return { valid: true };
  },

  // Whitelist addresses only
  whitelistOnly: (whitelist) => async (userOp, account) => {
    const { target } = account.decodeCallData(userOp.callData);

    if (!whitelist.includes(target)) {
      return { valid: false, reason: 'Target not whitelisted' };
    }

    return { valid: true };
  },

  // Time-based restrictions
  timeRestriction: (allowedHours) => async (_userOp, _account) => {
    const hour = new Date().getHours();

    if (!allowedHours.includes(hour)) {
      return { valid: false, reason: 'Operation not allowed at this time' };
    }

    return { valid: true };
  }
};

/**
 * High-level Account Abstraction wrapper
 */
class AccountAbstraction {
  constructor(options = {}) {
    this.bundlerUrl = options.bundlerUrl;
    this.paymasterUrl = options.paymasterUrl;
    this.factory = new AccountFactory();
    this.mempool = new UserOperationMempool();
    this.entryPoint = new EntryPoint(this.factory, this.mempool);
    this.accounts = new Map();
    this.sessionKeys = new Map();
  }

  async createSmartAccount(provider, profile) {
    // Create deterministic owner string from provider and profile
    const owner = `${provider}:${profile.id || profile.email || JSON.stringify(profile)}`;
    const account = await this.factory.createAccount(owner, { provider, profile });
    this.accounts.set(account.address, account);

    return {
      success: true,
      account: {
        address: account.address,
        provider,
        profile,
        isDeployed: account.isDeployed
      }
    };
  }

  async createSessionKey(accountAddress, permissions) {
    const sessionKey = {
      key: '0x' + Math.random().toString(16).substr(2, 40),
      accountAddress,
      permissions,
      createdAt: Date.now(),
      expiresAt: permissions.validUntil || (Date.now() + 86400000),
      active: true
    };

    this.sessionKeys.set(sessionKey.key, sessionKey);

    return {
      success: true,
      sessionKey: sessionKey.key,
      permissions,
      expiresAt: sessionKey.expiresAt
    };
  }

  async executeWithSessionKey(sessionKey, transaction) {
    const session = this.sessionKeys.get(sessionKey);

    if (!session || !session.active) {
      return { success: false, error: 'Invalid or inactive session key' };
    }

    // Check if transaction value exceeds session limit
    if (session.permissions.maxAmount) {
      const maxAmount = BigInt(session.permissions.maxAmount);
      const txValue = BigInt(transaction.value);

      if (txValue > maxAmount) {
        return {
          success: false,
          error: 'Transaction value exceeds session key limit'
        };
      }
    }

    return {
      success: true,
      userOpHash: '0x' + Math.random().toString(16).substr(2, 64),
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      gasUsed: 21000
    };
  }

  revokeSessionKey(sessionKey) {
    const session = this.sessionKeys.get(sessionKey);

    if (session) {
      session.active = false;
      return { success: true };
    }

    return { success: false, error: 'Session key not found' };
  }

  getActiveSessions(accountAddress) {
    const sessions = [];
    for (const [key, session] of this.sessionKeys.entries()) {
      if (session.accountAddress === accountAddress && session.active) {
        sessions.push(key);
      }
    }
    return sessions;
  }

  async sponsorGas(accountAddress, sponsorAddress, amount) {
    return {
      success: true,
      sponsored: true,
      sponsoredAmount: amount,
      paymasterAddress: '0x' + Math.random().toString(16).substr(2, 40)
    };
  }

  async batchTransactions(accountAddress, transactions) {
    return {
      success: true,
      userOpHash: '0x' + Math.random().toString(16).substr(2, 64),
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      batchSize: transactions.length,
      count: transactions.length
    };
  }

  async recoverAccount(provider, profile) {
    // Create deterministic owner string from provider and profile
    const owner = `${provider}:${profile.id || profile.email || JSON.stringify(profile)}`;

    // Try to find existing account with same provider and profile
    const account = await this.factory.createAccount(owner, { provider, profile });
    const existing = this.accounts.get(account.address);

    if (existing) {
      return {
        success: true,
        account: {
          address: existing.address,
          provider,
          profile,
          isDeployed: existing.isDeployed
        },
        recovered: true
      };
    }

    // Create new account
    this.accounts.set(account.address, account);
    return {

      success: true,
      account: {
        address: account.address,
        provider,
        profile,
        isDeployed: account.isDeployed
      },
      recovered: false
    };
  }

  async addRecovery(accountAddress, guardians, threshold) {
    const account = this.accounts.get(accountAddress);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    account.recovery = { guardians, threshold };

    return { success: true, guardians, threshold };
  }

  async initiateRecovery(accountAddress, newOwner, guardianSignatures) {
    return {
      success: true,
      recoveryId: 'recovery_' + Math.random().toString(16).substr(2, 16),
      newOwner
    };
  }

  getAllAccounts() {
    return Array.from(this.accounts.values());
  }
}

module.exports = AccountAbstraction;
module.exports.AccountAbstraction = AccountAbstraction;
module.exports.SmartAccount = SmartAccount;
module.exports.AccountFactory = AccountFactory;
module.exports.UserOperationMempool = UserOperationMempool;
module.exports.EntryPoint = EntryPoint;
module.exports.ValidationRules = ValidationRules;
