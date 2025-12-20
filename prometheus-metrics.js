/**
 * Prometheus Metrics & Observability
 *
 * Features:
 * - Request/response time tracking
 * - Error rate monitoring
 * - Gas price metrics
 * - WebSocket connection health
 * - Custom business metrics
 * - Grafana-compatible exports
 */

const crypto = require('crypto');

/**
 * Metrics Collector
 * Prometheus-compatible metrics collection
 */
class MetricsCollector {
  constructor() {
    this.metrics = {
      // HTTP metrics
      httpRequestsTotal: new Map(),
      httpRequestDuration: new Map(),
      httpErrorsTotal: new Map(),

      // WebSocket metrics
      wsConnectionsActive: 0,
      wsMessagesTotal: 0,
      wsErrorsTotal: 0,

      // Blockchain metrics
      blocksMinedTotal: 0,
      transactionsTotal: 0,
      gasPriceGwei: 0,
      networkCongestion: 0,

      // Business metrics
      activeUsers: new Set(),
      dailyActiveUsers: new Set(),
      transactionValue: 0,
      revenueGenerated: 0,

      // System metrics
      memoryUsage: 0,
      cpuUsage: 0,
      uptime: Date.now()
    };

    this.histograms = new Map();
    this.gauges = new Map();
    this.counters = new Map();

    // Start metric collection
    this.startCollecting();
  }

  /**
   * Record HTTP request
   */
  recordRequest(method, path, statusCode, duration) {
    const key = `${method}_${path}_${statusCode}`;

    // Increment counter
    const current = this.metrics.httpRequestsTotal.get(key) || 0;
    this.metrics.httpRequestsTotal.set(key, current + 1);

    // Record duration
    const durations = this.metrics.httpRequestDuration.get(key) || [];
    durations.push(duration);
    this.metrics.httpRequestDuration.set(key, durations);

    // Track errors
    if (statusCode >= 400) {
      const errorKey = `${method}_${path}`;
      const errors = this.metrics.httpErrorsTotal.get(errorKey) || 0;
      this.metrics.httpErrorsTotal.set(errorKey, errors + 1);
    }
  }

  /**
   * Record WebSocket event
   */
  recordWebSocket(event, data = {}) {
    switch (event) {
    case 'connect':
      this.metrics.wsConnectionsActive++;
      break;
    case 'disconnect':
      this.metrics.wsConnectionsActive--;
      break;
    case 'message':
      this.metrics.wsMessagesTotal++;
      break;
    case 'error':
      this.metrics.wsErrorsTotal++;
      break;
    }
  }

  /**
   * Record blockchain event
   */
  recordBlockchain(event, data = {}) {
    switch (event) {
    case 'block_mined':
      this.metrics.blocksMinedTotal++;
      break;
    case 'transaction':
      this.metrics.transactionsTotal++;
      if (data.value) {
        this.metrics.transactionValue += data.value;
      }
      break;
    case 'gas_price':
      this.metrics.gasPriceGwei = data.price;
      break;
    case 'congestion':
      this.metrics.networkCongestion = data.level;
      break;
    }
  }

  /**
   * Record user activity
   */
  recordUserActivity(userId) {
    this.metrics.activeUsers.add(userId);
    this.metrics.dailyActiveUsers.add(userId);
  }

  /**
   * Record revenue
   */
  recordRevenue(amount) {
    this.metrics.revenueGenerated += amount;
  }

