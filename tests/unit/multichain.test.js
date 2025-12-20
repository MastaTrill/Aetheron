// Unit tests for multi-chain integration
const { MultiChainIntegration, CHAIN_CONFIGS } = require('../../multichain');

describe('MultiChain Integration', () => {
  let multichain;

  beforeEach(() => {
    multichain = new MultiChainIntegration('ethereum');
  });

  describe('Chain Configuration', () => {
    test('should initialize with default chain', () => {
      expect(multichain.currentChain).toBe('ethereum');
    });

    test('should get chain config', () => {
      const config = multichain.getChainConfig('ethereum');
      expect(config.chainId).toBe(1);
      expect(config.name).toBe('Ethereum Mainnet');
      expect(config.tokenAddress).toBeTruthy();
    });

    test('should switch chains', () => {
      const config = multichain.switchChain('polygon');
      expect(multichain.currentChain).toBe('polygon');
      expect(config.chainId).toBe(137);
    });

    test('should throw error for invalid chain', () => {
      expect(() => multichain.switchChain('invalid')).toThrow();
    });

    test('should get all supported chains', () => {
      const chains = multichain.getSupportedChains();
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains.some((c) => c.name === 'ethereum')).toBe(true);
    });
  });

  describe('Address Utilities', () => {
    test('should get token address for chain', () => {
      const address = multichain.getTokenAddress('base');
      expect(address).toBe('0x8A3ad49656Bd07981C9CFc7aD826a808847c3452');
    });

    test('should get NFT address for chain', () => {
      const address = multichain.getNftAddress('polygon');
      expect(address).toBe('0x8A3ad49656Bd07981C9CFc7aD826a808847c3452');
    });

    test('should generate explorer URL for transaction', () => {
      const txHash = '0x123abc';
      const url = multichain.getExplorerUrl(txHash, 'ethereum');
      expect(url).toContain('etherscan.io');
      expect(url).toContain(txHash);
    });

    test('should generate explorer URL for address', () => {
      const address = '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452';
      const url = multichain.getAddressUrl(address, 'polygon');
      expect(url).toContain('polygonscan.com');
      expect(url).toContain(address);
    });

    test('should handle Solana explorer URLs differently', () => {
      const txHash = 'abc123';
      const url = multichain.getExplorerUrl(txHash, 'solana');
      expect(url).toContain('solscan.io/tx/');
    });
  });

  describe('Chain Type Detection', () => {
    test('should identify EVM chains', () => {
      expect(multichain.isEVMChain('ethereum')).toBe(true);
      expect(multichain.isEVMChain('base')).toBe(true);
      expect(multichain.isEVMChain('polygon')).toBe(true);
    });

    test('should identify non-EVM chains', () => {
      expect(multichain.isEVMChain('solana')).toBe(false);
    });
  });

  describe('Configuration Constants', () => {
    test('should have correct Ethereum config', () => {
      const eth = CHAIN_CONFIGS.ethereum;
      expect(eth.chainId).toBe(1);
      expect(eth.nativeCurrency.symbol).toBe('ETH');
      expect(eth.explorerUrl).toContain('etherscan.io');
    });

    test('should have correct Base config', () => {
      const base = CHAIN_CONFIGS.base;
      expect(base.chainId).toBe(8453);
      expect(base.nativeCurrency.symbol).toBe('ETH');
      expect(base.explorerUrl).toContain('basescan.org');
    });

    test('should have correct Polygon config', () => {
      const polygon = CHAIN_CONFIGS.polygon;
      expect(polygon.chainId).toBe(137);
      expect(polygon.nativeCurrency.symbol).toBe('MATIC');
      expect(polygon.explorerUrl).toContain('polygonscan.com');
    });

    test('should have correct Solana config', () => {
      const solana = CHAIN_CONFIGS.solana;
      expect(solana.name).toBe('Solana Mainnet');
      expect(solana.tokenAddress).toBeTruthy();
      expect(solana.explorerUrl).toContain('solscan.io');
    });

    test('all chains should have token addresses', () => {
      Object.values(CHAIN_CONFIGS).forEach((config) => {
        expect(config.tokenAddress).toBeTruthy();
      });
    });
  });
});
