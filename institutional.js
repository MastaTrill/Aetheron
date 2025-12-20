/**
 * Institutional Features Module
 * Custody, OTC trading, and treasury management for institutional clients
 */

const crypto = require('crypto');

/**
 * Custody Service
 * Multi-signature custody solutions for institutional assets
 */
class CustodyService {
  constructor() {
    this.vaults = new Map();
    this.policies = new Map();
    this.approvals = new Map();
  }

  /**
   * Create custody vault
   */
  createVault(config) {
    const vaultId = crypto.randomBytes(16).toString('hex');

    const vault = {
      id: vaultId,
      name: config.name,
      type: config.type || 'multi-sig', // multi-sig, threshold, timelocked
      signers: config.signers || [],
      threshold: config.threshold || Math.ceil(config.signers.length / 2),
      assets: new Map(),
      createdAt: Date.now(),
      status: 'active'
    };

    this.vaults.set(vaultId, vault);

    return vault;
  }

  /**
   * Deposit assets to vault
   */
  deposit(vaultId, asset, amount, depositor) {
    const vault = this.vaults.get(vaultId);

    if (!vault) {
      throw new Error('Vault not found');
    }

    const currentAmount = vault.assets.get(asset) || 0;
    vault.assets.set(asset, currentAmount + amount);

    return {
      vaultId,
      asset,
      amount,
      newBalance: vault.assets.get(asset),
      depositor,
      timestamp: Date.now()
    };
  }

  /**
   * Request withdrawal from vault
   */
  requestWithdrawal(vaultId, asset, amount, requester, destination) {
    const vault = this.vaults.get(vaultId);

    if (!vault) {
      throw new Error('Vault not found');
    }

    if (!vault.signers.includes(requester)) {
      throw new Error('Requester not authorized');
    }

    const balance = vault.assets.get(asset) || 0;
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    const requestId = crypto.randomBytes(16).toString('hex');

    const request = {
      id: requestId,
      vaultId,
      asset,
      amount,
      destination,
      requester,
      approvals: [requester],
      rejections: [],
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000 // 24 hours
    };

    this.approvals.set(requestId, request);

    return request;
  }

  /**
   * Approve withdrawal request
   */
  approveWithdrawal(requestId, approver) {
    const request = this.approvals.get(requestId);

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request already processed');
    }

    const vault = this.vaults.get(request.vaultId);

    if (!vault.signers.includes(approver)) {
      throw new Error('Approver not authorized');
    }

    if (request.approvals.includes(approver)) {
      throw new Error('Already approved');
    }

    request.approvals.push(approver);

    // Check if threshold reached
    if (request.approvals.length >= vault.threshold) {
      return this.executeWithdrawal(requestId);
    }

    return {
      requestId,
      approvals: request.approvals.length,
      required: vault.threshold,
      status: 'pending'
    };
  }

  /**
   * Execute withdrawal
   */
  executeWithdrawal(requestId) {
    const request = this.approvals.get(requestId);
    const vault = this.vaults.get(request.vaultId);

    const currentBalance = vault.assets.get(request.asset);
    vault.assets.set(request.asset, currentBalance - request.amount);

    request.status = 'executed';
    request.executedAt = Date.now();

    return {
      requestId,
      status: 'executed',
      txHash: crypto.randomBytes(32).toString('hex'),
      amount: request.amount,
      destination: request.destination
    };
  }

  /**
   * Get vault balance
   */
  getVaultBalance(vaultId) {
    const vault = this.vaults.get(vaultId);

    if (!vault) {
      throw new Error('Vault not found');
    }

    return Object.fromEntries(vault.assets);
  }
}

/**
 * OTC Trading Desk
 * Over-the-counter trading for large orders
 */
class OTCTradingDesk {
  constructor() {
    this.rfqs = new Map(); // Request for Quote
    this.trades = new Map();
    this.counterparties = new Map();
  }

  /**
   * Create RFQ (Request for Quote)
   */
  createRFQ(trader, request) {
    const rfqId = crypto.randomBytes(16).toString('hex');

    const rfq = {
      id: rfqId,
      trader,
      side: request.side, // buy or sell
      asset: request.asset,
      amount: request.amount,
      minAmount: request.minAmount || request.amount,
      settlement: request.settlement || 'T+0',
      validUntil: request.validUntil || Date.now() + 1800000, // 30 minutes
      quotes: [],
      status: 'open',
      createdAt: Date.now()
    };

    this.rfqs.set(rfqId, rfq);

    return rfq;
  }

