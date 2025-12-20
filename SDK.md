# Aetheron SDK Documentation

## Installation

```bash
npm install aetheron-sdk
```

## Quick Start

```javascript
const { AetheronSDK } = require('aetheron-sdk');

// Initialize
const sdk = new AetheronSDK({
  apiUrl: 'http://localhost:3001',
  apiKey: 'your-api-key'
});

// Connect WebSocket
await sdk.connect();

// Make API calls
const balance = await sdk.getBalance('0x...');
```

## API Reference

### Constructor

```javascript
new AetheronSDK(config);
```

**Parameters:**

- `config.apiUrl` (string): Base URL for API endpoints
- `config.wsUrl` (string): WebSocket URL (optional, defaults to apiUrl)
- `config.apiKey` (string): API authentication key (optional)

### Blockchain Methods

#### getBlockchain()

Get the entire blockchain.

```javascript
const blockchain = await sdk.getBlockchain();
```

#### getBlock(index)

Get a specific block by index.

```javascript
const block = await sdk.getBlock(10);
```

#### getTransaction(hash)

Get transaction details by hash.

```javascript
const tx = await sdk.getTransaction('0xabc...');
```

#### createTransaction(from, to, amount, privateKey)

Create and sign a new transaction.

```javascript
const tx = await sdk.createTransaction('0xSender...', '0xReceiver...', 100, 'private-key');
```

#### mineBlock(minerAddress)

Mine a new block.

```javascript
const block = await sdk.mineBlock('0xMiner...');
```

#### getBalance(address)

Get address balance.

```javascript
const balance = await sdk.getBalance('0x...');
```

### Wallet Methods

#### createWallet(password)

Create a new encrypted wallet.

```javascript
const wallet = await sdk.createWallet('password123');
// Returns: { address, publicKey, encryptedPrivateKey }
```

#### importWallet(privateKey, password)

Import existing wallet.

```javascript
const wallet = await sdk.importWallet('private-key', 'password123');
```

#### exportWallet(address, password)

Export wallet private key.

```javascript
const exported = await sdk.exportWallet('0x...', 'password123');
```

### Multi-Chain Methods

#### getSupportedChains()

List all supported blockchain networks.

```javascript
const chains = await sdk.getSupportedChains();
// Returns: [{ name, chainId, ... }, ...]
```

#### getChainBalance(chain, address)

Get balance on specific chain.

```javascript
const balance = await sdk.getChainBalance('ethereum', '0x...');
```

#### getTokenBalance(chain, address, tokenAddress)

Get token balance on specific chain.

```javascript
const balance = await sdk.getTokenBalance('polygon', '0xUserAddress...', '0xTokenAddress...');
```

#### getChainConfig(chain)

Get network configuration.

```javascript
const config = await sdk.getChainConfig('base');
```

### Smart Contract Methods

#### deployContract(code, abi, from, args)

Deploy a smart contract.

```javascript
const deployment = await sdk.deployContract(contractCode, contractABI, '0xDeployer...', [
  'arg1',
  'arg2'
]);
```

#### callContract(contractAddress, method, args, from)

Call contract method.

```javascript
const result = await sdk.callContract('0xContract...', 'transfer', ['0xTo...', 100], '0xFrom...');
```

#### getContractEvents(contractAddress, eventName)

Get contract events.

```javascript
const events = await sdk.getContractEvents('0xContract...', 'Transfer');
```

### NFT Methods

#### mintNFT(to, tokenId, metadata)

Mint a new NFT.

```javascript
const nft = await sdk.mintNFT('0xOwner...', '1', { name: 'NFT #1', image: 'ipfs://...' });
```

#### transferNFT(from, to, tokenId, privateKey)

Transfer NFT ownership.

```javascript
const result = await sdk.transferNFT('0xFrom...', '0xTo...', '1', 'private-key');
```

#### getNFT(tokenId)

Get NFT details.

```javascript
const nft = await sdk.getNFT('1');
```

#### getNFTsByOwner(owner)

Get all NFTs owned by address.

```javascript
const nfts = await sdk.getNFTsByOwner('0x...');
```

### DeFi Methods

#### swap(tokenIn, tokenOut, amountIn, slippage)

Execute token swap.

```javascript
const result = await sdk.swap(
  'AETH',
  'USDC',
  100,
  0.5 // 0.5% slippage
);
```

#### addLiquidity(tokenA, tokenB, amountA, amountB)

Add liquidity to pool.

```javascript
const result = await sdk.addLiquidity('AETH', 'USDC', 1000, 5000);
```

#### removeLiquidity(poolId, shares)

Remove liquidity from pool.

```javascript
const result = await sdk.removeLiquidity('pool-id', 100);
```

#### stake(amount, duration)

Stake tokens.

```javascript
const stake = await sdk.stake(
  1000,
  2592000000 // 30 days
);
```

