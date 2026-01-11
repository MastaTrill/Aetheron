// Aetheron WebSocket Server for Real-Time Updates
import { WebSocketServer } from 'ws';

class AetheronWebSocket {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Set();
    this.setupServer();
  }

  setupServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('[WebSocket] New client connected from:', req.socket.remoteAddress);
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        message: 'Connected to Aetheron real-time updates',
        timestamp: new Date().toISOString()
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error);
        this.clients.delete(ws);
      });
    });
  }

  handleClientMessage(ws, data) {
    console.log('[WebSocket] Received:', data);

    switch (data.type) {
    case 'ping':
      this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
      break;

    case 'subscribe':
      // Handle subscription to specific channels
      ws.subscriptions = ws.subscriptions || new Set();
      ws.subscriptions.add(data.channel);
      this.sendToClient(ws, {
        type: 'subscribed',
        channel: data.channel,
        message: `Subscribed to ${data.channel}`
      });
      break;

    case 'unsubscribe':
      if (ws.subscriptions) {
        ws.subscriptions.delete(data.channel);
        this.sendToClient(ws, {
          type: 'unsubscribed',
          channel: data.channel
        });
      }
      break;

    case 'chat':
      // Broadcast chat message to all clients
      this.broadcast(
        {
          type: 'chat',
          user: data.user || 'Anonymous',
          message: data.message,
          timestamp: new Date().toISOString()
        },
        'chat'
      );
      break;

    default:
      this.sendToClient(ws, {
        type: 'error',
        message: 'Unknown message type'
      });
    }
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  broadcast(data, channel = null) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // If channel specified, only send to subscribed clients
        if (!channel || (client.subscriptions && client.subscriptions.has(channel))) {
          client.send(message);
        }
      }
    });
  }

  // Blockchain-specific events
  notifyNewBlock(block) {
    this.broadcast(
      {
        type: 'newBlock',
        block: {
          index: block.index,
          hash: block.hash,
          transactions: block.transactions.length,
          timestamp: block.timestamp
        },
        timestamp: new Date().toISOString()
      },
      'blockchain'
    );
  }

  notifyNewTransaction(transaction) {
    this.broadcast(
      {
        type: 'newTransaction',
        transaction: {
          from: transaction.sender,
          to: transaction.receiver,
          amount: transaction.amount,
          fee: transaction.fee,
          hash: transaction.hash
        },
        timestamp: new Date().toISOString()
      },
      'blockchain'
    );
  }

  notifyUserAction(action, details) {
    this.broadcast(
      {
        type: 'userAction',
        action,
        details,
        timestamp: new Date().toISOString()
      },
      'dashboard'
    );
  }

  notifySystemAlert(level, message, details = {}) {
    this.broadcast(
      {
        type: 'systemAlert',
        level, // 'info', 'warning', 'error', 'success'
        message,
        details,
        timestamp: new Date().toISOString()
      },
      'alerts'
    );
  }

  // Send stats update
  notifyStatsUpdate(stats) {
    this.broadcast(
      {
        type: 'statsUpdate',
        stats,
        timestamp: new Date().toISOString()
      },
      'dashboard'
    );
  }

  getConnectionCount() {
    return this.clients.size;
  }
}

export { AetheronWebSocket };
