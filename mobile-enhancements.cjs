/**
 * Mobile-First Enhancements for Aetheron
 * Features: WalletConnect v2, Biometric Auth, NFC Payments, Offline Transactions
 */

const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * WalletConnect v2 Integration
 */
class WalletConnectSystem extends EventEmitter {
  constructor(blockchain) {
    super();
    this.blockchain = blockchain;
    this.activeSessions = new Map();
    this.pendingRequests = new Map();
    this.supportedChains = ['ethereum', 'polygon', 'bsc', 'avalanche', 'solana'];
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize WalletConnect session
   */
  async initializeSession(walletAddress, dappMetadata) {
    const sessionId = `WC_${crypto.randomBytes(16).toString('hex')}`;

    const session = {
      id: sessionId,
      walletAddress,
      dappMetadata: {
        name: dappMetadata.name || 'Aetheron',
        description: dappMetadata.description || 'Decentralized Blockchain Platform',
        url: dappMetadata.url || 'https://aetheron.io',
        icons: dappMetadata.icons || []
      },
      chains: dappMetadata.chains || ['eip155:1'], // Ethereum mainnet default
      methods: [
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain'
      ],
      events: ['chainChanged', 'accountsChanged'],
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      pairingUri: this.generatePairingUri(sessionId)
    };

    this.activeSessions.set(sessionId, session);

    // Simulate QR code generation for mobile wallet
    session.qrCode = await this.generateQRCode(session.pairingUri);

    return session;
  }

  /**
   * Approve session connection
   */
  async approveSession(sessionId, approvedChains = null, approvedMethods = null) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'active';
    session.approvedAt = Date.now();

    if (approvedChains) session.chains = approvedChains;
    if (approvedMethods) session.methods = approvedMethods;

    this.emit('sessionApproved', { sessionId, walletAddress: session.walletAddress });

    return session;
  }

  /**
   * Handle WalletConnect request
   */
  async handleRequest(sessionId, request) {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error('Invalid session');
    }

    const requestId = `REQ_${crypto.randomBytes(8).toString('hex')}`;

    const wcRequest = {
      id: requestId,
      sessionId,
      method: request.method,
      params: request.params,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.pendingRequests.set(requestId, wcRequest);

    // Route request based on method
    let result;
    try {
      switch (request.method) {
      case 'eth_sendTransaction':
        result = await this.handleSendTransaction(wcRequest);
        break;
      case 'eth_signTransaction':
        result = await this.handleSignTransaction(wcRequest);
        break;
      case 'personal_sign':
        result = await this.handlePersonalSign(wcRequest);
        break;
      case 'eth_signTypedData':
        result = await this.handleSignTypedData(wcRequest);
        break;
      default:
        throw new Error(`Unsupported method: ${request.method}`);
      }

      wcRequest.status = 'completed';
      wcRequest.result = result;

    } catch (error) {
      wcRequest.status = 'failed';
      wcRequest.error = error.message;
    }

    this.emit('requestHandled', { requestId, sessionId, status: wcRequest.status });

    return wcRequest;
  }

  /**
   * Handle send transaction
   */
  async handleSendTransaction(request) {
    const tx = request.params[0];

    // Validate transaction
    if (!tx.to || !tx.value) {
      throw new Error('Invalid transaction parameters');
    }

    // Simulate transaction sending
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

    // In real implementation, this would interact with blockchain
    await new Promise(resolve => setTimeout(resolve, 500));

    return txHash;
  }

  /**
   * Handle sign transaction
   */
  async handleSignTransaction(request) {
    const tx = request.params[0];

    // Simulate transaction signing
    const signedTx = {
      ...tx,
      signature: `0x${crypto.randomBytes(65).toString('hex')}`
    };

    return signedTx;
  }

  /**
   * Handle personal sign
   */
  async handlePersonalSign(request) {
    const [message, address] = request.params;

    // Simulate message signing
    const signature = `0x${crypto.randomBytes(65).toString('hex')}`;

    return signature;
  }

  /**
   * Handle sign typed data
   */
  async handleSignTypedData(request) {
    const [address, typedData] = request.params;

    // Simulate typed data signing
    const signature = `0x${crypto.randomBytes(65).toString('hex')}`;

    return signature;
  }

