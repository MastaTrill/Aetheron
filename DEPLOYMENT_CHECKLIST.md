# Aetheron Production Deployment Checklist

## Pre-Deployment

### 1. Environment Variables
Update `.env` file with production values:
```bash
# Required
NODE_ENV=production
JWT_SECRET=<generate-secure-random-string>
ADMIN_USERNAME=<strong-username>
ADMIN_PASSWORD=<very-secure-password>
OPENAI_API_KEY=<your-key>

# Database (PostgreSQL recommended for production)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=aetheron
DB_USER=postgres
DB_PASSWORD=<db-password>

# Optional: Redis for caching (improves performance)
REDIS_URL=redis://...
```

### 2. Generate Secure Secrets
```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate database password
openssl rand -base64 32
```

### 3. Database Setup
```bash
# If using PostgreSQL
createdb aetheron

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 4. Test Everything
```bash
# Run all tests
npm test

# Run specifically integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

### 5. Build & Lint
```bash
npm run build
```

## Deployment Options

### Railway
```bash
npm run deploy:railway
```

### Vercel
```bash
npm run deploy:vercel
```

### Docker
```bash
npm run deploy:docker
```

### Manual
```bash
npm install --production
node server.js
```

## Post-Deployment

- [ ] Verify health endpoint: `GET /health`
- [ ] Check WebSocket connection
- [ ] Test AI assistant: `POST /api/ai/query`
- [ ] Test Oracle: `GET /api/oracle/price/ETH`
- [ ] Monitor logs for errors

## Security Checklist

- [ ] All secrets in `.env` (not committed to git)
- [ ] Rate limiting enabled
- [ ] CORS configured for production domains
- [ ] Helmet.js security headers enabled
- [ ] HSTS enabled in production
- [ ] Input sanitization active
- [ ] Admin credentials changed from defaults
