# 🚀 Aetheron Production Deployment Guide

This guide covers deploying Aetheron to production environments.

## Prerequisites

### System Requirements
- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Git

### API Keys & Services
Get these API keys before deployment:

1. **Blockchain APIs**:
   - [Alchemy API Key](https://www.alchemy.com/) - Ethereum mainnet RPC
   - [Infura Project ID](https://www.infura.io/) - Polygon mainnet RPC
   - [Etherscan API Key](https://etherscan.io/) - Contract verification
   - [Polygonscan API Key](https://polygonscan.com/)
   - [Basescan API Key](https://basescan.org/)

2. **Payment & Fiat Gateways**:
   - [Stripe API Keys](https://stripe.com/) - Payment processing
   - [Moonpay API Key](https://www.moonpay.com/) - Fiat on-ramp
   - [Ramp API Key](https://ramp.network/) - Alternative fiat gateway

3. **Notifications**:
   - [SendGrid API Key](https://sendgrid.com/) - Email notifications
   - [Twilio Credentials](https://www.twilio.com/) - SMS notifications

4. **Monitoring**:
   - [Sentry DSN](https://sentry.io/) - Error tracking (optional)

## Environment Setup

1. **Copy environment template**:
   ```bash
   cp .env.production.example .env.production
   ```

2. **Fill in your API keys and secrets** in `.env.production`

3. **Set up deployment wallet**:
   - Create a new Ethereum wallet for contract deployment
   - Fund it with sufficient ETH/MATIC for gas fees
   - Export the private key (64 characters, no 0x prefix)

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides easy deployment with built-in PostgreSQL and Redis.

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   railway login
   railway deploy
   ```

3. **Set environment variables** in Railway dashboard

### Option 2: Vercel

For serverless deployment:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option 3: Docker

For full control over infrastructure:

1. **Build and run**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Or use the deployment script**:
   ```bash
   ./deploy.sh docker
   ```

## Pre-Deployment Checks

Run comprehensive checks before deploying:

```bash
./deploy.sh check
```

This will:
- Validate environment variables
- Run linting and tests
- Check for security vulnerabilities
- Verify Node.js version

## Mainnet Contract Deployment

⚠️ **CRITICAL**: Mainnet deployment costs real money!

1. **Test on testnets first**:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   npx hardhat run scripts/deploy.js --network polygonAmoy
   ```

2. **Deploy to mainnet** (when ready):
   ```bash
   npx hardhat run scripts/deploy.js --network ethereum
   npx hardhat run scripts/deploy.js --network polygon
   npx hardhat run scripts/deploy.js --network base
   ```

3. **Verify contracts**:
   ```bash
   npx hardhat verify --network ethereum <TOKEN_ADDRESS> "1000000000000000000000000"
   npx hardhat verify --network ethereum <NFT_ADDRESS>
   ```

## Post-Deployment

### 1. Update Frontend
- Update `chain-config.json` with deployed contract addresses
- Deploy frontend to GitHub Pages, Vercel, or Netlify

### 2. Set Up Monitoring
- Configure Prometheus metrics endpoint
- Set up health checks
- Enable error tracking with Sentry

### 3. Database Setup
- Run database migrations:
  ```bash
  npm run db:migrate
  ```
- Seed initial data:
  ```bash
  npm run db:seed
  ```

### 4. SSL & Security
- Configure SSL certificates
- Set up firewall rules
- Enable rate limiting

### 5. Backup Configuration
- Set up automated database backups
- Configure log rotation
- Set up monitoring alerts

## Monitoring & Maintenance

### Health Checks
- Application: `GET /api/health`
- Database: `GET /api/health/db`
- Blockchain: `GET /api/health/blockchain`

### Logs
- Application logs: Check deployment platform logs
- Database logs: Check PostgreSQL container logs
- Error tracking: Monitor Sentry dashboard

### Scaling
- Monitor resource usage
- Scale horizontally with load balancer
- Set up auto-scaling rules

## Troubleshooting

### Common Issues

**Database connection fails**:
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check network connectivity

**Contract deployment fails**:
- Verify sufficient gas funds
- Check RPC endpoint status
- Validate private key format

**Application won't start**:
- Check environment variables
- Verify dependencies are installed
- Check port availability

**Health checks fail**:
- Wait for services to fully start (can take 30-60 seconds)
- Check service dependencies
- Verify network configuration

### Rollback Strategy
1. Keep previous deployment version available
2. Have database backup ready
3. Monitor error rates post-deployment
4. Be prepared to rollback within first hour

## Security Checklist

- [ ] All secrets are in environment variables, not code
- [ ] Private keys are for deployment wallet only
- [ ] Database credentials are strong and unique
- [ ] SSL/TLS is enabled
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] Input validation is enabled
- [ ] Dependencies are up to date and audited
- [ ] Firewall rules are in place
- [ ] Backup strategy is implemented

## Support

For deployment issues:
1. Check this guide and troubleshooting section
2. Review application logs
3. Check GitHub Issues for similar problems
4. Contact the development team

---

🎉 **Congratulations on your production deployment!**

Monitor your application closely in the first 24-48 hours and be prepared to address any issues that arise.