  /**
   * Generate pairing URI
   */
  generatePairingUri(sessionId) {
    // Simplified URI generation
    return `wc:${sessionId}@2?relay-protocol=irn&symKey=${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate QR code (mock)
   */
  async generateQRCode(uri) {
    // In real implementation, use QR code library
    return {
      uri,
      qrCodeData: `QR_CODE_FOR_${uri}`,
      size: 256
    };
  }

  /**
   * Disconnect session
   */
  async disconnectSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'disconnected';
      session.disconnectedAt = Date.now();

      this.emit('sessionDisconnected', { sessionId });
    }
  }

  /**
   * Get active sessions for wallet
   */
  getActiveSessions(walletAddress) {
    return Array.from(this.activeSessions.values())
      .filter(session => session.walletAddress === walletAddress && session.status === 'active');
  }

  /**
   * Clean expired sessions
   */
  cleanExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.activeSessions) {
      if (now > session.expiresAt && session.status === 'active') {
        this.disconnectSession(sessionId);
      }
    }
  }
}

/**
 * Biometric Authentication System
 */
class BiometricAuthSystem extends EventEmitter {
  constructor() {
    super();
    this.enrolledUsers = new Map();
    this.authSessions = new Map();
    this.supportedBiometrics = ['fingerprint', 'face', 'iris', 'voice'];
    this.sessionTimeout = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Enroll biometric for user
   */
  async enrollBiometric(userAddress, biometricType, biometricData) {
    if (!this.supportedBiometrics.includes(biometricType)) {
      throw new Error(`Unsupported biometric type: ${biometricType}`);
    }

    const enrollmentId = `BIO_${crypto.randomBytes(8).toString('hex')}`;

    const enrollment = {
      id: enrollmentId,
      userAddress,
      biometricType,
      biometricHash: await this.hashBiometricData(biometricData),
      enrolledAt: Date.now(),
      lastUsed: Date.now(),
      failedAttempts: 0,
      isActive: true,
      deviceId: biometricData.deviceId,
      backupCodes: this.generateBackupCodes()
    };

    // Store enrollment (in real implementation, use secure storage)
    this.enrolledUsers.set(`${userAddress}_${biometricType}`, enrollment);

    return {
      enrollmentId,
      biometricType,
      backupCodes: enrollment.backupCodes
    };
  }

  /**
   * Authenticate with biometric
   */
  async authenticateBiometric(userAddress, biometricType, biometricData, action = 'login') {
    const enrollmentKey = `${userAddress}_${biometricType}`;
    const enrollment = this.enrolledUsers.get(enrollmentKey);

    if (!enrollment || !enrollment.isActive) {
      throw new Error('Biometric not enrolled or inactive');
    }

    // Verify biometric data
    const isValid = await this.verifyBiometricData(enrollment.biometricHash, biometricData);

    if (!isValid) {
      enrollment.failedAttempts++;
      if (enrollment.failedAttempts >= 5) {
        enrollment.isActive = false;
        this.emit('biometricLocked', { userAddress, biometricType });
      }
      throw new Error('Biometric verification failed');
    }

    // Reset failed attempts on success
    enrollment.failedAttempts = 0;
    enrollment.lastUsed = Date.now();

    // Create auth session
    const sessionId = `AUTH_${crypto.randomBytes(8).toString('hex')}`;
    const session = {
      id: sessionId,
      userAddress,
      biometricType,
      action,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      isActive: true
    };

    this.authSessions.set(sessionId, session);

    this.emit('biometricAuthSuccess', { userAddress, biometricType, action, sessionId });

    return {
      success: true,
      sessionId,
      action,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Authenticate with backup code
   */
  async authenticateWithBackupCode(userAddress, biometricType, backupCode) {
    const enrollmentKey = `${userAddress}_${biometricType}`;
    const enrollment = this.enrolledUsers.get(enrollmentKey);

    if (!enrollment || !enrollment.backupCodes.includes(backupCode)) {
      throw new Error('Invalid backup code');
    }

    // Remove used backup code
    enrollment.backupCodes = enrollment.backupCodes.filter(code => code !== backupCode);

    // Create auth session
    const sessionId = `AUTH_${crypto.randomBytes(8).toString('hex')}`;
    const session = {
      id: sessionId,
      userAddress,
      biometricType,
      action: 'backup_auth',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      isActive: true
    };

    this.authSessions.set(sessionId, session);

    return {
      success: true,
      sessionId,
      method: 'backup_code'
    };
  }

  /**
   * Validate auth session
   */
  validateAuthSession(sessionId) {
    const session = this.authSessions.get(sessionId);
    if (!session || !session.isActive) return false;

    if (Date.now() > session.expiresAt) {
      session.isActive = false;
      return false;
    }

    return true;
  }

  /**
   * Revoke biometric enrollment
   */
  async revokeBiometric(userAddress, biometricType) {
    const enrollmentKey = `${userAddress}_${biometricType}`;
    const enrollment = this.enrolledUsers.get(enrollmentKey);

    if (enrollment) {
      enrollment.isActive = false;
      enrollment.revokedAt = Date.now();

      this.emit('biometricRevoked', { userAddress, biometricType });
    }
  }

  /**
   * Get user's enrolled biometrics
   */
  getUserBiometrics(userAddress) {
    const userBiometrics = [];

    for (const [key, enrollment] of this.enrolledUsers) {
      if (key.startsWith(`${userAddress}_`) && enrollment.isActive) {
        userBiometrics.push({
          type: enrollment.biometricType,
          enrolledAt: enrollment.enrolledAt,
          lastUsed: enrollment.lastUsed,
          deviceId: enrollment.deviceId
        });
      }
    }

    return userBiometrics;
  }

  /**
   * Hash biometric data (mock)
   */
  async hashBiometricData(biometricData) {
    // In real implementation, use proper cryptographic hashing
    const dataString = JSON.stringify(biometricData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Verify biometric data (mock)
   */
  async verifyBiometricData(storedHash, biometricData) {
    // In real implementation, use proper biometric verification
    const dataHash = await this.hashBiometricData(biometricData);
    return dataHash === storedHash;
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}

/**
 * NFC Payment System
 */
class NFCPaymentSystem extends EventEmitter {
  constructor(blockchain, walletConnect) {
    super();
    this.blockchain = blockchain;
    this.walletConnect = walletConnect;
    this.nfcSessions = new Map();
    this.paymentRequests = new Map();
    this.supportedCurrencies = ['ETH', 'USDC', 'USDT', 'WBTC'];
  }

  /**
   * Initialize NFC payment session
   */
  async initializeNFCPayment(merchantAddress, amount, currency = 'ETH', metadata = {}) {
    const sessionId = `NFC_${crypto.randomBytes(8).toString('hex')}`;

    const session = {
      id: sessionId,
      merchantAddress,
      amount,
      currency,
      status: 'waiting',
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
      metadata: {
        merchantName: metadata.merchantName || 'Unknown Merchant',
        location: metadata.location,
        items: metadata.items || [],
        ...metadata
      },
      nfcData: await this.generateNFCData(sessionId)
    };

    this.nfcSessions.set(sessionId, session);

    return session;
  }

  /**
   * Process NFC payment
   */
  async processNFCPayment(sessionId, customerAddress, paymentMethod = 'wallet') {
    const session = this.nfcSessions.get(sessionId);
    if (!session) throw new Error('NFC session not found');
    if (session.status !== 'waiting') throw new Error('Session not active');
    if (Date.now() > session.expiresAt) throw new Error('Session expired');

    session.customerAddress = customerAddress;
    session.paymentMethod = paymentMethod;
    session.status = 'processing';

    try {
      let txHash;

      if (paymentMethod === 'wallet') {
        // Process via connected wallet
        txHash = await this.processWalletPayment(session);
      } else if (paymentMethod === 'card') {
        // Process via integrated card payment
        txHash = await this.processCardPayment(session);
      } else {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      session.status = 'completed';
      session.completedAt = Date.now();
      session.txHash = txHash;

      this.emit('nfcPaymentCompleted', {
        sessionId,
        merchantAddress: session.merchantAddress,
        customerAddress,
        amount: session.amount,
        currency: session.currency,
        txHash
      });

      return {
        success: true,
        sessionId,
        txHash,
        amount: session.amount,
        currency: session.currency
      };

    } catch (error) {
      session.status = 'failed';
      session.error = error.message;
      throw error;
    }
  }

  /**
   * Process wallet payment
   */
  async processWalletPayment(session) {
    // Use WalletConnect to send transaction
    const request = {
      method: 'eth_sendTransaction',
      params: [{
        to: session.merchantAddress,
        value: this.convertToWei(session.amount, session.currency),
        data: '0x',
        gasLimit: '21000'
      }]
    };

    // Find active WalletConnect session for customer
    const activeSessions = this.walletConnect.getActiveSessions(session.customerAddress);
    if (activeSessions.length === 0) {
      throw new Error('No active wallet connection');
    }

    const wcRequest = await this.walletConnect.handleRequest(activeSessions[0].id, request);
    return wcRequest.result;
  }

  /**
   * Process card payment (mock)
   */
  async processCardPayment(session) {
    // Simulate card payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In real implementation, integrate with card payment processors
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate NFC data
   */
  async generateNFCData(sessionId) {
    const session = this.nfcSessions.get(sessionId);

    // Generate NDEF message for NFC tag
    const ndefMessage = {
      type: 'application/com.aetheron.payment',
      payload: {
        sessionId,
        merchantAddress: session.merchantAddress,
        amount: session.amount,
        currency: session.currency,
        timestamp: session.createdAt
      }
    };

    // Convert to NFC format
    const nfcData = {
      ndefMessage,
      uri: `aetheron://pay/${sessionId}`,
      qrFallback: await this.generatePaymentQR(sessionId)
    };

