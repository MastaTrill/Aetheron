# Aetheron SDK Documentation

## Installation

```bash
npm install aetheron-sdk
```

Or use the standalone SDK file:

```html
<script src="sdk.js"></script>
```

## Quick Start

### Initialize SDK

```javascript
const { AetheronSDK } = require('aetheron-sdk');

const sdk = new AetheronSDK({
  apiUrl: 'http://localhost:3001',
  wsUrl: 'ws://localhost:3001',
  apiKey: 'your-api-key' // Optional
});
```

### Connect to WebSocket

```javascript
await sdk.connect();

// Subscribe to blockchain events
sdk.subscribe('blockchain');

// Listen for new blocks
sdk.on('newBlock', (message) => {
  console.log('New block:', message.block);
});

// Listen for new transactions
sdk.on('newTransaction', (message) => {
  console.log('New transaction:', message.transaction);
});
```

## Blockchain Operations

### Get Blockchain Data

```javascript
// Get entire blockchain
const blockchain = await sdk.getBlockchain();

// Get specific block
const block = await sdk.getBlock(5);

// Get transaction by hash
const tx = await sdk.getTransaction('0xabc123...');

// Get address balance
const balance = await sdk.getBalance('0x123...');
```

### Create Transaction

```javascript
const tx = await sdk.createTransaction(
  '0xSenderAddress',
  '0xReceiverAddress',
  100, // amount
  'privateKey'
);
```

### Mine Block

```javascript
const block = await sdk.mineBlock('0xMinerAddress');
```

## Wallet Management

### Create Wallet

```javascript
const wallet = await sdk.createWallet('password123');
// Returns: { address, publicKey, privateKey (encrypted) }
```

### Import Wallet

```javascript
const wallet = await sdk.importWallet('privateKey', 'password123');
```

### Export Wallet

```javascript
const exported = await sdk.exportWallet('0xAddress', 'password123');
```

## Multi-Chain Operations

### Get Supported Chains

```javascript
const chains = await sdk.getSupportedChains();
// Returns: [{ name: 'ethereum', chainId: 1, ... }, ...]
```

### Check Balance on Different Chains

```javascript
// Ethereum balance
const ethBalance = await sdk.getChainBalance('ethereum', '0x123...');

// Solana balance
const solBalance = await sdk.getChainBalance('solana', '5fry...');

// Token balance
const tokenBalance = await sdk.getTokenBalance(
  'base',
  '0x123...', // wallet address
  '0x8A3...' // token address
);
```

### Get Chain Configuration

```javascript
const config = await sdk.getChainConfig('polygon');
// Returns: { chainId, rpcUrl, explorerUrl, tokenAddress, ... }
```

## Smart Contracts

### Deploy Contract

```javascript
const contract = await sdk.deployContract(
  contractCode,
  contractABI,
  '0xDeployerAddress',
  [arg1, arg2] // Constructor arguments
);
```

### Call Contract Method

```javascript
const result = await sdk.callContract(
  '0xContractAddress',
  'methodName',
  [arg1, arg2],
  '0xCallerAddress'
);
```

### Get Contract Events

```javascript
const events = await sdk.getContractEvents('0xContractAddress', 'Transfer');
```

## NFT Operations

### Mint NFT

```javascript
const nft = await sdk.mintNFT('0xRecipientAddress', 'tokenId123', {
  name: 'My NFT',
  description: 'Cool NFT',
  image: 'ipfs://...'
});
```

### Transfer NFT

```javascript
await sdk.transferNFT('0xFromAddress', '0xToAddress', 'tokenId123', 'privateKey');
```

### Get NFT Details

```javascript
const nft = await sdk.getNFT('tokenId123');
```

### Get User's NFTs

```javascript
const nfts = await sdk.getNFTsByOwner('0xOwnerAddress');
```

## DeFi Operations

### Token Swap

```javascript
const swap = await sdk.swap(
  'AETH', // Token in
  'USDC', // Token out
  1000, // Amount in
  0.5 // Max slippage (%)
);
```

### Add Liquidity

```javascript
const liquidity = await sdk.addLiquidity(
  'AETH', // Token A
  'USDC', // Token B
  1000, // Amount A
  2000 // Amount B
);
```

### Remove Liquidity

