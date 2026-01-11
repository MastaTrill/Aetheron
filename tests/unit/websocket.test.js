// Unit tests for WebSocket server
const { AetheronWebSocket } = require('../../websocket');
const http = require('http');
const WebSocket = require('ws');

describe('WebSocket Server', () => {
  // let server; // removed unused variable
  let httpServer;
  let wsServer;
  let testPort = 3002;

  beforeAll((done) => {
    httpServer = http.createServer();
    wsServer = new AetheronWebSocket(httpServer);
    httpServer.listen(testPort, done);
  });

  afterAll((done) => {
    // Close all client connections first
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    // Close WebSocket server
    wsServer.wss.close(() => {
      // Close HTTP server
      httpServer.close(done);
    });
  });

  describe('Connection Management', () => {
    test('should accept client connections', (done) => {
      const client = new WebSocket(`ws://localhost:${testPort}`);

      client.on('open', () => {
        expect(client.readyState).toBe(WebSocket.OPEN);
        client.close();
        done();
      });
    });

    test('should send welcome message on connection', (done) => {
      const client = new WebSocket(`ws://localhost:${testPort}`);

      client.on('message', (data) => {
        const message = JSON.parse(data);
        expect(message.type).toBe('connected');
        expect(message.message).toContain('Connected');
        client.close();
        done();
      });
    });

    test('should track connection count', (done) => {
      const client1 = new WebSocket(`ws://localhost:${testPort}`);
      const client2 = new WebSocket(`ws://localhost:${testPort}`);
      let connectedCount = 0;

      const checkConnections = () => {
        connectedCount++;
        if (connectedCount >= 2) {
          const count = wsServer.getConnectionCount();
          expect(count).toBeGreaterThanOrEqual(2);
          client1.close();
          client2.close();
          done();
        }
      };

      client1.on('open', checkConnections);
      client2.on('open', checkConnections);
    });
  });

  describe('Message Handling', () => {
    test('should respond to ping with pong', (done) => {
      const client = new WebSocket(`ws://localhost:${testPort}`);
      const timeout = setTimeout(() => {
        client.close();
        done(new Error('Timeout waiting for pong'));
      }, 5000);

      client.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'pong') {
          clearTimeout(timeout);
          expect(message.timestamp).toBeTruthy();
          client.close();
          done();
        }
      });

      client.on('open', () => {
        client.send(JSON.stringify({ type: 'ping' }));
      });
    });

    test('should handle subscription requests', (done) => {
      const client = new WebSocket(`ws://localhost:${testPort}`);
      const timeout = setTimeout(() => {
        client.close();
        done(new Error('Timeout waiting for subscription confirmation'));
      }, 5000);

      client.on('message', (data) => {
        const message = JSON.parse(data);

        if (message.type === 'subscribed') {
          clearTimeout(timeout);
          expect(message.channel).toBe('blockchain');
          client.close();
          done();
        }
      });

      client.on('open', () => {
        client.send(JSON.stringify({ type: 'subscribe', channel: 'blockchain' }));
      });
    });
  });

  describe('Broadcasting', () => {
    test('should broadcast to all clients', (done) => {
      const client1 = new WebSocket(`ws://localhost:${testPort}`);
      const client2 = new WebSocket(`ws://localhost:${testPort}`);
      let receivedCount = 0;

      const checkDone = () => {
        receivedCount++;
        if (receivedCount === 2) {
          client1.close();
          client2.close();
          done();
        }
      };

      client1.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.type === 'test') checkDone();
      });

      client2.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.type === 'test') checkDone();
      });

      setTimeout(() => {
        wsServer.broadcast({ type: 'test', message: 'broadcast test' });
      }, 100);
    });
  });

  describe('Blockchain Events', () => {
    test('should notify new block', (done) => {
      const client = new WebSocket(`ws://localhost:${testPort}`);
      const timeout = setTimeout(() => {
        client.close();
        done(new Error('Timeout waiting for new block notification'));
      }, 10000);

      client.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'newBlock') {
          clearTimeout(timeout);
          expect(message.block).toBeTruthy();
          expect(message.block.index).toBeDefined();
          client.close();
          done();
        }
      });

      client.on('open', () => {
        // Subscribe to blockchain channel
        client.send(JSON.stringify({ type: 'subscribe', channel: 'blockchain' }));

        // Ensure client is ready before notifying
        setTimeout(() => {
          wsServer.notifyNewBlock({
            index: 1,
            hash: '0xabc123',
            transactions: [],
            timestamp: Date.now()
          });
        }, 200);
      });
    });

    test('should notify new transaction', (done) => {
      const client = new WebSocket(`ws://localhost:${testPort}`);
      const timeout = setTimeout(() => {
        client.close();
        done(new Error('Timeout waiting for new transaction notification'));
      }, 10000);

      client.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'newTransaction') {
          clearTimeout(timeout);
          expect(message.transaction).toBeTruthy();
          expect(message.transaction.amount).toBe(100);
          client.close();
          done();
        }
      });

      client.on('open', () => {
        // Subscribe to blockchain channel
        client.send(JSON.stringify({ type: 'subscribe', channel: 'blockchain' }));

        setTimeout(() => {
          wsServer.notifyNewTransaction({
            sender: '0x123',
            receiver: '0x456',
            amount: 100,
            hash: '0xabc'
          });
        }, 100);
      });
    });
  });
});
