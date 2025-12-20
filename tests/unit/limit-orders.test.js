const { LimitOrderManager } = require('../../limit-orders');

describe('Limit Orders & Advanced Trading', () => {
  let limitOrders;

  beforeEach(() => {
    limitOrders = new LimitOrderManager();
  });

  describe('Limit Order Creation', () => {
    test('should create basic limit order', async () => {
      const result = await limitOrders.createOrder(
        'limit',
        'ETH/USDC',
        1.5,
        2000,
        null,
        Date.now() + 86400000
      );

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order.type).toBe('limit');
      expect(result.order.pair).toBe('ETH/USDC');
      expect(result.order.amount).toBe(1.5);
      expect(result.order.price).toBe(2000);
      expect(result.order.status).toBe('active');
    });

    test('should create stop-loss order', async () => {
      const result = await limitOrders.createOrder(
        'stop-loss',
        'BTC/USDC',
        0.5,
        40000,
        39000,
        Date.now() + 86400000
      );

      expect(result.success).toBe(true);
      expect(result.order.type).toBe('stop-loss');
      expect(result.order.stopPrice).toBe(39000);
    });

    test('should create take-profit order', async () => {
      const result = await limitOrders.createOrder(
        'take-profit',
        'ETH/USDC',
        2,
        2500,
        2600,
        Date.now() + 86400000
      );

      expect(result.success).toBe(true);
      expect(result.order.type).toBe('take-profit');
    });

    test('should create trailing-stop order', async () => {
      const result = await limitOrders.createOrder(
        'trailing-stop',
        'SOL/USDC',
        10,
        100,
        95,
        Date.now() + 86400000
      );

      expect(result.success).toBe(true);
      expect(result.order.type).toBe('trailing-stop');
      expect(result.order.trailingAmount).toBeDefined();
    });
  });

  describe('Order Matching', () => {
    test('should match limit order when price reached', async () => {
      const order = await limitOrders.createOrder(
        'limit',
        'ETH/USDC',
        1,
        2000,
        null,
        Date.now() + 86400000
      );

      // Simulate price update
      await limitOrders.updateMarketPrice('ETH/USDC', 2000);

      const updated = limitOrders.getOrder(order.order.orderId);
      expect(updated.order.status).toBe('filled');
    });

    test('should execute stop-loss when price drops', async () => {
      const order = await limitOrders.createOrder(
        'stop-loss',
        'BTC/USDC',
        0.1,
        45000,
        40000,
        Date.now() + 86400000
      );

      await limitOrders.updateMarketPrice('BTC/USDC', 39000);

      const updated = limitOrders.getOrder(order.order.orderId);
      expect(updated.order.status).toBe('filled');
    });
  });

  describe('Order Management', () => {
    test('should cancel active order', async () => {
      const order = await limitOrders.createOrder(
        'limit',
        'ETH/USDC',
        1,
        2100,
        null,
        Date.now() + 86400000
      );

      const result = await limitOrders.cancelOrder(order.order.orderId);

      expect(result.success).toBe(true);
      expect(result.order.status).toBe('cancelled');
    });

    test('should not cancel filled order', async () => {
      const order = await limitOrders.createOrder(
        'limit',
        'ETH/USDC',
        1,
        2000,
        null,
        Date.now() + 86400000
      );

      await limitOrders.updateMarketPrice('ETH/USDC', 2000);

      const result = await limitOrders.cancelOrder(order.order.orderId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot cancel');
    });

    test('should get active orders', async () => {
      await limitOrders.createLimitOrder({ type: 'buy', pair: 'ETH/USDC', amount: 1, limitPrice: 2000, userAddress: '0x1' });
      await limitOrders.createLimitOrder({ type: 'buy', pair: 'BTC/USDC', amount: 0.5, limitPrice: 45000, userAddress: '0x2' });
      await limitOrders.createLimitOrder({ type: 'buy', pair: 'SOL/USDC', amount: 10, limitPrice: 100, userAddress: '0x3' });

      const activeOrders = limitOrders.getActiveOrders();

      expect(activeOrders.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Order Expiration', () => {
    test('should expire order after time limit', async () => {
      const order = await limitOrders.createOrder(
        'limit',
        'ETH/USDC',
        1,
        2100,
        null,
        Date.now() + 1000
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const updated = limitOrders.getOrder(order.order.orderId);
      expect(updated.order.status).toBe('expired');
    });
  });

  describe('Price Monitoring', () => {
    test('should track price history', () => {
      limitOrders.updateMarketPrice('ETH/USDC', 1900);
      limitOrders.updateMarketPrice('ETH/USDC', 1950);
      limitOrders.updateMarketPrice('ETH/USDC', 2000);

      const history = limitOrders.getPriceHistory('ETH/USDC');

      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history[history.length - 1].price).toBe(2000);
    });
  });

  describe('Order Statistics', () => {
    test('should calculate order book statistics', async () => {
      await limitOrders.createLimitOrder({ type: 'buy', pair: 'ETH/USDC', amount: 1, limitPrice: 1900, userAddress: '0x1' });
      await limitOrders.createLimitOrder({ type: 'buy', pair: 'ETH/USDC', amount: 2, limitPrice: 2000, userAddress: '0x2' });
      await limitOrders.createLimitOrder({ type: 'buy', pair: 'ETH/USDC', amount: 1.5, limitPrice: 2100, userAddress: '0x3' });

      const stats = limitOrders.getOrderBookStats('ETH/USDC');

      expect(stats.totalOrders).toBeGreaterThanOrEqual(3);
      expect(stats.totalVolume).toBeGreaterThanOrEqual(4.5);
    });
  });
});
