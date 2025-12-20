// Webhook Management System
const crypto = require('crypto');
const axios = require('axios');

class WebhookManager {
  constructor() {
    this.webhooks = new Map();
    this.deliveryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  register(url, events, secret) {
    const webhookId = crypto.randomBytes(16).toString('hex');

    const webhook = {
      id: webhookId,
      url,
      events: Array.isArray(events) ? events : [events],
      secret: secret || crypto.randomBytes(32).toString('hex'),
      active: true,
      createdAt: Date.now(),
      lastDelivery: null,
      deliveryCount: 0,
      failureCount: 0
    };

    this.webhooks.set(webhookId, webhook);
    return webhook;
  }

  async trigger(event, data) {
    const webhooks = Array.from(this.webhooks.values()).filter(
      (w) => w.active && w.events.includes(event)
    );

    const deliveries = webhooks.map((webhook) => this.deliver(webhook, event, data));

    return Promise.allSettled(deliveries);
  }

  async deliver(webhook, event, data, attempt = 1) {
    const deliveryId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();

    const payload = {
      id: deliveryId,
      event,
      data,
      timestamp,
      webhookId: webhook.id
    };

    const signature = this.generateSignature(payload, webhook.secret);

    try {
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Aetheron-Event': event,
          'X-Aetheron-Signature': signature,
          'X-Aetheron-Delivery': deliveryId
        },
        timeout: 10000
      });

      webhook.lastDelivery = timestamp;
      webhook.deliveryCount++;

      this.recordDelivery(deliveryId, webhook.id, event, 'success', response.status);

      return {
        success: true,
        deliveryId,
        webhookId: webhook.id,
        statusCode: response.status
      };
    } catch (error) {
      webhook.failureCount++;

      if (attempt < this.maxRetries) {
        await this.sleep(this.retryDelay * attempt);
        return this.deliver(webhook, event, data, attempt + 1);
      }

      this.recordDelivery(deliveryId, webhook.id, event, 'failed', error.response?.status);

      return {
        success: false,
        deliveryId,
        webhookId: webhook.id,
        error: error.message,
        attempts: attempt
      };
    }
  }

  generateSignature(payload, secret) {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  verifySignature(payload, signature, secret) {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  recordDelivery(deliveryId, webhookId, event, status, statusCode) {
    this.deliveryAttempts.set(deliveryId, {
      id: deliveryId,
      webhookId,
      event,
      status,
      statusCode,
      timestamp: Date.now()
    });
  }

  getWebhook(id) {
    return this.webhooks.get(id);
  }

  updateWebhook(id, updates) {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;

    Object.assign(webhook, updates);
    return webhook;
  }

  deleteWebhook(id) {
    return this.webhooks.delete(id);
  }

  listWebhooks() {
    return Array.from(this.webhooks.values());
  }

  getDeliveries(webhookId, limit = 50) {
    return Array.from(this.deliveryAttempts.values())
      .filter((d) => d.webhookId === webhookId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Event Types
const WebhookEvents = {
  BLOCK_MINED: 'block.mined',
  TRANSACTION_CONFIRMED: 'transaction.confirmed',
  TRANSACTION_PENDING: 'transaction.pending',
  BALANCE_CHANGED: 'balance.changed',
  CONTRACT_DEPLOYED: 'contract.deployed',
  NFT_MINTED: 'nft.minted',
  NFT_TRANSFERRED: 'nft.transferred',
  PROPOSAL_CREATED: 'proposal.created',
  PROPOSAL_VOTED: 'proposal.voted',
  PROPOSAL_EXECUTED: 'proposal.executed',
  STAKING_DEPOSITED: 'staking.deposited',
  STAKING_WITHDRAWN: 'staking.withdrawn',
  LIQUIDITY_ADDED: 'liquidity.added',
  LIQUIDITY_REMOVED: 'liquidity.removed',
  SWAP_EXECUTED: 'swap.executed'
};

module.exports = { WebhookManager, WebhookEvents };
