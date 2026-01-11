/* eslint-disable no-unused-vars */
import EventEmitter from 'events';
import { ethers } from 'ethers';

/**
 * Aetheron Limit Orders Module
 * Professional trading with limit/stop-loss orders and automated execution
 */
class LimitOrderManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.provider = options.provider;
    this.signer = options.signer;
    this.orders = new Map(); // orderId -> order
    this.orderBook = new Map(); // pair -> {bids: [], asks: []}
    this.priceHistory = new Map(); // pair -> [{price, timestamp}]
    this.executionInterval = options.executionInterval || 5000; // 5 seconds
    this.isRunning = false;
    this.orderIdCounter = 1;
  }

  /**
   * Create a limit order
   */
  async createLimitOrder(params) {
    const {
      type, // 'buy' or 'sell'
      pair, // e.g., 'ETH/USDT'
      amount,
      limitPrice,
      expiresAt,
      userAddress
    } = params;

    const orderId = `order_${this.orderIdCounter++}`;
    const order = {
      id: orderId,
      type,
      pair,
      amount: ethers.parseEther(amount.toString()),
      limitPrice: ethers.parseUnits(limitPrice.toString(), 6), // USDT has 6 decimals
      status: 'open',
      createdAt: Date.now(),
      expiresAt: expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days default
      userAddress,
      filledAmount: ethers.parseEther('0')
    };

    this.orders.set(orderId, order);
    this._addToOrderBook(order);

    this.emit('orderCreated', order);
    return order;
  }

  /**
   * Create a stop-loss order
   */
  async createStopLoss(params) {
    const { type, pair, amount, stopPrice, userAddress } = params;

    const orderId = `stop_${this.orderIdCounter++}`;
    const order = {
      id: orderId,
      type: 'stop-loss',
      side: type, // 'buy' or 'sell'
      pair,
      amount: ethers.parseEther(amount.toString()),
      stopPrice: ethers.parseUnits(stopPrice.toString(), 6),
      status: 'pending',
      createdAt: Date.now(),
      userAddress
    };

    this.orders.set(orderId, order);
    this.emit('stopLossCreated', order);
    return order;
  }

  /**
   * Create a take-profit order
   */
  async createTakeProfit(params) {
    const { type, pair, amount, targetPrice, userAddress } = params;

    const orderId = `tp_${this.orderIdCounter++}`;
    const order = {
      id: orderId,
      type: 'take-profit',
      side: type,
      pair,
      amount: ethers.parseEther(amount.toString()),
      targetPrice: ethers.parseUnits(targetPrice.toString(), 6),
      status: 'pending',
      createdAt: Date.now(),
      userAddress
    };

    this.orders.set(orderId, order);
    this.emit('takeProfitCreated', order);
    return order;
  }

  /**
   * Generic create order method (wrapper for specific order types)
   */
  async createOrder(type, pair, amount, price, stopPrice = null, expiresAt = null, userAddress = '0xdefault') {
    const baseParams = { pair, amount, userAddress };

    switch (type) {
    case 'limit': {
      const orderId = `limit_${this.orderIdCounter++}`;
      const order = {
        orderId,
        type: 'limit',
        side: 'buy',
        pair,
        amount,
        price,
        status: 'active',
        createdAt: Date.now(),
        expiresAt: expiresAt || Date.now() + 86400000,
        userAddress
      };
      this.orders.set(orderId, order);
      return { success: true, order };
    }

    case 'stop-loss': {
      const orderId = `stop_${this.orderIdCounter++}`;
      const order = {
        orderId,
        type: 'stop-loss',
        side: 'sell',
        pair,
        amount,
        price,
        stopPrice,
        status: 'active',
        createdAt: Date.now(),
        expiresAt: expiresAt || Date.now() + 86400000,
        userAddress
      };
      this.orders.set(orderId, order);
      return { success: true, order };
    }

    case 'take-profit': {
      const orderId = `tp_${this.orderIdCounter++}`;
      const order = {
        orderId,
        type: 'take-profit',
        side: 'sell',
        pair,
        amount,
        price,
        targetPrice: stopPrice || price,
        status: 'active',
        createdAt: Date.now(),
        expiresAt: expiresAt || Date.now() + 86400000,
        userAddress
      };
      this.orders.set(orderId, order);
      return { success: true, order };
    }

    case 'trailing-stop': {
      const orderId = `trail_${this.orderIdCounter++}`;
      const trailingAmount = stopPrice || (price * 0.05);
      const order = {
        orderId,
        type: 'trailing-stop',
        side: 'sell',
        pair,
        amount,
        price,
        trailingAmount,
        status: 'active',
        createdAt: Date.now(),
        expiresAt: expiresAt || Date.now() + 86400000,
        userAddress
      };
      this.orders.set(orderId, order);
      return { success: true, order };
    }

    default:
      throw new Error(`Unknown order type: ${type}`);
    }
  }

  /**
   * Create a trailing-stop order
   */
  async createTrailingStop(params) {
    const { type, pair, amount, trailingPercent, userAddress } = params;

    const orderId = `trail_${this.orderIdCounter++}`;
    const order = {
      id: orderId,
      type: 'trailing-stop',
      side: type,
      pair,
      amount: ethers.parseEther(amount.toString()),
      trailingPercent,
      status: 'pending',
      createdAt: Date.now(),
      userAddress,
      highestPrice: null
    };

    this.orders.set(orderId, order);
    this.emit('trailingStopCreated', order);
    return order;
  }

  /**
   * Update market price for price tracking
   */
  updateMarketPrice(pair, price) {
    const priceNum = typeof price === 'number' ? price : Number(price);
    const history = this.priceHistory.get(pair) || [];
    history.push({ price: priceNum, timestamp: Date.now() });

    // Keep last 100 price points
    if (history.length > 100) {
      history.shift();
    }

    this.priceHistory.set(pair, history);
    this.emit('priceUpdated', { pair, price: priceNum });

    // Match orders based on new price
    for (const [orderId, order] of this.orders.entries()) {
      if (order.pair !== pair || order.status !== 'active') continue;

      if (order.type === 'limit' && order.price <= priceNum) {
        order.status = 'filled';
        order.filledAt = Date.now();
      } else if (order.type === 'stop-loss' && order.stopPrice >= priceNum) {
        order.status = 'filled';
        order.filledAt = Date.now();
      } else if (order.type === 'take-profit' && order.targetPrice && priceNum >= order.targetPrice) {
        order.status = 'filled';
        order.filledAt = Date.now();
      }
    }
  }

  /**
   * Get active orders
   */
  getActiveOrders() {
    return Array.from(this.orders.values()).filter(
      order => order.status === 'open' || order.status === 'pending' || order.status === 'active'
    );
  }

  /**
   * Get price history for a trading pair
   */
  getPriceHistory(pair) {
    return this.priceHistory.get(pair) || [];
  }

  /**
   * Get order book stats (alias for getOrderBookStatistics)
   */
  getOrderBookStats(pair) {
    return this.getOrderBookStatistics(pair);
  }

  /**
   * Get order statistics
   */
  getOrderBookStatistics(pair) {
    const orderBook = this.getOrderBook(pair);
    const totalBidVolume = orderBook.bids.reduce((sum, order) => sum + Number(ethers.formatEther(order.amount)), 0);
    const totalAskVolume = orderBook.asks.reduce((sum, order) => sum + Number(ethers.formatEther(order.amount)), 0);

    return {
      pair,
      totalOrders: orderBook.bids.length + orderBook.asks.length,
      bidOrders: orderBook.bids.length,
      askOrders: orderBook.asks.length,
      totalBidVolume,
      totalAskVolume,
      totalVolume: totalBidVolume + totalAskVolume,
      spread: orderBook.asks.length && orderBook.bids.length
        ? Number(ethers.formatUnits(orderBook.asks[0].limitPrice - orderBook.bids[0].limitPrice, 6))
        : 0
    };
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'filled') {
      return { success: false, error: 'Cannot cancel filled order' };
    }

    order.status = 'cancelled';
    order.cancelledAt = Date.now();

    this._removeFromOrderBook(order);
    this.emit('orderCancelled', order);

    return { success: true, order };
  }

  /**
   * Get order by ID
   */
  getOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      return { order: null };
    }

    // Check if order has expired
    if (order.expiresAt && Date.now() > order.expiresAt && order.status === 'active') {
      order.status = 'expired';
    }

    return { order };
  }

  /**
   * Get all orders for a user
   */
  getUserOrders(userAddress, filter = {}) {
    const orders = Array.from(this.orders.values()).filter(
      (order) => order.userAddress.toLowerCase() === userAddress.toLowerCase()
    );

    if (filter.status) {
      return orders.filter((order) => order.status === filter.status);
    }

    if (filter.pair) {
      return orders.filter((order) => order.pair === filter.pair);
    }

    return orders;
  }

  /**
   * Get order book for a trading pair
   */
  getOrderBook(pair) {
    const book = this.orderBook.get(pair) || { bids: [], asks: [] };

    return {
      pair,
      bids: book.bids.sort((a, b) => Number(b.limitPrice - a.limitPrice)),
      asks: book.asks.sort((a, b) => Number(a.limitPrice - b.limitPrice))
    };
  }

  /**
   * Start automated order execution
   */
  startExecution() {
    if (this.isRunning) return;

    this.isRunning = true;
    this._executionLoop();
    this.emit('executionStarted');
  }

  /**
   * Stop automated order execution
   */
  stopExecution() {
    this.isRunning = false;
    this.emit('executionStopped');
  }

  /**
   * Internal: Add order to order book
   */
  _addToOrderBook(order) {
    if (order.type !== 'buy' && order.type !== 'sell') return;

    const book = this.orderBook.get(order.pair) || { bids: [], asks: [] };

    if (order.type === 'buy') {
      book.bids.push(order);
    } else {
      book.asks.push(order);
    }

    this.orderBook.set(order.pair, book);
  }

  /**
   * Internal: Remove order from order book
   */
  _removeFromOrderBook(order) {
    if (order.type !== 'buy' && order.type !== 'sell') return;

    const book = this.orderBook.get(order.pair);
    if (!book) return;

    if (order.type === 'buy') {
      book.bids = book.bids.filter((o) => o.id !== order.id);
    } else {
      book.asks = book.asks.filter((o) => o.id !== order.id);
    }
  }

  /**
   * Internal: Execution loop
   */
  async _executionLoop() {
    while (this.isRunning) {
      try {
        await this._checkAndExecuteOrders();
      } catch (error) {
        this.emit('error', error);
      }

      await new Promise((resolve) => setTimeout(resolve, this.executionInterval));
    }
  }

  /**
   * Internal: Check market prices and execute orders
   */
  async _checkAndExecuteOrders() {
    const currentPrices = await this._fetchCurrentPrices();

    for (const [orderId, order] of this.orders.entries()) {
      if (order.status !== 'open' && order.status !== 'pending') continue;

      // Check expiration
      if (order.expiresAt && Date.now() > order.expiresAt) {
        await this.cancelOrder(orderId);
        continue;
      }

      const currentPrice = currentPrices[order.pair];
      if (!currentPrice) continue;

      // Execute limit orders
      if (order.type === 'buy' && currentPrice <= order.limitPrice) {
        await this._executeOrder(order, currentPrice);
      } else if (order.type === 'sell' && currentPrice >= order.limitPrice) {
        await this._executeOrder(order, currentPrice);
      }

      // Execute stop-loss
      if (order.type === 'stop-loss') {
        if (
          (order.side === 'sell' && currentPrice <= order.stopPrice) ||
          (order.side === 'buy' && currentPrice >= order.stopPrice)
        ) {
          await this._executeOrder(order, currentPrice);
        }
      }

      // Execute take-profit
      if (order.type === 'take-profit') {
        if (
          (order.side === 'sell' && currentPrice >= order.targetPrice) ||
          (order.side === 'buy' && currentPrice <= order.targetPrice)
        ) {
          await this._executeOrder(order, currentPrice);
        }
      }
    }
  }

  /**
   * Internal: Execute an order
   */
  async _executeOrder(order, executionPrice) {
    try {
      // Simulate blockchain transaction
      const txHash = `0x${Math.random().toString(16).substring(2)}`;

      order.status = 'filled';
      order.executionPrice = executionPrice;
      order.filledAmount = order.amount;
      order.executedAt = Date.now();
      order.txHash = txHash;

      this._removeFromOrderBook(order);

      this.emit('orderExecuted', {
        order,
        executionPrice,
        txHash
      });

      return txHash;
    } catch (error) {
      order.status = 'failed';
      order.error = error.message;
      this.emit('executionFailed', { order, error });
      throw error;
    }
  }

  /**
   * Internal: Fetch current market prices
   */
  async _fetchCurrentPrices() {
    // Simulate fetching prices from oracle or DEX
    return {
      'ETH/USDT': ethers.parseUnits('2000', 6),
      'BTC/USDT': ethers.parseUnits('40000', 6),
      'SOL/USDT': ethers.parseUnits('100', 6),
      'AETH/USDT': ethers.parseUnits('1', 6)
    };
  }

  /**
   * Get order statistics
   */
  getStatistics(userAddress) {
    const userOrders = this.getUserOrders(userAddress);

    const stats = {
      total: userOrders.length,
      open: 0,
      filled: 0,
      cancelled: 0,
      failed: 0,
      totalVolume: ethers.parseEther('0')
    };

    for (const order of userOrders) {
      stats[order.status]++;
      if (order.status === 'filled') {
        stats.totalVolume += order.filledAmount;
      }
    }

    return stats;
  }

  /**
   * Create advanced order types
   */
  async createAdvancedOrder(params) {
    const {
      orderType, // 'oco', 'trailing-stop', 'iceberg'
      pair,
      amount,
      userAddress,
      ...orderParams
    } = params;

    if (orderType === 'oco') {
      // One-Cancels-Other: Stop-loss + Take-profit
      const stopLoss = await this.createStopLoss({
        type: orderParams.side,
        pair,
        amount,
        stopPrice: orderParams.stopPrice,
        userAddress
      });

      const takeProfit = await this.createTakeProfit({
        type: orderParams.side,
        pair,
        amount,
        targetPrice: orderParams.targetPrice,
        userAddress
      });

      return { stopLoss, takeProfit };
    }

    if (orderType === 'trailing-stop') {
      const orderId = `trail_${this.orderIdCounter++}`;
      const order = {
        id: orderId,
        type: 'trailing-stop',
        side: orderParams.side,
        pair,
        amount: ethers.parseEther(amount.toString()),
        trailPercent: orderParams.trailPercent || 5, // 5% default
        status: 'pending',
        createdAt: Date.now(),
        userAddress,
        highestPrice: ethers.parseUnits('0', 6)
      };

      this.orders.set(orderId, order);
      this.emit('trailingStopCreated', order);
      return order;
    }

    throw new Error('Unsupported order type');
  }
}

export { LimitOrderManager };
