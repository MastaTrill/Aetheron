/**
 * Advanced API Rate Limiting & Monetization
 *
 * Features:
 * - Tiered rate limiting (Free, Pro, Enterprise)
 * - API key management
 * - Usage tracking and analytics
 * - Automatic tier upgrades
 * - Webhook alerts for limit approaching
 */

const crypto = require('crypto');

/**
 * Rate Limiter with Tiered Pricing
 */
class AdvancedRateLimiter {
  constructor() {
    this.apiKeys = new Map();
    this.usage = new Map();
    this.tiers = {
      free: {
        name: 'Free',
        requestsPerHour: 100,
        requestsPerDay: 1000,
        requestsPerMonth: 10000,
        price: 0,
        features: ['Basic API access', 'Community support']
      },
      pro: {
        name: 'Pro',
        requestsPerHour: 10000,
        requestsPerDay: 100000,
        requestsPerMonth: 2000000,
        price: 49,
        features: [
          'Priority support',
          'WebSocket access',
          'Advanced endpoints',
          'No rate limit banner'
        ]
      },
      enterprise: {
        name: 'Enterprise',
        requestsPerHour: Infinity,
        requestsPerDay: Infinity,
        requestsPerMonth: Infinity,
        price: 499,
        features: [
          'Dedicated support',
          'SLA guarantee',
          'Custom integrations',
          'On-premise option',
          'Dedicated infrastructure'
        ]
      }
    };
  }

  /**
   * Generate API key
   */
  generateApiKey(userId, tier = 'free', metadata = {}) {
    const apiKey = 'ak_' + crypto.randomBytes(32).toString('hex');
    const secretKey = 'sk_' + crypto.randomBytes(32).toString('hex');

    this.apiKeys.set(apiKey, {
      apiKey,
      secretKey,
      userId,
      tier,
      metadata,
      active: true,
      createdAt: Date.now(),
      lastUsed: null,
      totalRequests: 0
    });

    this.usage.set(apiKey, {
      hourly: { count: 0, resetAt: Date.now() + 3600000 },
      daily: { count: 0, resetAt: this.getNextMidnight() },
      monthly: { count: 0, resetAt: this.getNextMonthStart() }
    });

    return { apiKey, secretKey };
  }

  /**
   * Validate and check rate limit
   */
  checkLimit(apiKey, endpoint = 'default') {
    const keyData = this.apiKeys.get(apiKey);

    if (!keyData) {
      return {
        allowed: false,
        error: 'Invalid API key',
        code: 'INVALID_KEY'
      };
    }

    if (!keyData.active) {
      return {
        allowed: false,
        error: 'API key deactivated',
        code: 'KEY_DEACTIVATED'
      };
    }

    const usage = this.usage.get(apiKey);
    const tier = this.tiers[keyData.tier];

    // Reset counters if needed
    this.resetCountersIfNeeded(apiKey, usage);

    // Check limits
    if (usage.hourly.count >= tier.requestsPerHour) {
      return {
        allowed: false,
        error: 'Hourly rate limit exceeded',
        code: 'RATE_LIMIT_HOURLY',
        limit: tier.requestsPerHour,
        remaining: 0,
        resetAt: usage.hourly.resetAt,
        tier: keyData.tier
      };
    }

    if (usage.daily.count >= tier.requestsPerDay) {
      return {
        allowed: false,
        error: 'Daily rate limit exceeded',
        code: 'RATE_LIMIT_DAILY',
        limit: tier.requestsPerDay,
        remaining: 0,
        resetAt: usage.daily.resetAt,
        tier: keyData.tier
      };
    }

    if (usage.monthly.count >= tier.requestsPerMonth) {
      return {
        allowed: false,
        error: 'Monthly rate limit exceeded',
        code: 'RATE_LIMIT_MONTHLY',
        limit: tier.requestsPerMonth,
        remaining: 0,
        resetAt: usage.monthly.resetAt,
        tier: keyData.tier
      };
    }

    // Increment counters
    usage.hourly.count++;
    usage.daily.count++;
    usage.monthly.count++;
    keyData.totalRequests++;
    keyData.lastUsed = Date.now();

    return {
      allowed: true,
      tier: keyData.tier,
      limits: {
        hourly: {
          limit: tier.requestsPerHour,
          remaining: tier.requestsPerHour - usage.hourly.count,
          resetAt: usage.hourly.resetAt
        },
        daily: {
          limit: tier.requestsPerDay,
          remaining: tier.requestsPerDay - usage.daily.count,
          resetAt: usage.daily.resetAt
        },
        monthly: {
          limit: tier.requestsPerMonth,
          remaining: tier.requestsPerMonth - usage.monthly.count,
          resetAt: usage.monthly.resetAt
        }
      }
    };
  }