  /**
   * Increment counter
   */
  incrementCounter(name, labels = {}, value = 1) {
    const key = this.getLabelKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set gauge value
   */
  setGauge(name, labels = {}, value) {
    const key = this.getLabelKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record histogram value
   */
  recordHistogram(name, labels = {}, value) {
    const key = this.getLabelKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  /**
   * Get label key
   */
  getLabelKey(name, labels) {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Start collecting system metrics
   */
  startCollecting() {
    setInterval(() => {
      // Collect system metrics
      if (process.memoryUsage) {
        const mem = process.memoryUsage();
        this.metrics.memoryUsage = mem.heapUsed / 1024 / 1024; // MB
      }

      if (process.cpuUsage) {
        const cpu = process.cpuUsage();
        this.metrics.cpuUsage = (cpu.user + cpu.system) / 1000000; // seconds
      }

      // Reset daily active users at midnight
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.metrics.dailyActiveUsers.clear();
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Export Prometheus format
   */
  exportPrometheus() {
    let output = '';

    // HTTP Request Total
    output += '# HELP http_requests_total Total HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    for (const [key, value] of this.metrics.httpRequestsTotal.entries()) {
      const [method, path, status] = key.split('_');
      output += `http_requests_total{method="${method}",path="${path}",status="${status}"} ${value}\n`;
    }

    // HTTP Request Duration
    output += '# HELP http_request_duration_seconds HTTP request duration\n';
    output += '# TYPE http_request_duration_seconds histogram\n';
    for (const [key, durations] of this.metrics.httpRequestDuration.entries()) {
      const [method, path] = key.split('_');
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      output += `http_request_duration_seconds{method="${method}",path="${path}"} ${avg / 1000}\n`;
    }

    // WebSocket metrics
    output += '# HELP ws_connections_active Active WebSocket connections\n';
    output += '# TYPE ws_connections_active gauge\n';
    output += `ws_connections_active ${this.metrics.wsConnectionsActive}\n`;

    output += '# HELP ws_messages_total Total WebSocket messages\n';
    output += '# TYPE ws_messages_total counter\n';
    output += `ws_messages_total ${this.metrics.wsMessagesTotal}\n`;

    // Blockchain metrics
    output += '# HELP blocks_mined_total Total blocks mined\n';
    output += '# TYPE blocks_mined_total counter\n';
    output += `blocks_mined_total ${this.metrics.blocksMinedTotal}\n`;

    output += '# HELP transactions_total Total transactions\n';
    output += '# TYPE transactions_total counter\n';
    output += `transactions_total ${this.metrics.transactionsTotal}\n`;

    output += '# HELP gas_price_gwei Current gas price in Gwei\n';
    output += '# TYPE gas_price_gwei gauge\n';
    output += `gas_price_gwei ${this.metrics.gasPriceGwei}\n`;

    // User metrics
    output += '# HELP active_users Active users\n';
    output += '# TYPE active_users gauge\n';
    output += `active_users ${this.metrics.activeUsers.size}\n`;

    output += '# HELP daily_active_users Daily active users\n';
    output += '# TYPE daily_active_users gauge\n';
    output += `daily_active_users ${this.metrics.dailyActiveUsers.size}\n`;

    // Revenue
    output += '# HELP revenue_generated_total Total revenue generated\n';
    output += '# TYPE revenue_generated_total counter\n';
    output += `revenue_generated_total ${this.metrics.revenueGenerated}\n`;

    // System metrics
    output += '# HELP memory_usage_mb Memory usage in MB\n';
    output += '# TYPE memory_usage_mb gauge\n';
    output += `memory_usage_mb ${this.metrics.memoryUsage}\n`;

    output += '# HELP uptime_seconds Process uptime in seconds\n';
    output += '# TYPE uptime_seconds counter\n';
    output += `uptime_seconds ${(Date.now() - this.metrics.uptime) / 1000}\n`;

    // Custom counters
    for (const [key, value] of this.counters.entries()) {
      output += `${key} ${value}\n`;
    }

    // Custom gauges
    for (const [key, value] of this.gauges.entries()) {
      output += `${key} ${value}\n`;
    }

    return output;
  }

  /**
   * Export JSON format
   */
  exportJSON() {
    return {
      http: {
        requests: Object.fromEntries(this.metrics.httpRequestsTotal),
        errors: Object.fromEntries(this.metrics.httpErrorsTotal),
        avgDuration: this.calculateAvgDurations()
      },
      websocket: {
        activeConnections: this.metrics.wsConnectionsActive,
        totalMessages: this.metrics.wsMessagesTotal,
        totalErrors: this.metrics.wsErrorsTotal
      },
      blockchain: {
        blocksMinedTotal: this.metrics.blocksMinedTotal,
        transactionsTotal: this.metrics.transactionsTotal,
        gasPriceGwei: this.metrics.gasPriceGwei,
        networkCongestion: this.metrics.networkCongestion,
        transactionValue: this.metrics.transactionValue
      },
      users: {
        active: this.metrics.activeUsers.size,
        dailyActive: this.metrics.dailyActiveUsers.size
      },
      business: {
        revenue: this.metrics.revenueGenerated
      },
      system: {
        memoryUsageMB: this.metrics.memoryUsage.toFixed(2),
        uptimeSeconds: ((Date.now() - this.metrics.uptime) / 1000).toFixed(0)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate average durations
   */
  calculateAvgDurations() {
    const result = {};
    for (const [key, durations] of this.metrics.httpRequestDuration.entries()) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      result[key] = `${avg.toFixed(2)}ms`;
    }
    return result;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      requests: {
        total: Array.from(this.metrics.httpRequestsTotal.values()).reduce((a, b) => a + b, 0),
        errors: Array.from(this.metrics.httpErrorsTotal.values()).reduce((a, b) => a + b, 0)
      },
      websocket: {
        active: this.metrics.wsConnectionsActive,
        messages: this.metrics.wsMessagesTotal
      },
      blockchain: {
        blocks: this.metrics.blocksMinedTotal,
        transactions: this.metrics.transactionsTotal
      },
      users: {
        active: this.metrics.activeUsers.size,
        daily: this.metrics.dailyActiveUsers.size
      }
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.httpRequestsTotal.clear();
    this.metrics.httpRequestDuration.clear();
    this.metrics.httpErrorsTotal.clear();
    this.metrics.activeUsers.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

/**
 * Alert Manager
 * Monitor metrics and trigger alerts
 */
class AlertManager {
  constructor(metricsCollector) {
    this.metrics = metricsCollector;
    this.alerts = new Map();
    this.rules = new Map();
    this.webhooks = new Set();
  }

  /**
   * Add alert rule
   */
  addRule(name, condition, severity = 'warning') {
    this.rules.set(name, {
      name,
      condition,
      severity,
      active: true,
      lastTriggered: null
    });
  }

  /**
   * Check all rules
   */
  checkRules() {
    const summary = this.metrics.getSummary();
    const triggeredAlerts = [];

    for (const [name, rule] of this.rules.entries()) {
      if (!rule.active) continue;

      try {
        const triggered = rule.condition(summary, this.metrics.metrics);

        if (triggered) {
          const alert = {
            name,
            severity: rule.severity,
            message: triggered.message || `Alert: ${name}`,
            value: triggered.value,
            timestamp: Date.now()
          };

          this.alerts.set(name, alert);
          rule.lastTriggered = Date.now();
          triggeredAlerts.push(alert);

          // Send to webhooks
          this.notifyWebhooks(alert);
        }
      } catch (error) {
        console.error(`Error checking rule ${name}:`, error);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Add webhook
   */
  addWebhook(url) {
    this.webhooks.add(url);
  }

  /**
   * Notify webhooks
   */
  async notifyWebhooks(alert) {
    for (const url of this.webhooks) {
      try {
        // In production, use axios or fetch
        console.log(`Webhook notification to ${url}:`, alert);
      } catch (error) {
        console.error(`Failed to notify webhook ${url}:`, error);
      }
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.alerts.values());
  }

  /**
   * Clear alert
   */
  clearAlert(name) {
    this.alerts.delete(name);
  }
}

// Predefined alert rules
const DEFAULT_ALERT_RULES = {
  highErrorRate: (summary) => {
    const errorRate = summary.requests.errors / summary.requests.total;
    if (errorRate > 0.05) {
      // 5% error rate
      return {
        message: 'High error rate detected',
        value: `${(errorRate * 100).toFixed(2)}%`
      };
    }
    return false;
  },

  lowWebSocketConnections: (summary) => {
    if (summary.websocket.active < 5) {
      return {
        message: 'Low WebSocket connections',
        value: summary.websocket.active
      };
    }
    return false;
  },

  highMemoryUsage: (summary, metrics) => {
    if (metrics.memoryUsage > 1000) {
      // 1GB
      return {
        message: 'High memory usage',
        value: `${metrics.memoryUsage.toFixed(2)}MB`
      };
    }
    return false;
  },

  noRecentBlocks: (summary) => {
    // Check if blocks mined in last period
    // Would need timestamp tracking in real implementation
    return false;
  }
};

module.exports = {
  MetricsCollector,
  AlertManager,
  DEFAULT_ALERT_RULES
};