    return nfcData;
  }

  /**
   * Generate payment QR code
   */
  async generatePaymentQR(sessionId) {
    const session = this.nfcSessions.get(sessionId);
    const qrData = {
      type: 'aetheron_payment',
      sessionId,
      merchantAddress: session.merchantAddress,
      amount: session.amount,
      currency: session.currency,
      expiresAt: session.expiresAt
    };

    return {
      data: JSON.stringify(qrData),
      format: 'json'
    };
  }

  /**
   * Read NFC payment request
   */
  async readNFCPayment(nfcData) {
    try {
      const paymentData = JSON.parse(nfcData);

      if (paymentData.type !== 'aetheron_payment') {
        throw new Error('Invalid NFC payment data');
      }

      const session = this.nfcSessions.get(paymentData.sessionId);
      if (!session) {
        throw new Error('Payment session not found');
      }

      return session;

    } catch (error) {
      throw new Error(`Failed to read NFC data: ${error.message}`);
    }
  }

  /**
   * Cancel NFC payment session
   */
  async cancelNFCPayment(sessionId) {
    const session = this.nfcSessions.get(sessionId);
    if (session) {
      session.status = 'cancelled';
      session.cancelledAt = Date.now();

      this.emit('nfcPaymentCancelled', { sessionId });
    }
  }

  /**
   * Get payment history
   */
  getPaymentHistory(address, role = 'customer') {
    const history = [];

    for (const session of this.nfcSessions.values()) {
      if (role === 'customer' && session.customerAddress === address) {
        history.push({
          sessionId: session.id,
          merchantAddress: session.merchantAddress,
          amount: session.amount,
          currency: session.currency,
          status: session.status,
          timestamp: session.completedAt || session.createdAt
        });
      } else if (role === 'merchant' && session.merchantAddress === address) {
        history.push({
          sessionId: session.id,
          customerAddress: session.customerAddress,
          amount: session.amount,
          currency: session.currency,
          status: session.status,
          timestamp: session.completedAt || session.createdAt
        });
      }
    }

    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Convert amount to wei (simplified)
   */
  convertToWei(amount, currency) {
    const decimals = currency === 'ETH' ? 18 : 6; // USDC/USDT have 6 decimals
    return BigInt(Math.floor(amount * Math.pow(10, decimals))).toString();
  }
}