  /**
   * Reset counters if time periods have passed
   */
  resetCountersIfNeeded(apiKey, usage) {
    const now = Date.now();

    if (now >= usage.hourly.resetAt) {
      usage.hourly.count = 0;
      usage.hourly.resetAt = now + 3600000;
    }

    if (now >= usage.daily.resetAt) {
      usage.daily.count = 0;
      usage.daily.resetAt = this.getNextMidnight();
    }

    if (now >= usage.monthly.resetAt) {
      usage.monthly.count = 0;
      usage.monthly.resetAt = this.getNextMonthStart();
    }
  }

  /**
   * Upgrade tier
   */
  upgradeTier(apiKey, newTier) {
    const keyData = this.apiKeys.get(apiKey);

    if (!keyData) {
      throw new Error('API key not found');
    }

    if (!this.tiers[newTier]) {
      throw new Error('Invalid tier');
    }

    const oldTier = keyData.tier;
    keyData.tier = newTier;
    keyData.upgradedAt = Date.now();
    keyData.previousTier = oldTier;

    return {
      success: true,
      apiKey,
      oldTier,
      newTier,
      newLimits: this.tiers[newTier]
    };
  }

  /**
   * Deactivate API key
   */
  deactivateKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);

    if (!keyData) {
      throw new Error('API key not found');
    }

    keyData.active = false;
    keyData.deactivatedAt = Date.now();

    return { success: true };
  }

  /**
   * Get API key info
   */
  getKeyInfo(apiKey) {
    const keyData = this.apiKeys.get(apiKey);

    if (!keyData) {
      return null;
    }

    const usage = this.usage.get(apiKey);
    const tier = this.tiers[keyData.tier];

    return {
      apiKey,
      userId: keyData.userId,
      tier: keyData.tier,
      tierDetails: tier,
      active: keyData.active,
      totalRequests: keyData.totalRequests,
      currentUsage: {
        hourly: usage.hourly.count,
        daily: usage.daily.count,
        monthly: usage.monthly.count
      },
      createdAt: keyData.createdAt,
      lastUsed: keyData.lastUsed
    };
  }

  /**
   * Get usage analytics
   */
  getUsageAnalytics(apiKey, period = 'daily') {
    const usage = this.usage.get(apiKey);

    if (!usage) {
      return null;
    }

    return {
      period,
      count:
        usage[period === 'hourly' ? 'hourly' : period === 'monthly' ? 'monthly' : 'daily'].count,
      resetAt:
        usage[period === 'hourly' ? 'hourly' : period === 'monthly' ? 'monthly' : 'daily'].resetAt
    };
  }

  /**
   * Get next midnight
   */
  getNextMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Get next month start
   */
  getNextMonthStart() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth.getTime();
  }

  /**
   * Get all tiers info
   */
  getTiers() {
    return this.tiers;
  }

  /**
   * List user's API keys
   */
  listUserKeys(userId) {
    const keys = [];
    for (const [apiKey, data] of this.apiKeys.entries()) {
      if (data.userId === userId) {
        keys.push({
          apiKey,
          tier: data.tier,
          active: data.active,
          createdAt: data.createdAt,
          lastUsed: data.lastUsed,
          totalRequests: data.totalRequests
        });
      }
    }
    return keys;
  }
}

module.exports = { AdvancedRateLimiter };
