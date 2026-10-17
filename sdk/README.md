# @aetheron/sdk

Official TypeScript and JavaScript SDK for interacting with the Aetheron Protocol, node APIs, and smart contracts.

## Installation

```bash
npm install @aetheron/sdk
```

## Quick Start

```typescript
import { AetheronSDK } from '@aetheron/sdk';

const sdk = new AetheronSDK({
  apiUrl: 'http://localhost:3001',
  wsUrl: 'ws://localhost:3001'
});

// Check health
const health = await sdk.healthCheck();
console.log('Node status:', health);

// Get latest block
const blockchain = await sdk.getBlockchain();
console.log('Blockchain height:', blockchain.length);

// Check address balance
const balance = await sdk.getBalance('0x1234567890abcdef1234567890abcdef12345678');
console.log('Balance:', balance);
```

## Real-time Events (WebSocket)

```typescript
await sdk.connect();

// Subscribe to new blocks
sdk.subscribe('blocks');
sdk.on('block', (block) => {
  console.log('New block mined:', block.index);
});
```

## Features

- **Blockchain**: Query blocks, hashes, balances, and network parameters.
- **Transactions & Wallets**: Create wallets, sign and broadcast transactions.
- **DeFi & NFTs**: Native liquidity, token swaps, staking, and ERC-721 glyphs.
- **Governance**: Submit and vote on DAO proposals.
- **Real-time streaming**: Built-in reconnection and WebSocket channel dispatching.
