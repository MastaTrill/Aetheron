/**
 * Notification Service
 * Email and SMS notifications via SendGrid and Twilio
 */

const crypto = require('crypto');

/**
 * Email Service (SendGrid)
 * Send transactional and marketing emails
 */
class EmailService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.templates = new Map();
    this.sent = new Map();
    this.fromEmail = 'aetheron.solana@gmail.com';
    this.fromName = 'Aetheron';
  }

  /**
   * Register email template
   */
  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, content, options = {}) {
    const emailId = crypto.randomBytes(16).toString('hex');

    const email = {
      id: emailId,
      to,
      from: options.from || `${this.fromName} <${this.fromEmail}>`,
      subject,
      content,
      contentType: options.contentType || 'text/html',
      attachments: options.attachments || [],
      status: 'sending',
      createdAt: Date.now()
    };

    this.sent.set(emailId, email);

    // Simulate sending (in production, use SendGrid API)
    setTimeout(() => {
      email.status = 'sent';
      email.sentAt = Date.now();
    }, 1000);

    return {
      emailId,
      status: 'sending',
      estimatedDelivery: Date.now() + 5000
    };
  }

  /**
   * Send templated email
   */
  async sendTemplateEmail(to, templateName, data) {
    const template = this.templates.get(templateName);

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const subject = this.renderTemplate(template.subject, data);
    const content = this.renderTemplate(template.body, data);

    return this.sendEmail(to, subject, content, {
      contentType: template.contentType || 'text/html'
    });
  }

  /**
   * Render template with data
   */
  renderTemplate(template, data) {
    let rendered = template;
    for (const [key, value] of Object.entries(data)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return rendered;
  }

  /**
   * Send transaction confirmation email
   */
  async sendTransactionConfirmation(to, transaction) {
    return this.sendTemplateEmail(to, 'transaction-confirmation', {
      txHash: transaction.hash,
      from: transaction.sender,
      to: transaction.receiver,
      amount: transaction.amount,
      timestamp: new Date(transaction.timestamp).toLocaleString()
    });
  }

  /**
   * Send price alert email
   */
  async sendPriceAlert(to, token, price, change) {
    return this.sendTemplateEmail(to, 'price-alert', {
      token,
      price,
      change: change > 0 ? `+${change}%` : `${change}%`,
      direction: change > 0 ? 'increased' : 'decreased'
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(to, alertType, details) {
    return this.sendTemplateEmail(to, 'security-alert', {
      alertType,
      details,
      timestamp: new Date().toLocaleString(),
      actionUrl: 'https://aetheron.network/security'
    });
  }

  /**
   * Send DAO proposal notification
   */
  async sendProposalNotification(to, proposal) {
    return this.sendTemplateEmail(to, 'dao-proposal', {
      proposalTitle: proposal.title,
      proposalDescription: proposal.description,
      deadline: new Date(proposal.deadline).toLocaleString(),
      voteUrl: `https://aetheron.network/dao/proposals/${proposal.id}`
    });
  }

  /**
   * Get email status
   */
  getEmailStatus(emailId) {
    return this.sent.get(emailId);
  }

  /**
   * Get sent emails count
   */
  getSentCount() {
    return this.sent.size;
  }
}

/**
 * SMS Service (Twilio)
 * Send SMS notifications
 */
class SMSService {
  constructor(accountSid, authToken, fromNumber) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
    this.sent = new Map();
  }

  /**
   * Send SMS
   */
  async sendSMS(to, message) {
    if (message.length > 160) {
      throw new Error('Message exceeds 160 characters');
    }

    const smsId = crypto.randomBytes(16).toString('hex');

    const sms = {
      id: smsId,
      to,
      from: this.fromNumber,
      message,
      status: 'sending',
      createdAt: Date.now()
    };

    this.sent.set(smsId, sms);

    // Simulate sending (in production, use Twilio API)
    setTimeout(() => {
      sms.status = 'delivered';
      sms.deliveredAt = Date.now();
    }, 2000);

    return {
      smsId,
      status: 'sending'
    };
  }

  /**
   * Send transaction alert SMS
   */
  async sendTransactionAlert(to, amount, txHash) {
    const message = `Aetheron: Transaction of ${amount} AETH confirmed. Hash: ${txHash.substring(
      0,
      10
    )}...`;
    return this.sendSMS(to, message);
  }

  /**
   * Send security code SMS
   */
  async sendSecurityCode(to, code) {
    const message = `Your Aetheron verification code is: ${code}. Valid for 10 minutes.`;
    return this.sendSMS(to, message);
  }

  /**
   * Send withdrawal notification SMS
   */
  async sendWithdrawalNotification(to, amount) {
    const message = `Aetheron: Withdrawal of ${amount} AETH initiated. Contact support if unauthorized.`;
    return this.sendSMS(to, message);
  }

  /**
   * Send login alert SMS
   */
  async sendLoginAlert(to, location, device) {
    const message = `Aetheron: New login from ${location} on ${device}. Secure your account if not you.`;
    return this.sendSMS(to, message);
  }

  /**
   * Get SMS status
   */
  getSMSStatus(smsId) {
    return this.sent.get(smsId);
  }
}

/**
 * Push Notification Service
 * Web push notifications
 */
class PushNotificationService {
  constructor() {
    this.subscriptions = new Map();
    this.notifications = new Map();
  }

  /**
   * Subscribe to push notifications
   */
  subscribe(userId, subscription) {
    this.subscriptions.set(userId, {
      ...subscription,
      subscribedAt: Date.now()
    });

    return { success: true, userId };
  }

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe(userId) {
    this.subscriptions.delete(userId);
    return { success: true };
  }

  /**
   * Send push notification
   */
  async sendPush(userId, notification) {
    const subscription = this.subscriptions.get(userId);

    if (!subscription) {
      throw new Error('User not subscribed');
    }

    const pushId = crypto.randomBytes(16).toString('hex');

    const push = {
      id: pushId,
      userId,
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/badge-72.png',
      data: notification.data || {},
      status: 'sent',
      sentAt: Date.now()
    };

    this.notifications.set(pushId, push);

    // Simulate push (in production, use Web Push API)
    return {
      pushId,
      status: 'sent'
    };
  }

  /**
   * Send notification to all subscribers
   */
  async broadcast(notification) {
    const results = [];

    for (const userId of this.subscriptions.keys()) {
      try {
        const result = await this.sendPush(userId, notification);
        results.push({ userId, success: true, pushId: result.pushId });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return {
      total: this.subscriptions.size,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results
    };
  }

  /**
   * Get subscriptions count
   */
  getSubscriptionCount() {
    return this.subscriptions.size;
  }
}

/**
 * Notification Manager
 * Unified interface for all notification types
 */
class NotificationManager {
  constructor(config) {
    this.emailService = new EmailService(config.sendgridApiKey);
    this.smsService = new SMSService(
      config.twilioAccountSid,
      config.twilioAuthToken,
      config.twilioPhoneNumber
    );
    this.pushService = new PushNotificationService();

    this.userPreferences = new Map();
    this.setupDefaultTemplates();
  }

  /**
   * Setup default email templates
   */
  setupDefaultTemplates() {
    this.emailService.registerTemplate('transaction-confirmation', {
      subject: 'Transaction Confirmed - {{txHash}}',
      body: `
        <h2>Transaction Confirmed</h2>
        <p>Your transaction has been confirmed on the Aetheron blockchain.</p>
        <ul>
          <li><strong>Hash:</strong> {{txHash}}</li>
          <li><strong>From:</strong> {{from}}</li>
          <li><strong>To:</strong> {{to}}</li>
          <li><strong>Amount:</strong> {{amount}} AETH</li>
          <li><strong>Time:</strong> {{timestamp}}</li>
        </ul>
        <p>View on explorer: https://aetheron.network/tx/{{txHash}}</p>
      `
    });

    this.emailService.registerTemplate('price-alert', {
      subject: 'Price Alert: {{token}} {{direction}}',
      body: `
        <h2>Price Alert</h2>
        <p>{{token}} has {{direction}} by {{change}}!</p>
        <p><strong>Current Price:</strong> ${'$'}{{price}}</p>
        <p>View chart: https://aetheron.network/charts/{{token}}</p>
      `
    });

    this.emailService.registerTemplate('security-alert', {
      subject: 'Security Alert - {{alertType}}',
      body: `
        <h2 style="color: red;">Security Alert</h2>
        <p><strong>Alert Type:</strong> {{alertType}}</p>
        <p><strong>Details:</strong> {{details}}</p>
        <p><strong>Time:</strong> {{timestamp}}</p>
        <p>If this wasn't you, please secure your account immediately: {{actionUrl}}</p>
      `
    });

    this.emailService.registerTemplate('dao-proposal', {
      subject: 'New DAO Proposal: {{proposalTitle}}',
      body: `
        <h2>New DAO Proposal</h2>
        <h3>{{proposalTitle}}</h3>
        <p>{{proposalDescription}}</p>
        <p><strong>Voting Deadline:</strong> {{deadline}}</p>
        <p><a href="{{voteUrl}}">Cast Your Vote</a></p>
      `
    });
  }

  /**
   * Set user notification preferences
   */
  setUserPreferences(userId, preferences) {
    this.userPreferences.set(userId, {
      email: preferences.email !== false,
      sms: preferences.sms || false,
      push: preferences.push !== false,
      channels: {
        transactions: preferences.transactions !== false,
        security: preferences.security !== false,
        price: preferences.price || false,
        dao: preferences.dao || false,
        marketing: preferences.marketing || false
      }
    });
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId) {
    return (
      this.userPreferences.get(userId) || {
        email: true,
        sms: false,
        push: true,
        channels: {
          transactions: true,
          security: true,
          price: false,
          dao: false,
          marketing: false
        }
      }
    );
  }

  /**
   * Send notification (respects user preferences)
   */
  async notify(userId, type, data) {
    const prefs = this.getUserPreferences(userId);
    const results = [];

    // Check if user wants this type of notification
    if (!prefs.channels[type]) {
      return { skipped: true, reason: 'User opted out of this notification type' };
    }

    // Email
    if (prefs.email && data.email) {
      try {
        const result = await this.emailService.sendEmail(
          data.email.to,
          data.email.subject,
          data.email.content
        );
        results.push({ channel: 'email', success: true, id: result.emailId });
      } catch (error) {
        results.push({ channel: 'email', success: false, error: error.message });
      }
    }

    // SMS
    if (prefs.sms && data.sms) {
      try {
        const result = await this.smsService.sendSMS(data.sms.to, data.sms.message);
        results.push({ channel: 'sms', success: true, id: result.smsId });
      } catch (error) {
        results.push({ channel: 'sms', success: false, error: error.message });
      }
    }

    // Push
    if (prefs.push && data.push) {
      try {
        const result = await this.pushService.sendPush(userId, data.push);
        results.push({ channel: 'push', success: true, id: result.pushId });
      } catch (error) {
        results.push({ channel: 'push', success: false, error: error.message });
      }
    }

    return {
      userId,
      type,
      results,
      timestamp: Date.now()
    };
  }

  /**
   * Quick notification methods
   */
  async notifyTransaction(userId, email, phone, transaction) {
    return this.notify(userId, 'transactions', {
      email: {
        to: email,
        subject: `Transaction Confirmed - ${transaction.hash.substring(0, 10)}...`,
        content: `Your transaction of ${transaction.amount} AETH has been confirmed.`
      },
      sms: phone
        ? {
          to: phone,
          message: `Transaction of ${
            transaction.amount
          } AETH confirmed. Hash: ${transaction.hash.substring(0, 10)}...`
        }
        : null,
      push: {
        title: 'Transaction Confirmed',
        body: `${transaction.amount} AETH sent successfully`,
        data: { txHash: transaction.hash }
      }
    });
  }

  async notifySecurityEvent(userId, email, phone, eventType, details) {
    return this.notify(userId, 'security', {
      email: {
        to: email,
        subject: `Security Alert - ${eventType}`,
        content: `Security event detected: ${details}`
      },
      sms: phone
        ? {
          to: phone,
          message: `Aetheron Security: ${eventType}. Contact support if not you.`
        }
        : null,
      push: {
        title: 'Security Alert',
        body: eventType,
        data: { type: eventType, details }
      }
    });
  }
}

module.exports = {
  EmailService,
  SMSService,
  PushNotificationService,
  NotificationManager
};
