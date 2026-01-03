# Aetheron Blockchain Platform

## Overview

Aetheron is a modular, full-featured blockchain platform with a futuristic admin dashboard, 3D AI hologram assistant, and extensible modules (DEX, DAO, NFT, Social, Reputation, Carbon, Education, DeFi, Gaming, Crowdfunding, and more).

## 🌐 Live Demo

**GitHub Pages:** [https://mastatrill.github.io/Aetheron/](https://mastatrill.github.io/Aetheron/)

**Available Pages:**
- 🎛️ [Admin Dashboard](https://mastatrill.github.io/Aetheron/admin-dashboard.html) - Full admin panel with 3D AI assistant
- 📊 [Analytics Dashboard](https://mastatrill.github.io/Aetheron/analytics-dashboard.html) - Real-time metrics & charts
- 🔍 [Block Explorer](https://mastatrill.github.io/Aetheron/explorer.html) - Browse blockchain data
- ✨ [Features Demo](https://mastatrill.github.io/Aetheron/DEMO.html) - Interactive showcase
- 💼 [Browser Wallet](https://mastatrill.github.io/Aetheron/browser-extension/popup.html) - Wallet interface

## Token Information

**Aetheron Token (AETH)** - Multi-Chain Support

### Local Development (Hardhat)
- **AetheronToken (ERC-20)**: Deployed locally - see `deployments/hardhat.json`
- **AetheronGlyphs (ERC-721)**: Deployed locally - see `deployments/hardhat.json`

### Testnet Deployments (After Setup)
- **Sepolia (Ethereum Testnet)**: `npx hardhat run scripts/deploy.js --network sepolia`
- **Polygon Amoy**: `npx hardhat run scripts/deploy.js --network polygonAmoy`
- **Base Sepolia**: `npx hardhat run scripts/deploy.js --network baseSepolia`

### Mainnet Deployments (After Setup)
- **Ethereum Mainnet**: [To be deployed]
- **Base**: [To be deployed]
- **Polygon**: [To be deployed]
- **Solana**: [To be deployed]

## Deployment Instructions

### Prerequisites
1. **Get API Keys**:
   - [Alchemy API Key](https://www.alchemy.com/) for Ethereum RPC
   - [Infura Project ID](https://www.infura.io/) for Polygon RPC
   - [Etherscan API Key](https://etherscan.io/) for contract verification

2. **Fund Testnet Wallet**:
   - Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
   - Get testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/)

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and private key
   ```

## Deployment Guide

### Prerequisites

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Get API Keys**:
   - [Alchemy API Key](https://www.alchemy.com/) for Ethereum RPC
   - [Infura Project ID](https://www.infura.io/) for Polygon RPC
   - [Etherscan API Key](https://etherscan.io/) for contract verification
   - [Polygonscan API Key](https://polygonscan.com/) for Polygon verification
   - [Basescan API Key](https://basescan.org/) for Base verification

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and private key
   ```

4. **Fund Your Wallet** (for testnet deployments):
   - **Sepolia**: Get ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
   - **Polygon Amoy**: Get MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
   - **Base Sepolia**: Get ETH from [Base Sepolia Faucet](https://sepoliafaucet.com/)

### Local Development Deployment

```bash
# Deploy to local Hardhat network
npx hardhat run scripts/deploy.js --network hardhat
```

### Testnet Deployments

```bash
# Deploy to Sepolia (Ethereum testnet)
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to Polygon Amoy
npx hardhat run scripts/deploy.js --network polygonAmoy

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Contract Verification

After deployment, verify your contracts on block explorers:

```bash
# Verify on Etherscan (Sepolia)
npx hardhat verify --network sepolia <TOKEN_ADDRESS> "1000000000000000000000000"
npx hardhat verify --network sepolia <NFT_ADDRESS>

# Verify on Polygonscan (Amoy)
npx hardhat verify --network polygonAmoy <TOKEN_ADDRESS> "1000000000000000000000000"
npx hardhat verify --network polygonAmoy <NFT_ADDRESS>

# Verify on Basescan (Sepolia)
npx hardhat verify --network baseSepolia <TOKEN_ADDRESS> "1000000000000000000000000"
npx hardhat verify --network baseSepolia <NFT_ADDRESS>
```

### Mainnet Deployment (⚠️ Use with Caution)

**IMPORTANT**: Mainnet deployments cost real money and cannot be undone. Triple-check your code and test thoroughly on testnets first.

```bash
# Deploy to Ethereum Mainnet
npx hardhat run scripts/deploy.js --network ethereum

# Deploy to Polygon Mainnet
npx hardhat run scripts/deploy.js --network polygon

# Deploy to Base Mainnet
npx hardhat run scripts/deploy.js --network base
```

### Deployment Artifacts

After successful deployment, check:
- `deployments/[network].json` - Contains deployment details
- Contract addresses will be logged to console
- Update `chain-config.json` with actual deployed addresses

### Troubleshooting

- **"Invalid account" error**: Check your `.env` file has the correct private key format (64 characters, no 0x prefix)
- **"Insufficient funds"**: Make sure your wallet has enough native tokens for gas
- **"Network connection failed"**: Verify your RPC URLs and API keys
- **Verification failed**: Ensure constructor arguments match exactly what was used during deployment

**Token Details:**

- Symbol: AETH
- Decimals: 18 (EVM), 9 (Solana)
- Type: ERC-20 compliant (EVM chains), SPL Token (Solana)

**Aetheron Glyphs (AGLYPH)** - NFT Collection

**Local Hardhat Network (Development):**
- AetheronGlyphs (ERC-721): `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

**EVM Networks:**
- Ethereum: [To be deployed]
- Base: [To be deployed]
- Polygon: [To be deployed]

## Features

### Core Infrastructure

- **Multi-Chain Support:** Ethereum, Base, Polygon, and Solana
- **Mobile Wallet App:** React Native mobile wallet with QR scanning and biometric auth
- **Real-time WebSocket:** Live blockchain updates, notifications, and chat
- **Layer 2 Scaling:** State channels, optimistic rollups, cross-chain bridge, batch processing
- **Testing & DevOps:** Jest tests, Docker, CI/CD pipeline, E2E tests with Playwright

### Advanced Features (New!)

- **Account Abstraction (ERC-4337):** Smart contract wallets, social recovery, gasless transactions, session keys
- **Zero-Knowledge Privacy:** ZK-SNARKs, private transactions, shielded pools, anonymous voting
- **Advanced Interoperability:** Cross-chain messaging, universal bridge, atomic swaps, liquidity aggregation
- **Fiat Gateway:** Stripe, Moonpay, Ramp Network integration with KYC/AML compliance

### Enterprise & Production Features

- **Monitoring & Observability:** Prometheus metrics, health checks, alerting, performance tracking
- **API Documentation:** OpenAPI/Swagger auto-generated docs, interactive API explorer
- **Rate Limiting:** Tier-based API limits, usage analytics, monetization ready
- **Notifications:** Email (SendGrid), SMS (Twilio), push notifications, template system
- **Social Authentication:** Google, Twitter, Discord, GitHub OAuth integration
- **Progressive Web App:** Offline support, background sync, installable on mobile/desktop
- **GraphQL Subscriptions:** Real-time updates for blocks, transactions, prices, proposals
- **Browser Extension:** Chrome/Firefox wallet with Web3 provider (window.ethereum)

### Developer & Ops Tools

- **CLI Tool:** Command-line interface for wallet, transactions, contracts, and monitoring
- **AI Assistant:** Natural language blockchain queries, transaction analysis, recommendation engine
- **Decentralized Storage:** IPFS, Arweave, Filecoin integration for NFT metadata and files
- **Gaming SDK:** Unity/Unreal integration, tournaments, leaderboards, in-game assets
- **Security Automation:** Contract fuzzing, penetration testing, vulnerability scanning
- **Backup & Recovery:** Automated snapshots, point-in-time recovery, cloud backup (S3/Azure/GCS)
- **Multi-Region Deployment:** Docker configs for US-East, US-West, EU, Asia-Pacific with load balancing
- **Analytics Dashboard:** Real-time metrics, charts, funnels, cohort analysis

### Institutional Features

- **Custody Solutions:** Multi-sig vaults, institutional-grade security, audit trails
- **OTC Trading:** Large order execution, price negotiation, settlement
- **Treasury Management:** Portfolio tracking, yield optimization, risk management
- **Compliance & Reporting:** AML/KYC, transaction monitoring, regulatory reporting

### Blockchain & DeFi

- **Advanced DeFi:** Yield farming, flash loans, insurance protocol, derivatives market
- **DEX & AMM:** Liquidity pools, token swaps, automated market maker optimization
- **Staking & Rewards:** Flexible staking with lockup periods and reward distribution
- **DAO Governance:** Proposal creation, voting, and execution with timelock

### Security & Analytics

- **Enhanced Security:** Multi-sig wallets, 2FA, rate limiting, audit logging, security scanner
- **AI/ML Integration:** Fraud detection, price prediction, AMM optimization, vulnerability scanning
- **Advanced Analytics:** Transaction graphs, gas predictions, network health monitoring, risk scoring

### Developer Tools

- **SDK:** Comprehensive JavaScript SDK for easy integration (sdk.js)
- **GraphQL API:** Flexible querying for blocks, transactions, and addresses (graphql-schema.js)
- **Smart Contract Templates:** Pre-built ERC-20, ERC-721, DAO, DEX, and staking contracts (contract-templates.js)
- **Webhooks:** Event-driven notifications with automatic retry and signature verification (webhooks.js)
- **Documentation:** Auto-generated API docs and code examples

### Social & Community

- **Social Network:** User profiles, posts, comments, likes, following system (social.js)
- **Creator Tokens:** Bonding curve based social tokens for content creators
- **Reputation System:** Points, badges, and influencer ranking
- **Feed & Discovery:** Personalized feed, trending posts, user search
- **NFT Profiles:** Customizable NFT avatars and profile badges

## Architecture

**Project Structure:**

```
Aetheron/
├── Core Blockchain
│   ├── blockchain.js          - PoS/PoW blockchain implementation
│   ├── smartcontract.js       - Smart contract execution
│   ├── tokens.js              - ERC-20/ERC-721 contracts
│   └── encryption.js          - Cryptographic utilities
├── Layer 2 Scaling
│   ├── layer2.js              - State channels, rollups, bridge
│   └── persistence.js         - Data persistence layer
├── DeFi Modules
│   ├── defi.js                - Basic DEX and staking
│   ├── defi-advanced.js       - Yield farming, flash loans, insurance
│   ├── dex.js                 - AMM implementation
│   └── tokens.js              - Token standards
├── Advanced Features
│   ├── account-abstraction.js - ERC-4337 smart accounts, gasless tx
│   ├── zk-privacy.js          - Zero-knowledge privacy layer
│   ├── interoperability.js    - Cross-chain bridges and swaps
│   └── fiat-gateway.js        - Fiat on/off-ramp providers
├── Security & Analytics
│   ├── security.js            - Multi-sig, 2FA, rate limiting
│   ├── analytics.js           - Network metrics, gas predictions
│   └── ai-ml.js               - Fraud detection, price prediction
├── Social & DAO
│   ├── social.js              - Social network, creator tokens
│   ├── dao.js                 - Governance and voting
│   └── reputation.js          - Reputation system
├── Developer Tools
│   ├── sdk.js                 - JavaScript SDK
│   ├── graphql-schema.js      - GraphQL API
│   ├── webhooks.js            - Event notifications
│   └── contract-templates.js  - Smart contract templates
├── Frontend & API
│   ├── admin-dashboard.html   - Admin UI with 3D AI
│   ├── server.js              - Express + WebSocket server
│   ├── api.js                 - REST API endpoints
│   └── websocket.js           - Real-time communication
├── Multi-Chain Support
│   ├── multichain.js          - Cross-chain integration
│   ├── solana.js              - Solana integration
│   └── chain-config.json      - Network configurations
└── Testing & DevOps
    ├── tests/                 - Jest tests
    ├── Dockerfile             - Container configuration
    ├── docker-compose.yml     - Multi-service setup
    └── .github/workflows/     - CI/CD pipelines
```

## Setup

### Backend Server

1. Install Node.js (v18+ recommended)
2. Run `npm install`
3. Start the backend: `npm start`
4. Open `admin-dashboard.html` in your browser

### Mobile Wallet App

The Aetheron mobile wallet is a React Native app built with Expo.

1. Navigate to mobile directory: `cd mobile`
2. Install dependencies: `npm install`
3. Start Expo: `npm start`
4. Run on iOS/Android simulator or scan QR with Expo Go app

For detailed mobile setup instructions, see [mobile/INSTALL.md](mobile/INSTALL.md).

**Mobile App Features:**

- Multi-chain wallet (Ethereum, Base, Polygon, Solana)
- Biometric authentication (Face ID/Touch ID/Fingerprint)
- QR code scanning for addresses
- Send and receive transactions
- Transaction history
- Secure key storage
- Real-time balance updates

## Multi-Chain Documentation

For detailed information about multi-chain support, network configurations, and wallet setup, see [MULTICHAIN.md](MULTICHAIN.md).

### Quick Multi-Chain API Examples

```bash
# Get all supported chains
curl http://localhost:3000/multichain/chains

# Check Ethereum balance
curl http://localhost:3000/multichain/balance/ethereum/0x8A3ad49656Bd07981C9CFc7aD826a808847c3452

# Check AETH token balance on Base
curl http://localhost:3000/multichain/token-balance/base/0x8A3ad49656Bd07981C9CFc7aD826a808847c3452

# Get Polygon block number
curl http://localhost:3000/multichain/block-number/polygon
```

## End-to-End Testing

- Manual: Use the dashboard UI and API endpoints to test all modules.
- Automated: Integrate with tools like Cypress or Playwright for E2E browser tests.

### Example Cypress Test

```js
// cypress/integration/login.spec.js
it('logs in as admin', () => {
  cy.visit('http://localhost:3000/admin-dashboard.html');
  cy.get('input[name=user]').type('MastaTrill');
  cy.get('input[name=pass]').type('abc123AetheronIsM3');
  cy.get('button[type=submit]').click();
  cy.contains('Aetheron Admin Dashboard');
});
```

## Contributing

- Fork the repo, create a branch, and submit pull requests.
- See `SECURITY.md` for security guidelines.

##

MIT