/**
 * Offline Transaction System
 */
class OfflineTransactionSystem extends EventEmitter {
  constructor(blockchain) {
    super();
    this.blockchain = blockchain;
    this.offlineTxQueue = new Map();
    this.syncStatus = new Map();
    this.maxOfflineTxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.maxQueueSize = 100; // Max transactions per user
  }

  /**
   * Queue offline transaction
   */
  async queueOfflineTransaction(userAddress, transaction) {
    const userQueue = this.offlineTxQueue.get(userAddress) || [];

    if (userQueue.length >= this.maxQueueSize) {
      throw new Error('Offline transaction queue full');
    }

    const offlineTx = {
      id: `OFFLINE_${crypto.randomBytes(8).toString('hex')}`,
      userAddress,
      transaction,
      status: 'queued',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.maxOfflineTxAge,
      retryCount: 0,
      maxRetries: 3
    };

    userQueue.push(offlineTx);
    this.offlineTxQueue.set(userAddress, userQueue);

    this.emit('offlineTxQueued', { txId: offlineTx.id, userAddress });

    return offlineTx;
  }

  /**
   * Sync offline transactions when online
   */
  async syncOfflineTransactions(userAddress) {
    const userQueue = this.offlineTxQueue.get(userAddress) || [];
    const pendingTxs = userQueue.filter(tx => tx.status === 'queued');

    if (pendingTxs.length === 0) {
      return { synced: 0, message: 'No pending transactions' };
    }

    let synced = 0;
    let failed = 0;

    for (const offlineTx of pendingTxs) {
      try {
        // Check if transaction is expired
        if (Date.now() > offlineTx.expiresAt) {
          offlineTx.status = 'expired';
          continue;
        }

        // Attempt to submit transaction
        const result = await this.submitOfflineTransaction(offlineTx);

        if (result.success) {
          offlineTx.status = 'completed';
          offlineTx.completedAt = Date.now();
          offlineTx.txHash = result.txHash;
          synced++;
        } else {
          offlineTx.retryCount++;
          if (offlineTx.retryCount >= offlineTx.maxRetries) {
            offlineTx.status = 'failed';
            offlineTx.error = result.error;
            failed++;
          }
        }

      } catch (error) {
        offlineTx.retryCount++;
        if (offlineTx.retryCount >= offlineTx.maxRetries) {
          offlineTx.status = 'failed';
          offlineTx.error = error.message;
          failed++;
        }
      }
    }

    // Clean up completed/failed transactions older than 1 day
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const cleanedQueue = userQueue.filter(tx =>
      tx.status === 'queued' ||
      (tx.status !== 'queued' && tx.createdAt > oneDayAgo)
    );

    this.offlineTxQueue.set(userAddress, cleanedQueue);

    this.emit('offlineTxSynced', { userAddress, synced, failed });

    return {
      synced,
      failed,
      totalProcessed: synced + failed,
      remaining: cleanedQueue.filter(tx => tx.status === 'queued').length
    };
  }

