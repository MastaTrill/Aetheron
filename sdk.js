// Developer SDK for Aetheron Platform
const axios = require('axios');
const WebSocket = require('ws');

class AetheronSDK {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:3001';
    this.wsUrl = config.wsUrl || 'ws://localhost:3001';
    this.apiKey = config.apiKey;
    this.version = '1.0.0';
    this.ws = null;
    this.eventHandlers = new Map();
  }

  // Blockchain Operations
  async getBlockchain() {
    return this.request('GET', '/api/blockchain');
  }

  async getBlock(index) {
    return this.request('GET', `/api/block/${index}`);
  }

  async getTransaction(hash) {
    return this.request('GET', `/api/transaction/${hash}`);
  }

  async createTransaction(from, to, amount, privateKey) {
    return this.request('POST', '/api/transaction', {
      from,
      to,
      amount,
      privateKey
    });
  }

  async mineBlock(minerAddress) {
    return this.request('POST', '/api/mine', { minerAddress });
  }

  async getBalance(address) {
    return this.request('GET', `/api/balance/${address}`);
  }

  // Wallet Operations
  async createWallet(password) {
    return this.request('POST', '/api/wallet/create', { password });
  }

  async importWallet(privateKey, password) {
    return this.request('POST', '/api/wallet/import', {
      privateKey,
      password
    });
  }

  async exportWallet(address, password) {
    return this.request('POST', '/api/wallet/export', {
      address,
      password
    });
  }

  // Multi-Chain Operations
  async getSupportedChains() {
    return this.request('GET', '/multichain/chains');
  }

  async getChainBalance(chain, address) {
    return this.request('GET', `/multichain/balance/${chain}/${address}`);
  }

  async getTokenBalance(chain, address, tokenAddress) {
    return this.request('POST', '/multichain/token-balance', {
      chain,
      address,
      tokenAddress
    });
  }

  async getChainConfig(chain) {
    return this.request('GET', `/multichain/config/${chain}`);
  }

  // Smart Contract Operations
  async deployContract(code, abi, from, args = []) {
    return this.request('POST', '/api/contract/deploy', {
      code,
      abi,
      from,
      args
    });
  }

  async callContract(contractAddress, method, args = [], from) {
    return this.request('POST', '/api/contract/call', {
      contractAddress,
      method,
      args,
      from
    });
  }

  async getContractEvents(contractAddress, eventName) {
    return this.request('GET', `/api/contract/${contractAddress}/events/${eventName}`);
  }

  // NFT Operations
  async mintNFT(to, tokenId, metadata) {
    return this.request('POST', '/api/nft/mint', {
      to,
      tokenId,
      metadata
    });
  }

  async transferNFT(from, to, tokenId, privateKey) {
    return this.request('POST', '/api/nft/transfer', {
      from,
      to,
      tokenId,
      privateKey
    });
  }

  async getNFT(tokenId) {
    return this.request('GET', `/api/nft/${tokenId}`);
  }

  async getNFTsByOwner(owner) {
    return this.request('GET', `/api/nft/owner/${owner}`);
  }

  // DeFi Operations
  async swap(tokenIn, tokenOut, amountIn, slippage = 0.5) {
    return this.request('POST', '/api/defi/swap', {
      tokenIn,
      tokenOut,
      amountIn,
      slippage
    });
  }

  async addLiquidity(tokenA, tokenB, amountA, amountB) {
    return this.request('POST', '/api/defi/liquidity/add', {
      tokenA,
      tokenB,
      amountA,
      amountB
    });
  }

  async removeLiquidity(poolId, shares) {
    return this.request('POST', '/api/defi/liquidity/remove', {
      poolId,
      shares
    });
  }

  async stake(amount, duration) {
    return this.request('POST', '/api/defi/stake', {
      amount,
      duration
    });
  }

  async unstake(stakeId) {
    return this.request('POST', '/api/defi/unstake', { stakeId });
  }

  // DAO Operations
  async createProposal(title, description, options) {
    return this.request('POST', '/api/dao/proposal', {
      title,
      description,
      options
    });
  }

  async vote(proposalId, option) {
    return this.request('POST', '/api/dao/vote', {
      proposalId,
      option
    });
  }

  async getProposal(proposalId) {
    return this.request('GET', `/api/dao/proposal/${proposalId}`);
  }

  async getActiveProposals() {
    return this.request('GET', '/api/dao/proposals/active');
  }

  // WebSocket Operations
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        console.log('Connected to Aetheron WebSocket');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(message);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('Disconnected from Aetheron WebSocket');
        this.reconnect();
      });
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  reconnect() {
    setTimeout(() => {
      console.log('Reconnecting...');
      this.connect().catch(console.error);
    }, 5000);
  }

  subscribe(channel) {
    if (!this.ws) {
      throw new Error('Not connected to WebSocket');
    }

    this.ws.send(
      JSON.stringify({
        type: 'subscribe',
        channel
      })
    );
  }

  unsubscribe(channel) {
    if (!this.ws) {
      throw new Error('Not connected to WebSocket');
    }

    this.ws.send(
      JSON.stringify({
        type: 'unsubscribe',
        channel
      })
    );
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  handleMessage(message) {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }

    // Generic message handler
    const allHandlers = this.eventHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(message));
    }
  }

  // HTTP Request Helper
  async request(method, path, data = null) {
    const config = {
      method,
      url: `${this.apiUrl}${path}`,
      headers: {
        'Content-Type': 'application/json',
        'X-SDK-Version': this.version
      }
    };

    if (this.apiKey) {
      config.headers['X-API-Key'] = this.apiKey;
    }

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Utility Methods
  async healthCheck() {
    try {
      const response = await this.request('GET', '/api');
      return {
        healthy: response.status === 'online',
        version: response.version,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async getNetworkStats() {
    return this.request('GET', '/stats');
  }

  async getGasPrice() {
    return this.request('GET', '/api/gas-price');
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AetheronSDK };
}

if (typeof window !== 'undefined') {
  window.AetheronSDK = AetheronSDK;
}
