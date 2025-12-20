# API Documentation

Base URL: `http://localhost:3001`

## Authentication

Some endpoints require Basic Authentication:

```
Authorization: Basic base64(username:password)
```

## Blockchain Endpoints

### GET /api

Get API status

```bash
curl http://localhost:3001/api
```

Response:

```json
{
  "status": "online",
  "version": "1.0.0",
  "timestamp": 1703001234567
}
```

### GET /api/blockchain

Get entire blockchain

```bash
curl http://localhost:3001/api/blockchain
```

### GET /api/block/:index

Get specific block

```bash
curl http://localhost:3001/api/block/5
```

### GET /api/transaction/:hash

Get transaction by hash

```bash
curl http://localhost:3001/api/transaction/0xabc123...
```

### POST /api/transaction

Create new transaction

```bash
curl -X POST http://localhost:3001/api/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0xSender...",
    "to": "0xReceiver...",
    "amount": 100,
    "privateKey": "key..."
  }'
```

### POST /api/mine

Mine a new block

```bash
curl -X POST http://localhost:3001/api/mine \
  -H "Content-Type: application/json" \
  -d '{"minerAddress": "0xMiner..."}'
```

### GET /api/balance/:address

Get address balance

```bash
curl http://localhost:3001/api/balance/0x123...
```

## Multi-Chain Endpoints

### GET /multichain/chains

List all supported chains

```bash
curl http://localhost:3001/multichain/chains
```

### GET /multichain/balance/:chain/:address

Get balance on specific chain

```bash
curl http://localhost:3001/multichain/balance/ethereum/0x123...
curl http://localhost:3001/multichain/balance/solana/5fry...
```

### POST /multichain/token-balance

Get token balance

```bash
curl -X POST http://localhost:3001/multichain/token-balance \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "base",
    "address": "0x123...",
    "tokenAddress": "0x8A3..."
  }'
```

### GET /multichain/block-number/:chain

Get current block number

```bash
curl http://localhost:3001/multichain/block-number/polygon
```

### GET /multichain/config/:chain

Get chain configuration

```bash
curl http://localhost:3001/multichain/config/ethereum
```

## User Management (Auth Required)

### GET /users

List all users

```bash
curl -u admin:admin123 http://localhost:3001/users
```

### POST /users/add

Add new user

```bash
curl -X POST -u admin:admin123 \
  http://localhost:3001/users/add \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xNew...",
    "balance": "1000 AETH"
  }'
```

### POST /users/role

Update user role

```bash
curl -X POST -u admin:admin123 \
  http://localhost:3001/users/role \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x123...",
    "role": "admin"
  }'
```

## Statistics (Auth Required)

### GET /stats

Get network statistics

```bash
curl -u admin:admin123 http://localhost:3001/stats
```

Response:

```json
{
  "totalUsers": 150,
  "totalTransactions": 5432,
  "websocketConnections": 12,
  "uptime": "5d 3h 22m"
}
```

## Logs

### GET /logs (Auth Required)

Get system logs

```bash
curl -u admin:admin123 http://localhost:3001/logs
```

### POST /api/logs

Submit log entry

```bash
curl -X POST http://localhost:3001/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "time": "2025-12-18T10:30:00Z",
    "type": "INFO",
    "details": {"message": "User logged in"}
  }'
```

## GraphQL API

### POST /graphql

Execute GraphQL queries

```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ block(index: 5) { hash timestamp transactions { sender receiver amount } } }"
  }'
```

Example queries:

**Get Latest Block:**

```graphql
{
  latestBlock {
    index
    hash
    timestamp
    miner
    transactionCount
  }
}
```

**Get Address Info:**

```graphql
{
  address(address: "0x123...") {
    address
    balance
    transactionCount
    firstSeen
    lastActivity
  }
}
```

**Get Chain Info:**

```graphql
{
  chainInfo {
    name
    chainId
    blockHeight
    totalTransactions
    networkHealth
  }
}
```

**Create Transaction (Mutation):**

```graphql
mutation {
  createTransaction(from: "0xSender...", to: "0xReceiver...", amount: 100, privateKey: "key...") {
    hash
    sender
    receiver
    amount
    timestamp
  }
}
```

## Webhooks

### POST /webhooks/register

Register a webhook

```bash
curl -X POST http://localhost:3001/webhooks/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhook",
    "events": ["block.mined", "transaction.created"],
    "secret": "your-secret-key"
  }'
```

### POST /webhooks/unregister

Unregister webhook

```bash
curl -X POST http://localhost:3001/webhooks/unregister \
  -H "Content-Type: application/json" \
  -d '{"id": "webhook-id"}'
```

### GET /webhooks/list

List all webhooks

```bash
curl http://localhost:3001/webhooks/list
```

### POST /webhooks/test

Test webhook

```bash
curl -X POST http://localhost:3001/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"id": "webhook-id"}'
```

## WebSocket API

Connect to: `ws://localhost:3001`

### Subscribe to Channel

```json
{
  "type": "subscribe",
  "channel": "blockchain"
}
```

Available channels:

- `blockchain` - Block and transaction events
- `logs` - System logs
- `users` - User updates
- `chat` - Chat messages

### Ping

```json
{
  "type": "ping"
}
```

### Events Received

**New Block:**

```json
{
  "type": "newBlock",
  "block": {
    "index": 123,
    "hash": "0xabc...",
    "timestamp": 1703001234567,
    "transactions": []
  }
}
```

**New Transaction:**

```json
{
  "type": "newTransaction",
  "transaction": {
    "hash": "0xdef...",
    "sender": "0x123...",
    "receiver": "0x456...",
    "amount": 100
  }
}
```

## Rate Limits

- API calls: 100 requests per minute per IP
- WebSocket connections: 10 per IP
- Webhook retries: 3 attempts with exponential backoff

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": 1703001234567
}
```

Common error codes:

- `UNAUTHORIZED` - Authentication required
- `NOT_FOUND` - Resource not found
- `INVALID_REQUEST` - Malformed request
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
