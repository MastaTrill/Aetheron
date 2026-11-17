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

export interface SentinelHealthStatus {
  systemHealthy: boolean;
  killSwitchActive: boolean;
  activePolicyPack: string | null;
  chainId: number;
  error?: string;
  timestamp: number;
}

export interface SentinelRiskInput {
  amount: number;
  available_liquidity: number;
  velocity_1h: number;
  velocity_24h: number;
  anomaly_score: number;
  signer_quorum_ratio: number;
  chain_health_score?: number;
  oracle_deviation?: number;
  counterparty_risk?: number;
  bridge_id?: string;
  chain_id?: string;
  asset_symbol?: string;
  actor_id?: string;
  event_id?: string;
}

export interface SentinelDecision {
  action: 'ALLOW' | 'THROTTLE' | 'BLOCK';
  risk_score: number;
  reasons: string[];
  controls: string[];
  escalate: boolean;
}

export interface L3RelayMessageStatus {
  messageHash: string;
  sender: string;
  payload: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'FAILED' | 'RETRYING';
  submittedAt: number;
  acknowledgedAt: number;
  retryCount: number;
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

  // Sentinel L3 & Bridge Guardrail Operations
  getSentinelHealth(): Promise<SentinelHealthStatus>;
  getSentinelNodeStatus(nodeAddress: string): Promise<any>;
  reportSentinelAnomaly(anomalyHash: string, description: string): Promise<any>;
  evaluateBridgeRisk(riskInput: SentinelRiskInput): Promise<SentinelDecision>;
  submitL3RelayMessage(payload: string): Promise<any>;
  getL3RelayMessageStatus(messageHash: string): Promise<L3RelayMessageStatus>;

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
