// Aetheron Multi-Chain Integration
// Supports Ethereum, Base, Polygon, and Solana

const CHAIN_CONFIGS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    explorerUrl: 'https://etherscan.io',
    tokenAddress: '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452',
    nftAddress: '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    tokenAddress: '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452',
    nftAddress: '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    tokenAddress: '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452',
    nftAddress: '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },
  solana: {
    name: 'Solana Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    tokenAddress: '5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki'
  }
};

class MultiChainIntegration {
  constructor(defaultChain = 'ethereum') {
    this.currentChain = defaultChain;
    this.supportedChains = Object.keys(CHAIN_CONFIGS);
  }

  /**
   * Switch to a different blockchain network
   * @param {string} chainName - Name of the chain (ethereum, base, polygon, solana)
   */
  switchChain(chainName) {
    if (!this.supportedChains.includes(chainName)) {
      throw new Error(
        `Unsupported chain: ${chainName}. Supported: ${this.supportedChains.join(', ')}`
      );
    }
    this.currentChain = chainName;
    return this.getChainConfig();
  }

  /**
   * Get configuration for current chain
   */
  getChainConfig(chainName = this.currentChain) {
    return CHAIN_CONFIGS[chainName];
  }

  /**
   * Get token address for current or specified chain
   */
  getTokenAddress(chainName = this.currentChain) {
    return CHAIN_CONFIGS[chainName]?.tokenAddress;
  }

  /**
   * Get NFT contract address for current or specified chain
   */
  getNftAddress(chainName = this.currentChain) {
    return CHAIN_CONFIGS[chainName]?.nftAddress;
  }

  /**
   * Get block explorer URL for a transaction
   * @param {string} txHash - Transaction hash
   * @param {string} chainName - Chain name (optional)
   */
  getExplorerUrl(txHash, chainName = this.currentChain) {
    const config = CHAIN_CONFIGS[chainName];
    if (!config) return null;

    if (chainName === 'solana') {
      return `${config.explorerUrl}/tx/${txHash}`;
    }
    return `${config.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Get address explorer URL
   * @param {string} address - Wallet/contract address
   * @param {string} chainName - Chain name (optional)
   */
  getAddressUrl(address, chainName = this.currentChain) {
    const config = CHAIN_CONFIGS[chainName];
    if (!config) return null;

    if (chainName === 'solana') {
      return `${config.explorerUrl}/account/${address}`;
    }
    return `${config.explorerUrl}/address/${address}`;
  }

  /**
   * Fetch balance from EVM-compatible chains
   * @param {string} address - Wallet address
   * @param {string} chainName - Chain name (ethereum, base, polygon)
   */
  async getEVMBalance(address, chainName = this.currentChain) {
    if (chainName === 'solana') {
      throw new Error('Use SolanaIntegration for Solana balance queries');
    }

    const config = CHAIN_CONFIGS[chainName];
    try {
      const response = await fetch(config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        })
      });
      const data = await response.json();
      return data.result ? parseInt(data.result, 16) / 1e18 : 0;
    } catch (error) {
      console.error(`Error fetching balance on ${chainName}:`, error);
      throw error;
    }
  }

  /**
   * Get token balance on EVM chains
   * @param {string} walletAddress - User's wallet address
   * @param {string} chainName - Chain name
   */
  async getTokenBalance(walletAddress, chainName = this.currentChain) {
    if (chainName === 'solana') {
      throw new Error('Use SolanaIntegration for Solana token queries');
    }

    const config = CHAIN_CONFIGS[chainName];
    const tokenAddress = config.tokenAddress;

    // ERC-20 balanceOf function signature
    const balanceOfSignature = '0x70a08231';
    const paddedAddress = walletAddress.replace('0x', '').padStart(64, '0');
    const data = balanceOfSignature + paddedAddress;

    try {
      const response = await fetch(config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: tokenAddress,
              data: data
            },
            'latest'
          ]
        })
      });
      const result = await response.json();
      return result.result ? parseInt(result.result, 16) / 1e18 : 0;
    } catch (error) {
      console.error(`Error fetching token balance on ${chainName}:`, error);
      throw error;
    }
  }

  /**
   * Get current block number
   * @param {string} chainName - Chain name
   */
  async getBlockNumber(chainName = this.currentChain) {
    if (chainName === 'solana') {
      throw new Error('Use SolanaIntegration for Solana queries');
    }

    const config = CHAIN_CONFIGS[chainName];
    try {
      const response = await fetch(config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: []
        })
      });
      const data = await response.json();
      return data.result ? parseInt(data.result, 16) : 0;
    } catch (error) {
      console.error(`Error fetching block number on ${chainName}:`, error);
      throw error;
    }
  }

  /**
   * Get all supported chains
   */
  getSupportedChains() {
    return this.supportedChains.map((chain) => ({
      ...CHAIN_CONFIGS[chain],
      name: chain // Put name last so it doesn't get overwritten
    }));
  }

  /**
   * Check if a chain is EVM-compatible
   */
  isEVMChain(chainName = this.currentChain) {
    return chainName !== 'solana';
  }
}

module.exports = { MultiChainIntegration, CHAIN_CONFIGS };
