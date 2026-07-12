/**
 * AI Assistant Module
 * Natural language processing for blockchain queries
 */
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GPT_MODEL = process.env.AI_MODEL || 'gpt-4-turbo-preview';
const USE_GPT = process.env.OPENAI_API_KEY ? true : false;

/**
 * Intent Classifier
 * Determines user intent from natural language
 */
class IntentClassifier {
  constructor() {
    this.intents = {
      balance: ['balance', 'how much', 'funds', 'wallet', 'check'],
      transaction: ['send', 'transfer', 'pay', 'transaction', 'move'],
      block: ['block', 'height', 'blockchain', 'chain'],
      price: ['price', 'value', 'worth', 'market', 'cost'],
      nft: ['nft', 'token', 'collectible', 'digital art', 'mint'],
      dao: ['dao', 'proposal', 'vote', 'governance'],
      swap: ['swap', 'exchange', 'trade', 'dex'],
      stake: ['stake', 'staking', 'reward', 'yield'],
      bridge: ['bridge', 'cross-chain', 'transfer between'],
      help: ['help', 'how to', 'what is', 'explain', 'commands'],
      admin: ['user', 'kyc', 'role', 'ban', 'unban', 'admin'],
      stats: ['stats', 'statistics', 'metrics', 'tvl', 'volume']
    };
  }

  /**
   * Classify user intent
   */
  classify(query) {
    const lowerQuery = query.toLowerCase();

    for (const [intent, keywords] of Object.entries(this.intents)) {
      if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
        return intent;
      }
    }