```javascript
const removed = await sdk.removeLiquidity(
  'pool-id-123',
  500 // LP token amount
);
```

### Stake Tokens

```javascript
const stake = await sdk.stake(
  1000, // amount
  30 // duration in days
);
```

### Unstake Tokens

```javascript
await sdk.unstake('stake-id-123');
```

## DAO & Governance

### Create Proposal

```javascript
const proposal = await sdk.createProposal(
  'Proposal Title',
  'Detailed description of the proposal',
  ['Option A', 'Option B', 'Option C']
);
```

### Vote on Proposal

```javascript
await sdk.vote('proposal-id-123', 'Option A');
```

### Get Proposal Details

```javascript
const proposal = await sdk.getProposal('proposal-id-123');
```

### Get Active Proposals

```javascript
const proposals = await sdk.getActiveProposals();
```

## Utility Methods

### Health Check

```javascript
const health = await sdk.healthCheck();
// Returns: { healthy: true/false, version, timestamp }
```

### Get Network Stats

```javascript
const stats = await sdk.getNetworkStats();
```

### Get Current Gas Price

```javascript
const gasPrice = await sdk.getGasPrice();
```

### Check WebSocket Connection

```javascript
const connected = sdk.isConnected();
```

### Disconnect

```javascript
sdk.disconnect();
```

## Event Types

The SDK emits the following events via WebSocket:

- `connected` - Connected to WebSocket
- `newBlock` - New block mined
- `newTransaction` - New transaction created
- `newLog` - New system log
- `userUpdate` - User data updated
- `alert` - System alert
- `pong` - Response to ping

## Error Handling

```javascript
try {
  const tx = await sdk.createTransaction(...);
} catch (error) {
  console.error('Transaction failed:', error.message);
}
```

## Complete Example

```javascript
const { AetheronSDK } = require('aetheron-sdk');

async function main() {
  // Initialize SDK
  const sdk = new AetheronSDK({
    apiUrl: 'http://localhost:3001',
    wsUrl: 'ws://localhost:3001'
  });

  // Connect to WebSocket
  await sdk.connect();
  sdk.subscribe('blockchain');

  // Create wallet
  const wallet = await sdk.createWallet('secure-password');
  console.log('Wallet created:', wallet.address);

  // Check balance
  const balance = await sdk.getBalance(wallet.address);
  console.log('Balance:', balance);

  // Listen for transactions
  sdk.on('newTransaction', (msg) => {
    console.log('New transaction:', msg.transaction);
  });

  // Create transaction
  const tx = await sdk.createTransaction(wallet.address, '0xRecipient...', 100, wallet.privateKey);
  console.log('Transaction created:', tx.hash);

  // Multi-chain balance check
  const ethBalance = await sdk.getChainBalance('ethereum', wallet.address);
  console.log('Ethereum balance:', ethBalance);

  // Keep connection alive
  process.on('SIGINT', () => {
    sdk.disconnect();
    process.exit();
  });
}

main().catch(console.error);
```

## Browser Usage

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Aetheron SDK Example</title>
    <script src="sdk.js"></script>
  </head>
  <body>
    <button onclick="connectWallet()">Connect Wallet</button>
    <div id="balance"></div>

    <script>
      const sdk = new AetheronSDK({
        apiUrl: 'http://localhost:3001',
        wsUrl: 'ws://localhost:3001'
      });

      async function connectWallet() {
        await sdk.connect();

        const wallet = await sdk.createWallet('password');
        const balance = await sdk.getBalance(wallet.address);

        document.getElementById('balance').textContent = `Balance: ${balance} AETH`;
      }

      sdk.on('newBlock', (msg) => {
        console.log('New block mined:', msg.block);
      });
    </script>
  </body>
</html>
```

## TypeScript Support

```typescript
import { AetheronSDK } from 'aetheron-sdk';

interface Wallet {
  address: string;
  publicKey: string;
  privateKey: string;
}

const sdk = new AetheronSDK({
  apiUrl: 'http://localhost:3001'
});

const wallet: Wallet = await sdk.createWallet('password');
```

## Support

For issues and questions:

- GitHub: https://github.com/MastaTrill/Aetheron
- Documentation: https://aetheron.dev/docs
- Discord: https://discord.gg/aetheron
