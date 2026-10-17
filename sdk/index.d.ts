export interface AetheronSDKConfig {
  apiUrl?: string;
  wsUrl?: string;
  apiKey?: string;
}

export interface TransactionPayload {
  from: string;
  to: string;
  amount: number | string;
  privateKey: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  version?: string;
  error?: string;
  timestamp: number;
}

export class AetheronSDK {
  constructor(config?: AetheronSDKConfig);

  apiUrl: string;
  wsUrl: string;
  apiKey?: string;
  version: string;

  // Blockchain Operations
  getBlockchain(): Promise<any>;
  getBlock(index: number | string): Promise<any>;
  getTransaction(hash: string): Promise<any>;
  createTransaction(from: string, to: string, amount: number | string, privateKey: string): Promise<any>;
  mineBlock(minerAddress: string): Promise<any>;
  getBalance(address: string): Promise<any>;

  // Wallet Operations
  createWallet(password?: string): Promise<any>;
  importWallet(privateKey: string, password?: string): Promise<any>;
  exportWallet(address: string, password?: string): Promise<any>;

  // Multi-Chain Operations
  getSupportedChains(): Promise<string[]>;
  getChainBalance(chain: string, address: string): Promise<any>;
  getTokenBalance(chain: string, address: string, tokenAddress: string): Promise<any>;
  getChainConfig(chain: string): Promise<any>;

  // Smart Contract Operations
  deployContract(code: string, abi: any[], from: string, args?: any[]): Promise<any>;
  callContract(contractAddress: string, method: string, args?: any[], from?: string): Promise<any>;
  getContractEvents(contractAddress: string, eventName: string): Promise<any>;

  // NFT Operations
  mintNFT(to: string, tokenId: number | string, metadata: any): Promise<any>;
  transferNFT(from: string, to: string, tokenId: number | string, privateKey: string): Promise<any>;
  getNFT(tokenId: number | string): Promise<any>;
  getNFTsByOwner(owner: string): Promise<any[]>;

  // DeFi Operations
  swap(tokenIn: string, tokenOut: string, amountIn: number | string, slippage?: number): Promise<any>;
  addLiquidity(tokenA: string, tokenB: string, amountA: number | string, amountB: number | string): Promise<any>;
  removeLiquidity(poolId: string, shares: number | string): Promise<any>;
  stake(amount: number | string, duration: number): Promise<any>;
  unstake(stakeId: string): Promise<any>;

  // DAO Operations
  createProposal(title: string, description: string, options: string[]): Promise<any>;
  vote(proposalId: string, option: string | number): Promise<any>;
  getProposal(proposalId: string): Promise<any>;
  getActiveProposals(): Promise<any[]>;

  // WebSocket Operations
  connect(): Promise<void>;
  disconnect(): void;
  reconnect(): void;
  subscribe(channel: string): void;
  unsubscribe(channel: string): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  isConnected(): boolean;

  // Utility Methods
  request(method: string, path: string, data?: any): Promise<any>;
  healthCheck(): Promise<HealthCheckResult>;
  getNetworkStats(): Promise<any>;
  getGasPrice(): Promise<any>;
}

export default AetheronSDK;
