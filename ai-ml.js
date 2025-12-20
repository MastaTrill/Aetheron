// AI/ML Integration for Blockchain Analysis
const crypto = require('crypto');

class FraudDetector {
  constructor() {
    this.suspiciousPatterns = [];
    this.knownScams = new Set();
    this.whitelist = new Set();
    this.blacklist = new Set();
  }

  analyzeTransaction(tx) {
    const riskScore = this.calculateRiskScore(tx);
    const patterns = this.detectPatterns(tx);
    const verdict = this.makeVerdict(riskScore, patterns);

    return {
      transaction: tx.hash,
      riskScore,
      patterns,
      verdict,
      recommendations: this.getRecommendations(verdict, patterns)
    };
  }

  calculateRiskScore(tx) {
    let score = 0;

    // Blacklisted addresses
    if (this.blacklist.has(tx.sender) || this.blacklist.has(tx.receiver)) {
      score += 90;
    }

    // Whitelisted addresses get bonus
    if (this.whitelist.has(tx.sender) && this.whitelist.has(tx.receiver)) {
      return 0;
    }

    // Large value transfers
    if (tx.amount > 100000) score += 30;
    if (tx.amount > 1000000) score += 50;

    // Unusual gas prices
    if (tx.gasPrice && tx.gasPrice > 500) score += 20;

    // New addresses
    if (tx.senderAge && tx.senderAge < 86400000) score += 25; // < 1 day old

    // Round number amounts (often used in scams)
    if (this.isRoundNumber(tx.amount)) score += 15;

    // Time-based patterns
    const hour = new Date(tx.timestamp).getHours();
    if (hour >= 2 && hour <= 5) score += 10; // Unusual hours

    return Math.min(score, 100);
  }

  detectPatterns(tx) {
    const patterns = [];

    // Ponzi scheme pattern
    if (this.detectPonziPattern(tx)) {
      patterns.push({
        type: 'PONZI_SCHEME',
        confidence: 0.75,
        description: 'Transaction matches Ponzi scheme pattern'
      });
    }

    // Wash trading
    if (this.detectWashTrading(tx)) {
      patterns.push({
        type: 'WASH_TRADING',
        confidence: 0.68,
        description: 'Potential wash trading detected'
      });
    }

    // Phishing
    if (this.detectPhishing(tx)) {
      patterns.push({
        type: 'PHISHING',
        confidence: 0.82,
        description: 'Address associated with phishing activity'
      });
    }

    // Rug pull indicators
    if (this.detectRugPull(tx)) {
      patterns.push({
        type: 'RUG_PULL',
        confidence: 0.7,
        description: 'Transaction shows rug pull indicators'
      });
    }

    return patterns;
  }

  detectPonziPattern(tx) {
    // Simplified detection - would use ML model in production
    return tx.receiver === tx.contractAddress && tx.amount > 1000;
  }

  detectWashTrading(tx) {
    // Check for circular trading patterns
    return tx.sender === tx.ultimateReceiver && tx.intermediaryCount > 2;
  }

  detectPhishing(tx) {
    return this.knownScams.has(tx.receiver) || this.knownScams.has(tx.sender);
  }

  detectRugPull(tx) {
    // Large sudden withdrawal from contract
    return tx.type === 'CONTRACT_WITHDRAWAL' && tx.amount > tx.contractBalance * 0.8;
  }

  makeVerdict(riskScore, patterns) {
    if (riskScore >= 80 || patterns.some((p) => p.confidence > 0.8)) {
      return 'BLOCK';
    }
    if (riskScore >= 50 || patterns.some((p) => p.confidence > 0.6)) {
      return 'REVIEW';
    }
    if (riskScore >= 30) {
      return 'WARN';
    }
    return 'PASS';
  }

  getRecommendations(verdict, patterns) {
    const recommendations = [];

    if (verdict === 'BLOCK') {
      recommendations.push('Transaction should be blocked immediately');
      recommendations.push('Report addresses to security team');
    }

    if (verdict === 'REVIEW') {
      recommendations.push('Manual review recommended');
      recommendations.push('Request additional verification from sender');
    }

    patterns.forEach((pattern) => {
      if (pattern.type === 'PHISHING') {
        recommendations.push('Warn user about potential phishing attempt');
      }
      if (pattern.type === 'RUG_PULL') {
        recommendations.push('Alert community about potential rug pull');
      }
    });

    return recommendations;
  }