  /**
   * Submit quote
   */
  submitQuote(rfqId, marketMaker, quote) {
    const rfq = this.rfqs.get(rfqId);

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    if (rfq.status !== 'open') {
      throw new Error('RFQ not open');
    }

    if (Date.now() > rfq.validUntil) {
      rfq.status = 'expired';
      throw new Error('RFQ expired');
    }

    const quoteEntry = {
      marketMaker,
      price: quote.price,
      amount: quote.amount,
      validUntil: quote.validUntil || Date.now() + 300000, // 5 minutes
      submittedAt: Date.now()
    };

    rfq.quotes.push(quoteEntry);

    return quoteEntry;
  }

  /**
   * Accept quote and execute trade
   */
  acceptQuote(rfqId, quoteIndex) {
    const rfq = this.rfqs.get(rfqId);

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    const quote = rfq.quotes[quoteIndex];

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (Date.now() > quote.validUntil) {
      throw new Error('Quote expired');
    }

    const tradeId = crypto.randomBytes(16).toString('hex');

    const trade = {
      id: tradeId,
      rfqId,
      buyer: rfq.side === 'buy' ? rfq.trader : quote.marketMaker,
      seller: rfq.side === 'sell' ? rfq.trader : quote.marketMaker,
      asset: rfq.asset,
      amount: quote.amount,
      price: quote.price,
      totalValue: quote.amount * quote.price,
      settlement: rfq.settlement,
      status: 'pending-settlement',
      executedAt: Date.now()
    };

    this.trades.set(tradeId, trade);
    rfq.status = 'filled';

    return trade;
  }

  /**
   * Settle trade
   */
  settleTrade(tradeId, settlements) {
    const trade = this.trades.get(tradeId);

    if (!trade) {
      throw new Error('Trade not found');
    }

    trade.status = 'settled';
    trade.settledAt = Date.now();
    trade.settlements = settlements;

    return trade;
  }

  /**
   * Get best quote
   */
  getBestQuote(rfqId) {
    const rfq = this.rfqs.get(rfqId);

    if (!rfq || rfq.quotes.length === 0) {
      return null;
    }

    // Best price depends on buy/sell side
    const validQuotes = rfq.quotes.filter((q) => Date.now() <= q.validUntil);

    if (validQuotes.length === 0) {
      return null;
    }

    return rfq.side === 'buy'
      ? validQuotes.reduce((best, q) => (q.price < best.price ? q : best))
      : validQuotes.reduce((best, q) => (q.price > best.price ? q : best));
  }
}

/**
 * Treasury Management
 * Multi-asset portfolio management for institutions
 */
class TreasuryManagement {
  constructor() {
    this.portfolios = new Map();
    this.allocations = new Map();
    this.rebalanceHistory = new Map();
  }

  /**
   * Create portfolio
   */
  createPortfolio(config) {
    const portfolioId = crypto.randomBytes(16).toString('hex');

    const portfolio = {
      id: portfolioId,
      name: config.name,
      manager: config.manager,
      assets: new Map(),
      targetAllocation: config.targetAllocation || {},
      rebalanceThreshold: config.rebalanceThreshold || 0.05, // 5%
      createdAt: Date.now()
    };

    this.portfolios.set(portfolioId, portfolio);

    return portfolio;
  }

  /**
   * Update portfolio assets
   */
  updateAssets(portfolioId, assets) {
    const portfolio = this.portfolios.get(portfolioId);

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    for (const [asset, amount] of Object.entries(assets)) {
      portfolio.assets.set(asset, amount);
    }

    return this.getPortfolioSummary(portfolioId);
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const totalValue = Array.from(portfolio.assets.values()).reduce((sum, v) => sum + v, 0);
    const currentAllocation = {};

    for (const [asset, value] of portfolio.assets.entries()) {
      currentAllocation[asset] = totalValue > 0 ? value / totalValue : 0;
    }

    return {
      portfolioId,
      totalValue,
      assets: Object.fromEntries(portfolio.assets),
      currentAllocation,
      targetAllocation: portfolio.targetAllocation,
      needsRebalance: this.needsRebalance(portfolioId)
    };
  }

  /**
   * Check if rebalance needed
   */
  needsRebalance(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);
    const summary = this.getPortfolioSummary(portfolioId);

