# Aetheron Multi-Chain Deployment Guide

## Supported Networks

Aetheron is deployed across multiple blockchain networks for maximum accessibility and interoperability.

### EVM-Compatible Networks

#### Ethereum Mainnet

- **Network:** Ethereum
- **Chain ID:** 1
- **Token Address:** `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- **NFT Address:** `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- **Explorer:** https://etherscan.io
- **RPC:** `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

#### Base Network

- **Network:** Base
- **Chain ID:** 8453
- **Token Address:** `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- **NFT Address:** `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- **Explorer:** https://basescan.org
- **RPC:** `https://mainnet.base.org`

#### Polygon (Matic)

- **Network:** Polygon
- **Chain ID:** 137
- **Token Address:** `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- **NFT Address:** `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- **Explorer:** https://polygonscan.com
- **RPC:** `https://polygon-rpc.com`

### Non-EVM Networks

#### Solana

- **Network:** Solana Mainnet Beta
- **Token Address:** `5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki`
- **Explorer:** https://solscan.io
- **RPC:** `https://api.mainnet-beta.solana.com`

## API Endpoints

### Multi-Chain Balance Queries

```bash
# Get native balance (ETH, MATIC, SOL)
GET /multichain/balance/:chain/:address

# Get AETH token balance
GET /multichain/token-balance/:chain/:address

# Get current block number
GET /multichain/block-number/:chain

# Get chain configuration
GET /multichain/config/:chain

# List all supported chains
GET /multichain/chains
```

### Examples

```bash
# Ethereum balance
curl http://localhost:3000/multichain/balance/ethereum/0x8A3ad49656Bd07981C9CFc7aD826a808847c3452

# Base AETH token balance
curl http://localhost:3000/multichain/token-balance/base/0x8A3ad49656Bd07981C9CFc7aD826a808847c3452

# Polygon block number
curl http://localhost:3000/multichain/block-number/polygon

# Solana balance
curl http://localhost:3000/multichain/balance/solana/5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki
```

## Adding Aetheron to MetaMask

### Ethereum Mainnet

1. Network already included in MetaMask
2. Add token contract: `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`

### Base Network

1. Click "Add Network" in MetaMask
2. Enter:
   - Network Name: `Base`
   - RPC URL: `https://mainnet.base.org`
   - Chain ID: `8453`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://basescan.org`
3. Add token contract: `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`

### Polygon

1. Click "Add Network" in MetaMask
2. Enter:
   - Network Name: `Polygon Mainnet`
   - RPC URL: `https://polygon-rpc.com`
   - Chain ID: `137`
   - Currency Symbol: `MATIC`
   - Block Explorer: `https://polygonscan.com`
3. Add token contract: `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`

## Solana Wallet Setup

### Phantom Wallet

1. Install Phantom browser extension
2. Create or import wallet
3. Network: Mainnet
4. Add custom token: `5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki`

### Solflare Wallet

1. Install Solflare
2. Import/create wallet
3. Add token by address: `5fryQ4UPbZWKix8J3jtQhNTDXtSsoX24vyDQ8gQbFqki`

## Cross-Chain Bridge (Coming Soon)

Aetheron will support bridging AETH tokens between:

- Ethereum ↔ Base
- Ethereum ↔ Polygon
- Polygon ↔ Base
- EVM Chains ↔ Solana (via Wormhole)

## Development & Testing

For development, use testnets:

- **Base Sepolia:** Chain ID 84532
- **Polygon Mumbai:** Chain ID 80001
- **Solana Devnet:** `https://api.devnet.solana.com`

## Configuration Files

- `chain-config.json` - Network configurations
- `multichain.js` - Multi-chain integration module
- `solana.js` - Solana-specific integration
- `tokens.js` - Smart contract code with addresses

## Support

For issues or questions:

- GitHub: https://github.com/MastaTrill/Aetheron
- Documentation: Check README.md