  isRoundNumber(amount) {
    return amount % 1000 === 0 || amount % 10000 === 0;
  }

  addToBlacklist(address) {
    this.blacklist.add(address);
    this.whitelist.delete(address);
  }

  addToWhitelist(address) {
    this.whitelist.add(address);
    this.blacklist.delete(address);
  }

  reportScam(address) {
    this.knownScams.add(address);
    this.addToBlacklist(address);
  }
}

class PricePredictor {
  constructor() {
    this.priceHistory = [];
    this.predictions = [];
  }

  recordPrice(price, timestamp = Date.now()) {
    this.priceHistory.push({ price, timestamp });

    // Keep last 1000 data points
    if (this.priceHistory.length > 1000) {
      this.priceHistory.shift();
    }
  }

  predict(horizon = 3600000) {
    // 1 hour default
    if (this.priceHistory.length < 10) {
      return { error: 'Insufficient data for prediction' };
    }

    const recent = this.priceHistory.slice(-50);
    const trend = this.calculateTrend(recent);
    const volatility = this.calculateVolatility(recent);
    const momentum = this.calculateMomentum(recent);

    // Simple linear prediction (would use ML model in production)
    const currentPrice = recent[recent.length - 1].price;
    const predictedPrice = currentPrice * (1 + trend);
    const confidence = this.calculateConfidence(volatility, recent.length);

    const prediction = {
      currentPrice,
      predictedPrice,
      change: ((predictedPrice - currentPrice) / currentPrice) * 100,
      confidence,
      trend: this.getTrendLabel(trend),
      volatility: this.getVolatilityLabel(volatility),
      momentum: this.getMomentumLabel(momentum),
      horizon,
      timestamp: Date.now()
    };

    this.predictions.push(prediction);
    return prediction;
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;

    const prices = data.map((d) => d.price);
    const n = prices.length;

    // Linear regression
    const sumX = (n * (n - 1)) / 2;
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = prices.reduce((sum, price, i) => sum + i * price, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgPrice = sumY / n;

    return slope / avgPrice; // Normalized trend
  }

  calculateVolatility(data) {
    const prices = data.map((d) => d.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  calculateMomentum(data) {
    if (data.length < 10) return 0;

    const recent = data.slice(-5);
    const older = data.slice(-10, -5);

    const recentAvg = recent.reduce((sum, d) => sum + d.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.price, 0) / older.length;

    return (recentAvg - olderAvg) / olderAvg;
  }

  calculateConfidence(volatility, dataPoints) {
    let confidence = 100;

    // Penalize high volatility
    confidence -= volatility * 100;

    // Reward more data points
    if (dataPoints < 50) confidence -= 20;
    if (dataPoints < 20) confidence -= 30;

    return Math.max(0, Math.min(100, confidence));
  }

  getTrendLabel(trend) {
    if (trend > 0.05) return 'STRONG_UPWARD';
    if (trend > 0.02) return 'UPWARD';
    if (trend > -0.02) return 'SIDEWAYS';
    if (trend > -0.05) return 'DOWNWARD';
    return 'STRONG_DOWNWARD';
  }

  getVolatilityLabel(volatility) {
    if (volatility > 0.1) return 'VERY_HIGH';
    if (volatility > 0.05) return 'HIGH';
    if (volatility > 0.02) return 'MODERATE';
    return 'LOW';
  }

  getMomentumLabel(momentum) {
    if (momentum > 0.05) return 'ACCELERATING';
    if (momentum > 0) return 'POSITIVE';
    if (momentum > -0.05) return 'NEGATIVE';
    return 'DECELERATING';
  }

  evaluatePrediction(predictionId) {
    const prediction = this.predictions[predictionId];
    if (!prediction) return null;

    const currentPrice = this.priceHistory[this.priceHistory.length - 1]?.price;
    if (!currentPrice) return null;

    const actualChange = ((currentPrice - prediction.currentPrice) / prediction.currentPrice) * 100;
    const error = Math.abs(actualChange - prediction.change);
    const accuracy = Math.max(0, 100 - error);

    return {
      predicted: prediction.predictedPrice,
      actual: currentPrice,
      error,
      accuracy,
      successful: error < 5 // Within 5% is considered successful
    };
  }
}

class AMMOptimizer {
  constructor() {
    this.pools = new Map();
  }

  addPool(poolId, tokenA, tokenB, reserveA, reserveB, fee = 0.003) {
    this.pools.set(poolId, {
      tokenA,
      tokenB,
      reserveA,
      reserveB,
      fee,
      k: reserveA * reserveB
    });
  }

  optimizeSwap(tokenIn, tokenOut, amountIn) {
    const routes = this.findRoutes(tokenIn, tokenOut);
    let bestRoute = null;
    let bestOutput = 0;

    routes.forEach((route) => {
      const output = this.calculateRouteOutput(route, amountIn);
      if (output > bestOutput) {
        bestOutput = output;
        bestRoute = route;
      }
    });

    return {
      route: bestRoute,
      amountOut: bestOutput,
      priceImpact: this.calculatePriceImpact(bestRoute, amountIn, bestOutput),
      recommendation: this.getSwapRecommendation(amountIn, bestOutput, bestRoute)
    };
  }

  findRoutes(tokenIn, tokenOut, maxHops = 3) {
    const routes = [];

    // Direct routes
    this.pools.forEach((pool, poolId) => {
      if (
        (pool.tokenA === tokenIn && pool.tokenB === tokenOut) ||
        (pool.tokenB === tokenIn && pool.tokenA === tokenOut)
      ) {
        routes.push([poolId]);
      }
    });

    // Multi-hop routes (simplified)
    this.pools.forEach((pool1, poolId1) => {
      if (pool1.tokenA === tokenIn || pool1.tokenB === tokenIn) {
        const intermediate = pool1.tokenA === tokenIn ? pool1.tokenB : pool1.tokenA;

        this.pools.forEach((pool2, poolId2) => {
          if (
            poolId1 !== poolId2 &&
            ((pool2.tokenA === intermediate && pool2.tokenB === tokenOut) ||
              (pool2.tokenB === intermediate && pool2.tokenA === tokenOut))
          ) {
            routes.push([poolId1, poolId2]);
          }
        });
      }
    });

    return routes;
  }

  calculateRouteOutput(route, amountIn) {
    let currentAmount = amountIn;

    route.forEach((poolId) => {
      const pool = this.pools.get(poolId);
      currentAmount = this.calculateSwapOutput(pool, currentAmount);
    });

    return currentAmount;
  }

  calculateSwapOutput(pool, amountIn) {
    // Constant product formula: x * y = k
    const amountInWithFee = amountIn * (1 - pool.fee);
    const numerator = amountInWithFee * pool.reserveB;
    const denominator = pool.reserveA + amountInWithFee;
    return numerator / denominator;
  }

  calculatePriceImpact(route, amountIn, amountOut) {
    // Simplified price impact calculation
    const spotPrice = route.length === 1 ? this.getSpotPrice(route[0]) : amountOut / amountIn;

    const executionPrice = amountOut / amountIn;
    return ((executionPrice - spotPrice) / spotPrice) * 100;
  }

  getSpotPrice(poolId) {
    const pool = this.pools.get(poolId);
    return pool.reserveB / pool.reserveA;
  }

  getSwapRecommendation(amountIn, amountOut, route) {
    const priceImpact = this.calculatePriceImpact(route, amountIn, amountOut);

    if (priceImpact > 5) {
      return 'HIGH_IMPACT - Consider splitting into smaller trades';
    }
    if (priceImpact > 2) {
      return 'MODERATE_IMPACT - Trade with caution';
    }
    if (route.length > 1) {
      return 'MULTI_HOP - Verify route carefully';
    }
    return 'OPTIMAL - Good time to trade';
  }

  optimizeLiquidity(poolId, targetRatio) {
    const pool = this.pools.get(poolId);
    if (!pool) return null;

    const currentRatio = pool.reserveA / pool.reserveB;
    const adjustment = targetRatio / currentRatio;

    return {
      currentRatio,
      targetRatio,
      adjustment,
      recommendation: this.getLiquidityRecommendation(adjustment)
    };
  }

  getLiquidityRecommendation(adjustment) {
    if (adjustment > 1.1) return 'ADD_TOKEN_A';
    if (adjustment < 0.9) return 'ADD_TOKEN_B';
    return 'BALANCED';
  }
}

module.exports = {
  FraudDetector,
  PricePredictor,
  AMMOptimizer
};
