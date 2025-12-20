const API_BASE_URL = 'http://localhost:3000'; // Change to your server URL

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async fetch(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get list of supported chains
   */
  async getSupportedChains() {
    return this.fetch('/multichain/chains');
  }

  /**
   * Get native balance for an address on a specific chain
   */
  async getBalance(chain, address) {
    return this.fetch(`/multichain/balance/${chain}/${address}`);
  }

  /**
   * Get token balance (AETH) for an address on a specific chain
   */
  async getTokenBalance(chain, address) {
    return this.fetch(`/multichain/token-balance/${chain}/${address}`);
  }

  /**
   * Get current block number for a chain
   */
  async getBlockNumber(chain) {
    return this.fetch(`/multichain/block-number/${chain}`);
  }

  /**
   * Send a transaction
   */
  async sendTransaction(chain, signedTransaction) {
    return this.fetch('/multichain/send', {
      method: 'POST',
      body: JSON.stringify({
        chain,
        signedTransaction
      })
    });
  }

  /**
   * Get transaction details
   */
  async getTransaction(chain, txHash) {
    return this.fetch(`/multichain/transaction/${chain}/${txHash}`);
  }

  /**
   * Get transaction history for an address (if API supports it)
   */
  async getTransactionHistory(chain, address, limit = 10) {
    return this.fetch(`/multichain/history/${chain}/${address}?limit=${limit}`);
  }

  /**
   * Get gas price estimate
   */
  async getGasPrice(chain) {
    return this.fetch(`/multichain/gas-price/${chain}`);
  }

  /**
   * Get blockchain stats
   */
  async getStats() {
    return this.fetch('/blockchain/stats');
  }

  /**
   * Get recent blocks
   */
  async getRecentBlocks(limit = 10) {
    return this.fetch(`/blockchain/blocks?limit=${limit}`);
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit = 10) {
    return this.fetch(`/blockchain/transactions?limit=${limit}`);
  }

  /**
   * Get token info
   */
  async getTokenInfo(chain = 'ethereum') {
    return this.fetch(`/tokens/info?chain=${chain}`);
  }

  /**
   * WebSocket connection for real-time updates
   */
  connectWebSocket(onMessage) {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Subscribe to channels
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: 'blockchain'
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connectWebSocket(onMessage), 5000);
    };

    return ws;
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(chain, from, to, value) {
    try {
      const gasPrice = await this.getGasPrice(chain);
      const gasLimit = 21000; // Standard gas limit for simple transfers

      if (chain === 'solana') {
        // Solana uses lamports, typical fee is ~5000 lamports
        return {
          gasPrice: 0.000005,
          gasLimit: 1,
          totalFee: 0.000005,
          currency: 'SOL'
        };
      } else {
        // EVM chains
        const totalFee = (gasPrice.gasPrice * gasLimit) / 1e18;
        return {
          gasPrice: gasPrice.gasPrice,
          gasLimit,
          totalFee,
          currency: chain === 'ethereum' ? 'ETH' : chain.toUpperCase()
        };
      }
    } catch (error) {
      console.error('Error estimating fee:', error);
      // Return default estimate
      return {
        gasPrice: 0,
        gasLimit: 21000,
        totalFee: 0.001,
        currency: 'ETH'
      };
    }
  }
}

export default new ApiService();