    return 'unknown';
  }

  /**
   * Extract entities from query
   */
  extractEntities(query) {
    const entities = {};

    const addressMatch = query.match(/0x[a-fA-F0-9]{40}/);
    if (addressMatch) {
      entities.address = addressMatch[0];
    }

    const amountMatch = query.match(/(\d+(?:\.\d+)?)\s*(AETH|aeth|eth|usdt|usdc)?/i);
    if (amountMatch) {
      entities.amount = parseFloat(amountMatch[1]);
      entities.currency = (amountMatch[2] || 'AETH').toUpperCase();
    }

    const blockMatch = query.match(/block\s*#?(\d+)/i);
    if (blockMatch) {
      entities.blockNumber = parseInt(blockMatch[1]);
    }

    const txMatch = query.match(/(?:tx|transaction|hash):\s*([a-fA-F0-9]{64})/i);
    if (txMatch) {
      entities.txHash = txMatch[1];
    }

    const tokenIdMatch = query.match(/(?:token|nft)[s]?\s*#?(\d+)/i);
    if (tokenIdMatch) {
      entities.tokenId = parseInt(tokenIdMatch[1]);
    }

    const proposalMatch = query.match(/proposal\s*#?(\d+)/i);
    if (proposalMatch) {
      entities.proposalId = parseInt(proposalMatch[1]);
    }

    const networkMatch = query.match(/(ethereum|polygon|base|arbitrum|optimism|avalanche|solana)/i);
    if (networkMatch) {
      entities.network = networkMatch[1].toLowerCase();
    }

    return entities;
  }
}

/**
 * Response Generator
 * Generates natural language responses
 */
class ResponseGenerator {
  constructor() {
    this.templates = {
      balance: 'The balance for address {address} is {balance} AETH.',
      transaction: 'Transaction {hash} sent {amount} AETH from {from} to {to}.',
      block: 'Block #{index} contains {txCount} transactions and was mined at {timestamp}.',
      price: 'The current price of AETH is ${price} USD ({change}% 24h).',
      nft: 'NFT #{tokenId} is owned by {owner}.',
      dao: 'Proposal \'{title}\' has {votesFor} votes for and {votesAgainst} against.',
      error: 'I\'m sorry, I couldn\'t {action}. {reason}',
      unknown:
        'I\'m not sure what you\'re asking. Try asking about balances, transactions, blocks, or NFTs.'
    };
  }

  /**
   * Generate response from template
   */
  generate(template, data) {
    let response = this.templates[template] || this.templates.unknown;

    for (const [key, value] of Object.entries(data)) {
      response = response.replace(`{${key}}`, value);
    }

    return response;
  }

  /**
   * Generate formatted response
   */
  format(data, type) {
    switch (type) {
    case 'balance':
      return this.generate('balance', data);

    case 'transaction':
      return this.generate('transaction', data);

    case 'block':
      return this.generate('block', data);

    case 'price':
      return this.generate('price', data);

    case 'nft':
      return this.generate('nft', data);

    case 'dao':
      return this.generate('dao', data);

    default:
      return this.generate('unknown', {});
    }
  }
}

/**
 * AI Assistant
 * Main assistant class
 */
class AIAssistant {
  constructor(blockchain, apiClient) {
    this.blockchain = blockchain;
    this.apiClient = apiClient;
    this.classifier = new IntentClassifier();
    this.responseGenerator = new ResponseGenerator();
    this.conversationHistory = [];
    this.context = {};
    this.usageStats = { totalQueries: 0, gptQueries: 0, fallbackQueries: 0 };
    this.systemPrompt = `You are Aetheron's AI Assistant, a helpful blockchain assistant for the Aetheron platform.

You can help users with:
- Checking wallet balances and transaction history
- Creating and sending transactions
- Viewing blockchain blocks and data
- Checking token/NFT prices and ownership
- DAO governance and voting
- DEX swaps and exchanges
- Staking and yield farming
- Cross-chain bridging
- Platform stats and metrics
- Admin tasks (KYC, user management)

Always be helpful, concise, and accurate. If you don't know something, say so.`;
  }

  /**
   * Process natural language query with GPT-4
   */
  async query(userQuery) {
    this.usageStats.totalQueries++;
    const intent = this.classifier.classify(userQuery);
    const entities = this.classifier.extractEntities(userQuery);

    if (entities.address) this.context.lastAddress = entities.address;
    if (entities.amount) this.context.lastAmount = entities.amount;

    if (USE_GPT) {
      return await this.queryGPT(userQuery, intent, entities);
    }

    return await this.handleIntent(intent, entities, userQuery);
  }

  async queryGPT(userQuery, intent, entities) {
    this.usageStats.gptQueries++;
    try {
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory.slice(-10).map(h => ({
          role: h.role,
          content: h.content
        })),
        { role: 'user', content: userQuery }
      ];

      const completion = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content || 
        this.responseGenerator.generate('unknown', {});

      this.conversationHistory.push(
        { role: 'user', content: userQuery, timestamp: Date.now() },
        { role: 'assistant', content: response, timestamp: Date.now() }
      );

      if (this.conversationHistory.length > 50) {
        this.conversationHistory = this.conversationHistory.slice(-50);
      }

      return response;
    } catch (error) {
      console.error('[AI] GPT query failed:', error.message);
      this.usageStats.fallbackQueries++;
      return await this.handleIntent(intent, entities, userQuery);
    }
  }

  /**
   * Process natural language query (fallback)
   */
  async queryLegacy(userQuery) {
    this.usageStats.fallbackQueries++;
    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userQuery,
      timestamp: Date.now()
    });

    try {
      // Classify intent
      const intent = this.classifier.classify(userQuery);

      // Extract entities
      const entities = this.classifier.extractEntities(userQuery);

      // Update context
      if (entities.address) this.context.lastAddress = entities.address;
      if (entities.amount) this.context.lastAmount = entities.amount;

      // Handle intent
      const response = await this.handleIntent(intent, entities, userQuery);

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      const errorResponse = this.responseGenerator.generate('error', {
        action: 'process your request',
        reason: error.message
      });

      this.conversationHistory.push({
        role: 'assistant',
        content: errorResponse,
        timestamp: Date.now()
      });

      return errorResponse;
    }
  }

  /**
   * Handle specific intent
   */
  async handleIntent(intent, entities, query) {
    switch (intent) {
    case 'balance':
      return await this.handleBalance(entities);

    case 'transaction':
      return await this.handleTransaction(entities, query);

    case 'block':
      return await this.handleBlock(entities);

    case 'price':
      return await this.handlePrice(entities);

    case 'nft':
      return await this.handleNFT(entities, query);

    case 'dao':
      return await this.handleDAO(entities);

      case 'swap':
        return this.handleSwap(entities);

      case 'stake':
        return this.handleStake(entities);

      case 'bridge':
        return this.handleBridge(entities);

      case 'admin':
        return this.handleAdmin(entities, query);

      case 'stats':
        return this.handleStats(entities);

      case 'help':
      return this.handleHelp(query);

    default:
      return this.responseGenerator.generate('unknown', {});
    }
  }

  /**
   * Handle balance query
   */
  async handleBalance(entities) {
    const address = entities.address || this.context.lastAddress;

    if (!address) {
      return 'Please specify an address to check the balance.';
    }

    const balance = this.blockchain.getBalance(address);

    return this.responseGenerator.format(
      {
        address,
        balance: balance.toFixed(4)
      },
      'balance'
    );
  }

  /**
   * Handle transaction query
   */
  async handleTransaction(entities, query) {
    // Check if user wants to create transaction
    if (query.toLowerCase().includes('send') || query.toLowerCase().includes('transfer')) {
      if (!entities.address || !entities.amount) {
        return 'To send a transaction, please specify both the recipient address and amount.';
      }

      return `To send ${entities.amount} AETH to ${entities.address}, please confirm the transaction in your wallet.`;
    }

    // Check transaction status
    if (entities.txHash) {
      const tx = this.findTransaction(entities.txHash);

      if (!tx) {
        return 'Transaction not found. Please check the transaction hash.';
      }

      return this.responseGenerator.format(
        {
          hash: tx.hash.substring(0, 10) + '...',
          amount: tx.amount,
          from: tx.sender.substring(0, 10) + '...',
          to: tx.receiver.substring(0, 10) + '...'
        },
        'transaction'
      );
    }

    return 'Please specify a transaction hash to look up, or ask me to send a transaction.';
  }

  /**
   * Handle block query
   */
  async handleBlock(entities) {
    const blockNumber =
      entities.blockNumber !== undefined ? entities.blockNumber : this.blockchain.chain.length - 1;

    if (blockNumber < 0 || blockNumber >= this.blockchain.chain.length) {
      return `Block #${blockNumber} not found. The blockchain has ${this.blockchain.chain.length} blocks.`;
    }

    const block = this.blockchain.chain[blockNumber];

    return this.responseGenerator.format(
      {
        index: block.index,
        txCount: block.transactions?.length || 0,
        timestamp: new Date(block.timestamp).toLocaleString()
      },
      'block'
    );
  }

  /**
   * Handle price query
   */
  async handlePrice(_entities) {
    // Simulate price data (in production, fetch from API)
    const price = 1.23;
    const change = 5.67;

    return this.responseGenerator.format(
      {
        price: price.toFixed(2),
        change: change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)
      },
      'price'
    );
  }

  /**
   * Handle NFT query
   */
  async handleNFT(entities, query = '') {
    // Extract token ID from query
    const tokenIdMatch = entities.tokenId || this.extractTokenId(query);

    if (!tokenIdMatch) {
      return 'Please specify an NFT token ID to look up.';
    }

    return this.responseGenerator.format(
      {
        tokenId: tokenIdMatch,
        owner: '0x123...abc'
      },
      'nft'
    );
  }

  /**
   * Handle DAO query
   */
  async handleDAO(_entities) {
    return this.responseGenerator.format(
      {
        title: 'Example Proposal',
        votesFor: 150,
        votesAgainst: 50
      },
      'dao'
    );
  }

  /**
   * Handle swap query
   */
  async handleSwap(entities) {
    if (!entities.amount || !entities.currency) {
      return 'To swap, please specify amount and token. Example: "Swap 100 USDC for ETH"';
    }
    return `To swap ${entities.amount} ${entities.currency}, I'll connect you to the DEX. Please confirm the transaction in your wallet.`;
  }

  /**
   * Handle stake query
   */
  async handleStake(entities) {
    if (!entities.amount) {
      return 'To stake, please specify the amount. Example: "Stake 100 AETH"';
    }
    return `Staking ${entities.amount} AETH will earn approximately 5% APY. Would you like to proceed?`;
  }

  /**
   * Handle bridge query
   */
  async handleBridge(entities) {
    if (!entities.network) {
      return 'I can help bridge tokens. Please specify source and destination networks. Example: "Bridge 100 AETH from Ethereum to Base"';
    }
    return `Cross-chain bridging to ${entities.network} network. This may take 10-30 minutes depending on network conditions.`;
  }

  /**
   * Handle admin query
   */
  async handleAdmin(entities, query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('kyc')) {
      return 'KYC management: I can approve or reject KYC applications. You need admin permissions to perform this action.';
    }
    if (lowerQuery.includes('ban')) {
      return 'User ban management: I can ban or unban users. You need admin permissions to perform this action.';
    }
    if (lowerQuery.includes('role')) {
      return 'Role management: Available roles are user, moderator, admin. You need admin permissions to change roles.';
    }
    return 'Admin commands: KYC, role changes, user bans. Requires admin permissions.';
  }

  /**
   * Handle stats query
   */
  async handleStats(_entities) {
    return `Aetheron Platform Stats:
    
• Total Value Locked (TVL): $1,234,567
• 24h Trading Volume: $89,012
• Total Users: 1,234
• Active Validators: 21

Would you like more details on any metric?`;
  }

  /**
   * Handle help query
   */
  handleHelp(query) {
    const helpTopics = {
      balance: 'Ask "What is the balance of 0x123..." to check an address balance.',
      transaction: 'Ask "Send 10 AETH to 0x456..." to create a transaction.',
      block: 'Ask "Show me block #100" to view block details.',
      price: 'Ask "What is the price of AETH?" to get current prices.',
      nft: 'Ask "Who owns NFT #123?" to look up NFT ownership.',
      dao: 'Ask "What is the status of proposal 5?" to check DAO proposals.',
      swap: 'Ask "Swap 100 USDC for ETH" to exchange tokens.',
      stake: 'Ask "Stake 100 AETH" to stake tokens.',
      bridge: 'Ask "Bridge 100 AETH to Base" to cross-chain.',
      stats: 'Ask "What are the platform stats?" to see metrics.'
    };

    const lowerQuery = query.toLowerCase();

    for (const [topic, help] of Object.entries(helpTopics)) {
      if (lowerQuery.includes(topic)) {
        return help;
      }
    }

    return `I can help you with:
    
• Check balances: "What is my balance?"
• Send transactions: "Send 10 AETH to 0x456..."
• View blocks: "Show me the latest block"
• Check prices: "What is the AETH price?"
• NFTs: "Who owns NFT #123?"
• DAO: "Show me active proposals"
• Swap tokens: "Swap 100 USDC for ETH"
• Stake: "Stake 100 AETH"
• Bridge: "Bridge to Base"
• Stats: "Show platform stats"
• Admin: "Help with user management"

What would you like to know?`;
  }

  /**
   * Find transaction by hash
   */
  findTransaction(hash) {
    for (const block of this.blockchain.chain) {
      const tx = block.transactions?.find((t) => t.hash === hash);
      if (tx) return tx;
    }
    return null;
  }

  /**
   * Extract token ID from query
   */
  extractTokenId(query) {
    const match = query.match(/#?(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Get conversation history
   */
  getHistory(limit = 10) {
    return this.conversationHistory.slice(-limit);
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.context = {};
  }

  /**
   * Suggest actions based on context
   */
  suggestActions() {
    const suggestions = [];

    if (this.context.lastAddress) {
      suggestions.push(`Check balance of ${this.context.lastAddress}`);
    }

    if (this.context.lastAmount) {
      suggestions.push(`Send ${this.context.lastAmount} AETH`);
    }

    suggestions.push('View latest block');
    suggestions.push('Check AETH price');
    suggestions.push('View active DAO proposals');

    return suggestions;
  }

  getStats() {
    return { ...this.usageStats };
  }
}

/**
 * Advanced Query Parser
 * Handles complex queries
 */
class AdvancedQueryParser {
  /**
   * Parse comparison queries
   */
  static parseComparison(query) {
    // "Show me transactions over 100 AETH"
    const patterns = [
      /over|more than|greater than\s+(\d+(?:\.\d+)?)/i,
      /under|less than|below\s+(\d+(?:\.\d+)?)/i,
      /between\s+(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return {
          type: 'comparison',
          operator: match[0].split(/\s+/)[0].toLowerCase(),
          value: parseFloat(match[1]),
          value2: match[2] ? parseFloat(match[2]) : null
        };
      }
    }

    return null;
  }

  /**
   * Parse time-based queries
   */
  static parseTimeRange(query) {
    // "Show me transactions from the last hour"
    const patterns = {
      'last hour': 3600000,
      'last day': 86400000,
      'last week': 604800000,
      'last month': 2592000000
    };

    for (const [pattern, ms] of Object.entries(patterns)) {
      if (query.toLowerCase().includes(pattern)) {
        return {
          type: 'timeRange',
          from: Date.now() - ms,
          to: Date.now()
        };
      }
    }

    return null;
  }
}

export {
  AIAssistant,
  IntentClassifier,
  ResponseGenerator,
  AdvancedQueryParser
};