    for (const [asset, target] of Object.entries(portfolio.targetAllocation)) {
      const current = summary.currentAllocation[asset] || 0;
      const deviation = Math.abs(current - target);

      if (deviation > portfolio.rebalanceThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate rebalance plan
   */
  generateRebalancePlan(portfolioId) {
    const portfolio = this.portfolios.get(portfolioId);
    const summary = this.getPortfolioSummary(portfolioId);
    const trades = [];

    for (const [asset, target] of Object.entries(portfolio.targetAllocation)) {
      const current = summary.currentAllocation[asset] || 0;
      const targetValue = summary.totalValue * target;
      const currentValue = portfolio.assets.get(asset) || 0;
      const delta = targetValue - currentValue;

      if (Math.abs(delta) > summary.totalValue * 0.01) {
        // >1% deviation
        trades.push({
          asset,
          action: delta > 0 ? 'buy' : 'sell',
          amount: Math.abs(delta),
          currentAllocation: current,
          targetAllocation: target
        });
      }
    }

    return {
      portfolioId,
      totalValue: summary.totalValue,
      trades,
      estimatedCost: trades.reduce((sum, t) => sum + t.amount * 0.001, 0) // 0.1% fee estimate
    };
  }

  /**
   * Execute rebalance
   */
  executeRebalance(portfolioId, plan) {
    const portfolio = this.portfolios.get(portfolioId);
    const rebalanceId = crypto.randomBytes(16).toString('hex');

    const rebalance = {
      id: rebalanceId,
      portfolioId,
      plan,
      executedTrades: [],
      status: 'completed',
      executedAt: Date.now()
    };

    // Execute trades (simplified)
    for (const trade of plan.trades) {
      const current = portfolio.assets.get(trade.asset) || 0;
      const newAmount = trade.action === 'buy' ? current + trade.amount : current - trade.amount;

      portfolio.assets.set(trade.asset, newAmount);

      rebalance.executedTrades.push({
        ...trade,
        executedPrice: 1.0, // Simplified
        txHash: crypto.randomBytes(32).toString('hex')
      });
    }

    this.rebalanceHistory.set(rebalanceId, rebalance);

    return rebalance;
  }

  /**
   * Get performance report
   */
  getPerformanceReport(portfolioId, period = '30d') {
    const portfolio = this.portfolios.get(portfolioId);

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Simplified performance metrics
    return {
      portfolioId,
      period,
      returns: {
        absolute: 15.5, // %
        annualized: 189.2 // %
      },
      volatility: 12.3, // %
      sharpeRatio: 1.26,
      maxDrawdown: -8.7, // %
      rebalances: Array.from(this.rebalanceHistory.values()).filter(
        (r) => r.portfolioId === portfolioId
      ).length
    };
  }
}

/**
 * Compliance & Reporting
 */
class InstitutionalCompliance {
  constructor() {
    this.auditLogs = [];
    this.reports = new Map();
  }

  /**
   * Log transaction for audit
   */
  logAuditEvent(event) {
    const auditEntry = {
      id: crypto.randomBytes(16).toString('hex'),
      type: event.type,
      entity: event.entity,
      action: event.action,
      user: event.user,
      details: event.details,
      timestamp: Date.now(),
      ipAddress: event.ipAddress
    };

    this.auditLogs.push(auditEntry);

    return auditEntry;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(startDate, endDate, type = 'transactions') {
    const reportId = crypto.randomBytes(16).toString('hex');

    const filteredLogs = this.auditLogs.filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );

    const report = {
      id: reportId,
      type,
      period: { startDate, endDate },
      totalEvents: filteredLogs.length,
      events: filteredLogs,
      generatedAt: Date.now()
    };

    this.reports.set(reportId, report);

    return report;
  }

  /**
   * Get audit trail
   */
  getAuditTrail(filters = {}) {
    let logs = this.auditLogs;

    if (filters.entity) {
      logs = logs.filter((l) => l.entity === filters.entity);
    }

    if (filters.user) {
      logs = logs.filter((l) => l.user === filters.user);
    }

    if (filters.type) {
      logs = logs.filter((l) => l.type === filters.type);
    }

    return logs;
  }
}

module.exports = {
  CustodyService,
  OTCTradingDesk,
  TreasuryManagement,
  InstitutionalCompliance
};
