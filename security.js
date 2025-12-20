// Enhanced Security Features
const crypto = require('crypto');
const speakeasy = require('speakeasy');

class MultiSigWallet {
  constructor(owners, requiredSignatures) {
    this.owners = owners;
    this.requiredSignatures = requiredSignatures;
    this.transactions = new Map();
    this.nonce = 0;
  }

  proposeTransaction(to, amount, data, proposer) {
    if (!this.owners.includes(proposer)) {
      throw new Error('Only owners can propose transactions');
    }

    const txId = crypto.randomBytes(32).toString('hex');
    const transaction = {
      id: txId,
      to,
      amount,
      data,
      proposer,
      signatures: [proposer],
      executed: false,
      timestamp: Date.now(),
      nonce: this.nonce++
    };

    this.transactions.set(txId, transaction);
    return transaction;
  }

  signTransaction(txId, signer) {
    if (!this.owners.includes(signer)) {
      throw new Error('Only owners can sign');
    }

    const tx = this.transactions.get(txId);
    if (!tx) throw new Error('Transaction not found');
    if (tx.executed) throw new Error('Already executed');
    if (tx.signatures.includes(signer)) {
      throw new Error('Already signed by this owner');
    }

    tx.signatures.push(signer);

    if (tx.signatures.length >= this.requiredSignatures) {
      return this.executeTransaction(txId);
    }

    return { signed: true, signaturesNeeded: this.requiredSignatures - tx.signatures.length };
  }

  executeTransaction(txId) {
    const tx = this.transactions.get(txId);
    if (!tx) throw new Error('Transaction not found');
    if (tx.executed) throw new Error('Already executed');
    if (tx.signatures.length < this.requiredSignatures) {
      throw new Error('Insufficient signatures');
    }

    tx.executed = true;
    tx.executedAt = Date.now();

    return {
      executed: true,
      transaction: tx
    };
  }

  revokeSignature(txId, signer) {
    const tx = this.transactions.get(txId);
    if (!tx) throw new Error('Transaction not found');
    if (tx.executed) throw new Error('Cannot revoke executed transaction');

    const index = tx.signatures.indexOf(signer);
    if (index === -1) throw new Error('Signature not found');

    tx.signatures.splice(index, 1);
    return { revoked: true };
  }

  getTransactionStatus(txId) {
    const tx = this.transactions.get(txId);
    if (!tx) return null;

    return {
      id: tx.id,
      signatures: tx.signatures.length,
      required: this.requiredSignatures,
      executed: tx.executed,
      ready: tx.signatures.length >= this.requiredSignatures
    };
  }
}

class TwoFactorAuth {
  constructor() {
    this.secrets = new Map();
    this.backupCodes = new Map();
  }

  enableTwoFactor(userId) {
    const secret = speakeasy.generateSecret({
      name: `Aetheron (${userId})`,
      length: 32
    });

    this.secrets.set(userId, secret.base32);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    this.backupCodes.set(userId, backupCodes);

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      backupCodes
    };
  }

  verifyToken(userId, token) {
    const secret = this.secrets.get(userId);
    if (!secret) return { valid: false, error: '2FA not enabled' };

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps before/after
    });

    if (verified) {
      return { valid: true };
    }

    // Try backup codes
    const backupCodes = this.backupCodes.get(userId) || [];
    const backupIndex = backupCodes.indexOf(token.toUpperCase());

    if (backupIndex !== -1) {
      backupCodes.splice(backupIndex, 1);
      this.backupCodes.set(userId, backupCodes);
      return { valid: true, usedBackupCode: true };
    }

    return { valid: false, error: 'Invalid token' };
  }

  disableTwoFactor(userId) {
    this.secrets.delete(userId);
    this.backupCodes.delete(userId);
    return { disabled: true };
  }

  isEnabled(userId) {
    return this.secrets.has(userId);
  }
}

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  checkLimit(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside window
    const validRequests = userRequests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const retryAfter = this.windowMs - (now - oldestRequest);

      return {
        allowed: false,
        retryAfter: Math.ceil(retryAfter / 1000),
        remaining: 0
      };
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetAt: now + this.windowMs
    };
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }

  getStatus(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter((time) => now - time < this.windowMs);

    return {
      requests: validRequests.length,
      max: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - validRequests.length),
      resetAt: validRequests.length > 0 ? Math.min(...validRequests) + this.windowMs : now
    };
  }
}

class AuditLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 10000;
  }

  log(event, data, severity = 'info') {
    const entry = {
      id: crypto.randomBytes(16).toString('hex'),
      event,
      data,
      severity,
      timestamp: Date.now(),
      hash: this.hashEntry({ event, data, severity })
    };

    this.logs.push(entry);

    // Maintain max size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Alert on critical events
    if (severity === 'critical') {
      this.triggerAlert(entry);
    }

    return entry;
  }

  hashEntry(entry) {
    return crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
  }

  query(filters = {}) {
    let results = [...this.logs];

    if (filters.event) {
      results = results.filter((log) => log.event === filters.event);
    }

    if (filters.severity) {
      results = results.filter((log) => log.severity === filters.severity);
    }

    if (filters.startTime) {
      results = results.filter((log) => log.timestamp >= filters.startTime);
    }

    if (filters.endTime) {
      results = results.filter((log) => log.timestamp <= filters.endTime);
    }

    return results;
  }

  verifyIntegrity() {
    return this.logs.every((log) => {
      const recomputed = this.hashEntry({
        event: log.event,
        data: log.data,
        severity: log.severity
      });
      return recomputed === log.hash;
    });
  }

  triggerAlert(entry) {
    console.error('AUDIT ALERT:', entry);
    // Would send to monitoring system
  }

  export() {
    return {
      logs: this.logs,
      count: this.logs.length,
      integrityVerified: this.verifyIntegrity(),
      exportedAt: Date.now()
    };
  }
}

class SecurityScanner {
  constructor() {
    this.vulnerabilities = [];
    this.scanHistory = [];
  }

  scanSmartContract(code) {
    const issues = [];

    // Check for reentrancy vulnerabilities
    if (this.detectReentrancy(code)) {
      issues.push({
        type: 'REENTRANCY',
        severity: 'HIGH',
        message: 'Potential reentrancy vulnerability detected',
        line: this.findPattern(code, /\.call\{value:/g)
      });
    }

    // Check for unchecked external calls
    if (this.detectUncheckedCalls(code)) {
      issues.push({
        type: 'UNCHECKED_CALL',
        severity: 'MEDIUM',
        message: 'Unchecked low-level call detected',
        line: this.findPattern(code, /\.call\(/g)
      });
    }

    // Check for integer overflow/underflow
    if (this.detectIntegerIssues(code)) {
      issues.push({
        type: 'INTEGER_OVERFLOW',
        severity: 'HIGH',
        message: 'Potential integer overflow/underflow',
        line: this.findPattern(code, /\+\+|--|\+=|-=/g)
      });
    }

    // Check for tx.origin usage
    if (code.includes('tx.origin')) {
      issues.push({
        type: 'TX_ORIGIN',
        severity: 'MEDIUM',
        message: 'tx.origin should not be used for authorization',
        line: this.findPattern(code, /tx\.origin/g)
      });
    }

    const scan = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      issues,
      passed: issues.length === 0
    };

    this.scanHistory.push(scan);
    return scan;
  }

  detectReentrancy(code) {
    return /\.call\{value:/.test(code) && /balances\[/.test(code);
  }

  detectUncheckedCalls(code) {
    return /\.call\(/.test(code) && !/require\(/.test(code);
  }

  detectIntegerIssues(code) {
    return /\+\+|--|\+=|-=/.test(code) && !/SafeMath/.test(code);
  }

  findPattern(code, pattern) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return null;
  }

  getScanReport() {
    return {
      totalScans: this.scanHistory.length,
      recentScans: this.scanHistory.slice(-10),
      totalIssues: this.scanHistory.reduce((sum, scan) => sum + scan.issues.length, 0)
    };
  }
}

module.exports = {
  MultiSigWallet,
  TwoFactorAuth,
  RateLimiter,
  AuditLogger,
  SecurityScanner
};