  /**
   * Submit offline transaction
   */
  async submitOfflineTransaction(offlineTx) {
    try {
      // Simulate transaction submission
      await new Promise(resolve => setTimeout(resolve, 200));

      // Random success/failure for demo
      if (Math.random() > 0.1) { // 90% success rate
        return {
          success: true,
          txHash: `0x${crypto.randomBytes(32).toString('hex')}`
        };
      } else {
        return {
          success: false,
          error: 'Network error'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get offline transaction queue
   */
  getOfflineQueue(userAddress) {
    const userQueue = this.offlineTxQueue.get(userAddress) || [];

    return userQueue.map(tx => ({
      id: tx.id,
      transaction: tx.transaction,
      status: tx.status,
      createdAt: tx.createdAt,
      retryCount: tx.retryCount,
      expiresAt: tx.expiresAt
    }));
  }

  /**
   * Clear expired transactions
   */
  clearExpiredTransactions(userAddress) {
    const userQueue = this.offlineTxQueue.get(userAddress) || [];
    const now = Date.now();

    const activeQueue = userQueue.filter(tx =>
      tx.status === 'queued' && now <= tx.expiresAt
    );

    const expiredCount = userQueue.length - activeQueue.length;
    this.offlineTxQueue.set(userAddress, activeQueue);

    return { cleared: expiredCount, remaining: activeQueue.length };
  }

  /**
   * Get sync status
   */
  getSyncStatus(userAddress) {
    const userQueue = this.offlineTxQueue.get(userAddress) || [];

    const stats = {
      total: userQueue.length,
      queued: userQueue.filter(tx => tx.status === 'queued').length,
      completed: userQueue.filter(tx => tx.status === 'completed').length,
      failed: userQueue.filter(tx => tx.status === 'failed').length,
      expired: userQueue.filter(tx => tx.status === 'expired').length
    };

    return stats;
  }

  /**
   * Compress offline queue for storage
   */
  compressOfflineQueue(userAddress) {
    const userQueue = this.offlineTxQueue.get(userAddress) || [];

    // Remove old completed transactions (keep last 10)
    const completedTxs = userQueue
      .filter(tx => tx.status === 'completed')
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 10);

    // Keep all queued and recent failed transactions
    const recentFailed = userQueue.filter(tx =>
      tx.status === 'failed' &&
      Date.now() - tx.createdAt < (24 * 60 * 60 * 1000) // Last 24 hours
    );

    const queuedTxs = userQueue.filter(tx => tx.status === 'queued');

    const compressedQueue = [...queuedTxs, ...completedTxs, ...recentFailed];
    this.offlineTxQueue.set(userAddress, compressedQueue);

    return {
      originalSize: userQueue.length,
      compressedSize: compressedQueue.length,
      saved: userQueue.length - compressedQueue.length
    };
  }
}

module.exports = {
  WalletConnectSystem,
  BiometricAuthSystem,
  NFCPaymentSystem,
  OfflineTransactionSystem
};
