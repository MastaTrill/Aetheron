# Aetheron CLI

Command-line interface for Aetheron blockchain development and operations.

## Installation

```bash
npm install -g @aetheron/cli
```

Or from source:

```bash
cd cli
npm install
npm link
```

## Usage

### Configuration

```bash
# Show current config
aetheron config --show

# Set API URL
aetheron config --url https://api.aetheron.network
```

### Wallet Management

```bash
# Create new wallet
aetheron wallet create --name "My Wallet"

# List wallets
aetheron wallet list

# Check balance
aetheron wallet balance 0x123...
```

### Transactions

```bash
# Send AETH
aetheron tx send \
  --from 0xYourAddress \
  --to 0xRecipientAddress \
  --amount 10 \
  --key yourPrivateKey

# Get transaction
aetheron tx get 0xTransactionHash
```

### Blockchain

```bash
# Get blockchain info
aetheron chain info

# Get latest block
aetheron chain latest
```

### Smart Contracts

```bash
# Deploy contract
aetheron contract deploy MyContract.sol --args '[1, 2, 3]'

# Call contract method
aetheron contract call 0xContractAddress myMethod --args '["arg1", "arg2"]'
```

### NFT Operations

```bash
# Mint NFT
aetheron nft mint --to 0xAddress --metadata ipfs://...

# List NFT for sale
aetheron nft list <tokenId> --price 100
```

### DAO Operations

```bash
# Create proposal
aetheron dao propose \
  --title "Increase mining reward" \
  --description "Proposal to increase mining reward to 100 AETH"

# Vote on proposal
aetheron dao vote <proposalId> yes
```

### Development

```bash
# Initialize new project
aetheron dev init my-project

# Run tests
aetheron dev test
```

## Commands

| Command    | Description               |
| ---------- | ------------------------- |
| `config`   | Configure CLI settings    |
| `wallet`   | Wallet management         |
| `tx`       | Transaction operations    |
| `chain`    | Blockchain operations     |
| `contract` | Smart contract operations |
| `nft`      | NFT operations            |
| `dao`      | DAO operations            |
| `dev`      | Development utilities     |

## Examples

### Create and fund wallet

```bash
# Create wallet
aetheron wallet create --name "Trading Wallet"

# Check balance
aetheron wallet balance 0xYourNewAddress
```

### Deploy and interact with contract

```bash
# Deploy
aetheron contract deploy contracts/Token.sol

# Call method
aetheron contract call 0xContractAddress transfer \
  --args '["0xRecipient", 1000]'
```

### Complete NFT workflow

```bash
# Mint
aetheron nft mint --to 0xYourAddress --metadata ipfs://QmHash

# List for sale
aetheron nft list 1 --price 50

# Transfer
aetheron nft transfer 1 --to 0xNewOwner
```

## Configuration File

Config stored at `~/.aetheron/config.json`:

```json
{
  "apiUrl": "https://api.aetheron.network",
  "wallets": [
    {
      "name": "My Wallet",
      "address": "0x...",
      "privateKey": "...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

## Security

⚠️ **Important Security Notes:**

- Never share your private keys
- Config file contains sensitive data - keep it secure
- Use environment variables for CI/CD: `AETHERON_PRIVATE_KEY`
- Consider using hardware wallets for production

## Development

```bash
# Install dependencies
npm install

# Link for local development
npm link

# Run locally
node aetheron-cli.js wallet list
```

## License

MIT
