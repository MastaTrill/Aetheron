// Advanced Analytics & Monitoring System
const crypto = require('crypto');

class AnalyticsEngine {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.metrics = {
      transactionVolume: [],
      gasUsage: [],
      activeAddresses: new Set(),
      blockTimes: [],
      networkHealth: 100
    };
    this.alerts = [];
  }

  // Transaction Analytics
  analyzeTransaction(tx) {
    // Track active addresses
    if (tx.sender) {
      this.metrics.activeAddresses.add(tx.sender);
    }
    if (tx.receiver) {
      this.metrics.activeAddresses.add(tx.receiver);
    }

    return {
      hash: tx.hash,
      value: tx.amount,
      fee: tx.fee || 0,
      gasPrice: this.estimateGasPrice(tx),
      timestamp: tx.timestamp || Date.now(),
      type: this.classifyTransaction(tx),
      risk: this.calculateRiskScore(tx)
    };
  }

  classifyTransaction(tx) {
    if (tx.data && tx.data.includes('mint')) return 'NFT_MINT';
    if (tx.data && tx.data.includes('swap')) return 'DEX_SWAP';
    if (tx.amount > 1000) return 'LARGE_TRANSFER';
    if (tx.receiver === tx.sender) return 'SELF_TRANSFER';
    return 'STANDARD';
  }

  calculateRiskScore(tx) {
    let score = 0;

    // High value transactions
    if (tx.amount > 10000) score += 30;

    // New addresses
    if (!this.metrics.activeAddresses.has(tx.sender)) score += 20;

    // Unusual gas prices
    const avgGas = this.getAverageGasPrice();
    if (tx.fee && tx.fee > avgGas * 2) score += 25;

    // Rapid transactions from same address
    const recentTxs = this.getRecentTransactions(tx.sender, 60000); // 1 min
    if (recentTxs.length > 10) score += 25;

    return Math.min(score, 100);
  }

  // Gas Predictions
  estimateGasPrice(tx) {
    const baseGas = 21000;
    const dataGas = (tx.data?.length || 0) * 16;
    const complexity = this.estimateComplexity(tx);

    return baseGas + dataGas + complexity;
  }

  estimateComplexity(tx) {
    if (tx.type === 'NFT_MINT') return 50000;
    if (tx.type === 'DEX_SWAP') return 150000;
    if (tx.contractCall) return 100000;
    return 0;
  }

  predictNextBlockGas() {
    const recentGas = this.metrics.gasUsage.slice(-10);
    const avg = recentGas.reduce((a, b) => a + b, 0) / recentGas.length;
    const trend = this.calculateTrend(recentGas);

    return {
      predicted: Math.round(avg * (1 + trend)),
      confidence: this.calculateConfidence(recentGas),
      recommendation: this.getGasRecommendation(avg, trend)
    };
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;
    const recent = data.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const older = data.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    return (recent - older) / older;
  }

  calculateConfidence(data) {
    const stdDev = this.standardDeviation(data);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const cv = stdDev / mean; // Coefficient of variation
    return Math.max(0, 100 - cv * 100);
  }

  standardDeviation(data) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  getGasRecommendation(avg, trend) {
    if (trend > 0.2) return 'URGENT - Gas prices rising rapidly';
    if (trend > 0.1) return 'HIGH - Consider transacting soon';
    if (trend < -0.1) return 'LOW - Good time to transact';
    return 'MEDIUM - Normal network conditions';
  }

  getAverageGasPrice() {
    const recent = this.metrics.gasUsage.slice(-20);
    return recent.reduce((a, b) => a + b, 0) / recent.length || 21000;
  }

  // Network Health Monitoring
  calculateNetworkHealth() {
    const metrics = {
      blockTime: this.getAverageBlockTime(),
      txThroughput: this.getTransactionThroughput(),
      nodeCount: this.getActiveNodeCount(),
      memPoolSize: this.getMempoolSize()
    };

    let health = 100;

    // Penalize slow block times (target: 12 seconds)
    if (metrics.blockTime > 15) health -= 10;
    if (metrics.blockTime > 20) health -= 20;

    // Penalize low throughput
    if (metrics.txThroughput < 10) health -= 15;

    // Penalize large mempool
    if (metrics.memPoolSize > 1000) health -= 10;
    if (metrics.memPoolSize > 5000) health -= 20;

    this.metrics.networkHealth = Math.max(0, health);

    return {
      score: this.metrics.networkHealth,
      metrics,
      status: this.getHealthStatus(this.metrics.networkHealth)
    };
  }

  getHealthStatus(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 50) return 'FAIR';
    if (score >= 30) return 'POOR';
    return 'CRITICAL';
  }

  getAverageBlockTime() {
    const times = this.metrics.blockTimes.slice(-10);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 12;
  }

  getTransactionThroughput() {
    // Transactions per second in last minute
    const recent = this.blockchain?.pendingTransactions || [];
    return recent.length / 60;
  }

  getActiveNodeCount() {
    // Placeholder - would query network
    return 150;
  }

  getMempoolSize() {
    return this.blockchain?.pendingTransactions?.length || 0;
  }

  // Transaction Graph Analysis
  buildTransactionGraph(address, depth = 3) {
    const graph = {
      nodes: new Map(),
      edges: []
    };

    this.traverseTransactions(address, depth, graph);

    return {
      nodes: Array.from(graph.nodes.values()),
      edges: graph.edges,
      statistics: this.analyzeGraph(graph)
    };
  }

  traverseTransactions(address, depth, graph, visited = new Set()) {
    if (depth === 0 || visited.has(address)) return;
    visited.add(address);

    const transactions = this.getAddressTransactions(address);

    graph.nodes.set(address, {
      id: address,
      label: this.shortenAddress(address),
      value: this.blockchain?.getBalance(address) || 0,
      txCount: transactions.length
    });

    transactions.forEach((tx) => {
      const counterparty = tx.sender === address ? tx.receiver : tx.sender;

      graph.edges.push({
        from: tx.sender,
        to: tx.receiver,
        value: tx.amount,
        timestamp: tx.timestamp
      });

      if (!visited.has(counterparty)) {
        this.traverseTransactions(counterparty, depth - 1, graph, visited);
      }
    });
  }

  analyzeGraph(graph) {
    return {
      totalNodes: graph.nodes.size,
      totalEdges: graph.edges.length,
      avgDegree: graph.edges.length / graph.nodes.size,
      totalValue: graph.edges.reduce((sum, e) => sum + e.value, 0),
      clusters: this.detectClusters(graph)
    };
  }

  detectClusters(graph) {
    // Simple clustering based on transaction frequency
    const clusters = [];
    const processed = new Set();

    graph.nodes.forEach((node, address) => {
      if (processed.has(address)) return;

      const cluster = this.expandCluster(address, graph, processed);
      if (cluster.length > 1) clusters.push(cluster);
    });

    return clusters;
  }

  expandCluster(seed, graph, processed) {
    const cluster = [seed];
    processed.add(seed);

    const connected = graph.edges
      .filter((e) => e.from === seed || e.to === seed)
      .map((e) => (e.from === seed ? e.to : e.from));

    connected.forEach((addr) => {
      if (!processed.has(addr) && this.isStronglyConnected(seed, addr, graph)) {
        cluster.push(addr);
        processed.add(addr);
      }
    });

    return cluster;
  }

  isStronglyConnected(addr1, addr2, graph) {
    const edges = graph.edges.filter(
      (e) => (e.from === addr1 && e.to === addr2) || (e.from === addr2 && e.to === addr1)
    );
    return edges.length >= 3; // At least 3 transactions
  }

  getAddressTransactions(address) {
    if (!this.blockchain?.chain) return [];

    const txs = [];
    this.blockchain.chain.forEach((block) => {
      block.transactions?.forEach((tx) => {
        if (tx.sender === address || tx.receiver === address) {
          txs.push(tx);
        }
      });
    });
    return txs;
  }

  getRecentTransactions(address, timeWindow) {
    const now = Date.now();
    return this.getAddressTransactions(address).filter(
      (tx) => tx.timestamp && now - tx.timestamp < timeWindow
    );
  }

  shortenAddress(addr) {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // Alert System
  createAlert(type, severity, message, data) {
    const alert = {
      id: crypto.randomBytes(8).toString('hex'),
      type,
      severity, // 'info', 'warning', 'critical'
      message,
      data,
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);

    if (severity === 'critical') {
      this.triggerEmergencyProtocol(alert);
    }

    return alert;
  }

  triggerEmergencyProtocol(alert) {
    console.error('CRITICAL ALERT:', alert.message);
    // Would trigger notifications, pause systems, etc.
  }

  getActiveAlerts() {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) alert.acknowledged = true;
    return alert;
  }

  // Real-time Metrics
  recordMetric(type, value) {
    switch (type) {
    case 'gas':
      this.metrics.gasUsage.push(value);
      if (this.metrics.gasUsage.length > 100) {
        this.metrics.gasUsage.shift();
      }
      break;
    case 'blockTime':
      this.metrics.blockTimes.push(value);
      if (this.metrics.blockTimes.length > 50) {
        this.metrics.blockTimes.shift();
      }
      break;
    case 'address':
      this.metrics.activeAddresses.add(value);
      break;
    }
  }

  getMetricsSummary() {
    return {
      avgGasPrice: this.getAverageGasPrice(),
      avgBlockTime: this.getAverageBlockTime(),
      activeAddresses: this.metrics.activeAddresses.size,
      networkHealth: this.metrics.networkHealth,
      pendingAlerts: this.getActiveAlerts().length,
      txThroughput: this.getTransactionThroughput()
    };
  }
}

module.exports = { AnalyticsEngine };
