# Aetheron Quick Start Guide

Get up and running with Aetheron in under 5 minutes!

## Prerequisites

- Node.js v18+ ([Download](https://nodejs.org/))
- npm or yarn
- Git

## Installation

```bash
# Clone the repository
git clone https://github.com/MastaTrill/Aetheron.git
cd Aetheron

# Install dependencies
npm install --legacy-peer-deps

# Start the backend server
npm start
```

The server will start on `http://localhost:3001`

## Quick Access

### 🌐 Admin Dashboard

Open `admin-dashboard.html` in your browser for the full admin interface.

### 📱 Mobile App

```bash
cd mobile
npm install
npm start
```

Scan the QR code with Expo Go app.

### 🔍 Block Explorer

Open `explorer.html` to browse the blockchain.

### 💻 CLI Tool

```bash
# Create a wallet
npm run cli -- wallet create

# Check balance
npm run cli -- wallet balance 0x123...

# Send transaction
npm run cli -- tx send --to 0x456... --amount 10
```

## Common Tasks

### Create a Transaction

```bash
curl -X POST http://localhost:3001/api/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "0x123...",
    "receiver": "0x456...",
    "amount": 100
  }'
```

### Check Balance

```bash
curl http://localhost:3001/api/balance/0x123...
```

### Mine a Block

```bash
curl -X POST http://localhost:3001/api/mine \
  -H "Content-Type: application/json" \
  -d '{"miner": "0x123..."}'
```

### Multi-Chain Operations

```bash
# Get supported chains
curl http://localhost:3001/multichain/chains

# Check Ethereum balance
curl http://localhost:3001/multichain/balance/ethereum/0x123...

# Get Polygon block number
curl http://localhost:3001/multichain/block-number/polygon
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode
npm run test:watch
```

## GraphQL API

Access GraphQL playground at `http://localhost:3001/graphql`

### Sample Queries

```graphql
# Get latest block
query {
  latestBlock {
    index
    hash
    timestamp
    transactions {
      hash
      amount
    }
  }
}

# Subscribe to new blocks
subscription {
  newBlock {
    index
    hash
    miner
  }
}
```

## Docker Deployment

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
npm run docker:compose
```

## Production Deployment

```bash
# Deploy to all regions
npm run deploy:all

# Deploy to specific region
npm run deploy:us-east
npm run deploy:eu
```

## Security

### Create Admin Password

```bash
node set-admin-password.js
```

### Enable 2FA

Access admin dashboard → Security Settings → Enable 2FA

### Run Security Scan

```bash
npm run security:scan
```

## Backup & Recovery

```bash
# Create backup
npm run backup

# Restore from backup
npm run restore
```

## Monitoring

### Metrics

- Prometheus: `http://localhost:3001/metrics`
- Health Check: `http://localhost:3001/health`

### Analytics Dashboard

Open `analytics-dashboard.html` for real-time analytics.

## Browser Extension

1. Open Chrome/Firefox
2. Go to Extensions page
3. Enable Developer Mode
4. Load unpacked: `browser-extension/` folder
5. Pin the Aetheron icon to toolbar

## API Documentation

- **OpenAPI/Swagger**: `http://localhost:3001/api-docs`
- **GraphQL Playground**: `http://localhost:3001/graphql`
- **Full API Docs**: See [API_DOCS.md](API_DOCS.md)

## Need Help?

- 📚 Documentation: [README.md](README.md)
- 🔐 Security: [SECURITY.md](SECURITY.md)
- 🚀 Deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🌍 Multi-Chain: [MULTICHAIN.md](MULTICHAIN.md)
- 📱 Mobile: [mobile/INSTALL.md](mobile/INSTALL.md)
- 🎮 Gaming: [gaming-sdk.js](gaming-sdk.js)
- 🤖 AI Assistant: [ai-assistant.js](ai-assistant.js)

## Troubleshooting

### Port Already in Use

```bash
# Change port in server.js or use environment variable
PORT=3002 npm start
```

### Dependency Conflicts

```bash
# Use legacy peer deps
npm install --legacy-peer-deps
```

### GraphQL Errors

Make sure `graphql-subscriptions` is installed:

```bash
npm install graphql-subscriptions --legacy-peer-deps
```

## Next Steps

1. ✅ Explore the admin dashboard
2. ✅ Create your first wallet
3. ✅ Send a test transaction
4. ✅ Deploy a smart contract
5. ✅ Set up monitoring
6. ✅ Enable notifications
7. ✅ Try the mobile app
8. ✅ Install browser extension

Welcome to Aetheron! 🚀