#### unstake(stakeId)

Unstake tokens.

```javascript
const result = await sdk.unstake('stake-id');
```

### DAO Methods

#### createProposal(title, description, options)

Create governance proposal.

```javascript
const proposal = await sdk.createProposal(
  'Increase rewards',
  'Proposal to increase staking rewards by 10%',
  ['Yes', 'No', 'Abstain']
);
```

#### vote(proposalId, option)

Vote on proposal.

```javascript
const result = await sdk.vote('proposal-id', 'Yes');
```

#### getProposal(proposalId)

Get proposal details.

```javascript
const proposal = await sdk.getProposal('proposal-id');
```

#### getActiveProposals()

Get all active proposals.

```javascript
const proposals = await sdk.getActiveProposals();
```

### WebSocket Methods

#### connect()

Connect to WebSocket server.

```javascript
await sdk.connect();
```

#### disconnect()

Disconnect from WebSocket.

```javascript
sdk.disconnect();
```

#### subscribe(channel)

Subscribe to event channel.

```javascript
sdk.subscribe('blockchain');
sdk.subscribe('transactions');
sdk.subscribe('logs');
```

#### unsubscribe(channel)

Unsubscribe from channel.

```javascript
sdk.unsubscribe('blockchain');
```

#### on(event, handler)

Listen for events.

```javascript
sdk.on('newBlock', (data) => {
  console.log('New block:', data.block);
});

sdk.on('newTransaction', (data) => {
  console.log('New transaction:', data.transaction);
});

sdk.on('*', (message) => {
  console.log('Any message:', message);
});
```

#### off(event, handler)

Remove event listener.

```javascript
const handler = (data) => console.log(data);
sdk.on('newBlock', handler);
sdk.off('newBlock', handler);
```

### Utility Methods

#### healthCheck()

Check API health.

```javascript
const health = await sdk.healthCheck();
// Returns: { healthy, version, timestamp }
```

#### getNetworkStats()

Get network statistics.

```javascript
const stats = await sdk.getNetworkStats();
```

#### getGasPrice()

Get current gas price.

```javascript
const gasPrice = await sdk.getGasPrice();
```

#### isConnected()

Check WebSocket connection status.

```javascript
const connected = sdk.isConnected();
```

## Event Types

### Blockchain Events

- `newBlock` - New block mined
- `newTransaction` - New transaction added
- `blockchainUpdate` - Chain state updated

### Transaction Events

- `transactionConfirmed` - Transaction confirmed
- `transactionFailed` - Transaction failed

### System Events

- `connected` - WebSocket connected
- `disconnected` - WebSocket disconnected
- `systemAlert` - System alert message

## Error Handling

```javascript
try {
  const tx = await sdk.createTransaction(from, to, amount, key);
} catch (error) {
  console.error('Transaction failed:', error.message);
}
```

## Examples

### Complete Transaction Flow

```javascript
// Initialize SDK
const sdk = new AetheronSDK({
  apiUrl: 'http://localhost:3001'
});

// Create wallet
const wallet = await sdk.createWallet('password123');
console.log('Wallet created:', wallet.address);

// Check balance
const balance = await sdk.getBalance(wallet.address);
console.log('Balance:', balance);

// Create transaction
const tx = await sdk.createTransaction(wallet.address, '0xRecipient...', 100, wallet.privateKey);
console.log('Transaction created:', tx.hash);

// Mine block
const block = await sdk.mineBlock(wallet.address);
console.log('Block mined:', block.index);
```

### WebSocket Monitoring

```javascript
// Connect and subscribe
await sdk.connect();
sdk.subscribe('blockchain');
sdk.subscribe('transactions');

// Listen for events
sdk.on('newBlock', (data) => {
  console.log(`Block #${data.block.index} mined by ${data.block.miner}`);
});

sdk.on('newTransaction', (data) => {
  console.log(
    `${data.transaction.sender} → ${data.transaction.receiver}: ${data.transaction.amount} AETH`
  );
});

// Keep connection alive
sdk.on('disconnected', () => {
  console.log('Reconnecting...');
  sdk.connect();
});
```

### Multi-Chain Integration

```javascript
// Get supported chains
const chains = await sdk.getSupportedChains();
console.log('Supported chains:', chains);

// Check balance on multiple chains
for (const chain of chains) {
  const balance = await sdk.getChainBalance(chain.name, userAddress);
  console.log(`${chain.name}: ${balance} ${chain.nativeCurrency.symbol}`);
}

// Get token balance
const aeth = await sdk.getTokenBalance(
  'polygon',
  userAddress,
  '0x8A3ad49656Bd07981C9CFc7aD826a808847c3452'
);
console.log('AETH on Polygon:', aeth);
```

---

**Version:** 1.0.0  
**License:** MIT  
**Support:** https://github.com/MastaTrill/Aetheron
