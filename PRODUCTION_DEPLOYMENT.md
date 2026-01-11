# Aetheron Production Deployment Guide

## Prerequisites

Before deploying to production, ensure you have:

1. **API Keys Configured**:

   - MoonPay API key and secret
   - Stripe publishable and secret keys
   - Transak API key and secret
   - Alchemy/Infura RPC endpoints
   - Biconomy bundler and paymaster keys (for Account Abstraction)
   - SendGrid API key (for emails)
   - MongoDB connection string
   - Redis connection URL

2. **Environment Setup**:

   - Copy `.env.example` to `.env`
   - Fill in all required API keys and secrets
   - Never commit `.env` to version control

3. **SSL Certificates** (for HTTPS):
   - Obtain SSL certificates for your domain
   - Place them in the `ssl/` directory
   - Update `nginx.conf` with certificate paths

## Deployment Options

### Option 1: Railway.app (Recommended for Quick Deploy)

1. **Install Railway CLI**:

   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:

   ```bash
   railway login
   ```

3. **Initialize Project**:

   ```bash
   railway init
   ```

4. **Set Environment Variables**:

   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   railway variables set MONGODB_URI=your-mongodb-uri
   railway variables set MOONPAY_API_KEY=your-key
   railway variables set STRIPE_API_KEY=your-key
   # ... set all other variables from .env.example
   ```

5. **Deploy**:

   ```bash
   railway up
   ```

6. **Add Plugins** (from Railway dashboard):
   - MongoDB (if not using external)
   - Redis
   - Configure automatic deployments from GitHub

### Option 2: Docker Compose (Self-Hosted)

1. **Ensure Docker and Docker Compose are installed**:

   ```bash
   docker --version
   docker-compose --version
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Build and start services**:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Check status**:

   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs -f app
   ```

5. **Access application**:
   - HTTP: http://your-server-ip
   - HTTPS: https://your-domain.com (after SSL setup)

### Option 3: Manual Deployment (VPS/Cloud)

1. **SSH into your server**:

   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js**:

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone repository**:

   ```bash
   git clone https://github.com/your-username/aetheron.git
   cd aetheron
   ```

4. **Install dependencies**:

   ```bash
   npm ci --production
   ```

5. **Configure environment**:

   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

6. **Install PM2 for process management**:

   ```bash
   npm install -g pm2
   pm2 start server.js --name aetheron
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx reverse proxy**:
   ```bash
   sudo apt-get install nginx
   sudo cp nginx.conf /etc/nginx/sites-available/aetheron
   sudo ln -s /etc/nginx/sites-available/aetheron /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Post-Deployment Checklist

### 1. Verify Health Endpoint

```bash
curl http://your-domain/health
# Should return: {"status": "healthy"}
```

### 2. Test New Features

#### Account Abstraction

```bash
curl -X POST http://your-domain/api/aa/create-account \
  -H "Content-Type: application/json" \
  -d '{"socialProvider":"google","socialId":"test@example.com","owner":"0x..."}'
```

#### Fiat On-Ramp

```bash
curl -X POST http://your-domain/api/fiat/quote \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"USD","cryptoCurrency":"ETH"}'
```

#### Limit Orders

```bash
curl -X POST http://your-domain/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{"type":"limit","tokenPair":"ETH/USDC","amount":"1.0","price":"2000"}'
```

#### RWA Tokenization

```bash
curl -X POST http://your-domain/api/rwa/tokenize \
  -H "Content-Type: application/json" \
  -d '{"assetType":"carbon-credit","quantity":100,"price":50}'
```

#### L2 Integration

```bash
curl -X POST http://your-domain/api/l2/deposit \
  -H "Content-Type: application/json" \
  -d '{"network":"zkSync","amount":"0.1","token":"ETH"}'
```

### 3. Monitor Logs

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml logs -f app

# PM2
pm2 logs aetheron

# Railway
railway logs
```

### 4. Set Up Monitoring

#### Add Sentry for Error Tracking

```bash
npm install @sentry/node
# Configure in server.js
```

#### Add Datadog for Performance Monitoring

```bash
npm install dd-trace
# Configure in server.js
```

### 5. Configure Webhooks

#### MoonPay Webhook

- URL: `https://your-domain/api/fiat/webhook/moonpay`
- Configure in MoonPay dashboard

#### Stripe Webhook

- URL: `https://your-domain/api/fiat/webhook/stripe`
- Configure in Stripe dashboard
- Add webhook secret to environment variables

## Security Best Practices

1. **API Keys**:

   - Never commit `.env` file
   - Use environment variables in Railway/Docker
   - Rotate keys regularly
   - Use different keys for development/production

2. **HTTPS**:

   - Always use SSL certificates in production
   - Enable HSTS headers
   - Redirect HTTP to HTTPS

3. **Rate Limiting**:

   - Nginx configured with rate limits (see nginx.conf)
   - API endpoints limited to 10 req/s
   - General endpoints limited to 50 req/s

4. **CORS**:

   - Configure allowed origins in environment
   - Don't use wildcard (\*) in production

5. **Database Security**:
   - Use strong MongoDB passwords
   - Enable authentication
   - Use connection strings with TLS
   - Regular backups

## Scaling Considerations

### Horizontal Scaling

- Deploy multiple app instances
- Use Redis for session sharing
- Configure load balancer (Railway/AWS ELB)

### Database Scaling

- MongoDB Atlas auto-scaling
- Read replicas for heavy read operations
- Sharding for large datasets

### Caching

- Redis for frequently accessed data
- CDN for static assets
- API response caching

## Backup Strategy

### Database Backups

```bash
# MongoDB backup
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)

# Automated daily backups (cron)
0 2 * * * /path/to/backup-script.sh
```

### Code Backups

- Use Git for version control
- Tag releases: `git tag v1.0.0`
- Keep production branch protected

## Rollback Procedure

### Railway

```bash
railway rollback
```

### Docker Compose

```bash
docker-compose -f docker-compose.prod.yml down
git checkout previous-tag
docker-compose -f docker-compose.prod.yml up -d --build
```

### PM2

```bash
pm2 stop aetheron
git checkout previous-tag
npm ci --production
pm2 restart aetheron
```

## Support and Troubleshooting

### Common Issues

1. **Port Already in Use**:

   ```bash
   # Find process using port 3001
   lsof -i :3001
   kill -9 <PID>
   ```

2. **MongoDB Connection Failed**:

   - Check connection string format
   - Verify network access (whitelist IP)
   - Check credentials

3. **WebSocket Connection Issues**:

   - Ensure Nginx WebSocket proxy is configured
   - Check firewall rules

4. **High Memory Usage**:
   - Increase Node.js memory limit: `--max-old-space-size=4096`
   - Monitor with `pm2 monit`

### Getting Help

- Documentation: https://github.com/your-repo/wiki
- Issues: https://github.com/your-repo/issues
- Email: support@aetheron.io

## Maintenance

### Regular Updates

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Run tests
npm test

# Restart application
pm2 restart aetheron
# or
docker-compose -f docker-compose.prod.yml restart app
```

### Security Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update Node.js
nvm install 20
nvm use 20
```

## Performance Optimization

1. **Enable compression**: Gzip enabled in nginx.conf
2. **CDN**: Use CloudFlare or AWS CloudFront for static assets
3. **Database indexes**: Create indexes for frequently queried fields
4. **Connection pooling**: Configure MongoDB connection pool
5. **Caching**: Implement Redis caching for API responses

## Compliance

### GDPR (for EU users)

- Implement data deletion endpoints
- Add cookie consent banner
- Privacy policy and terms of service

### Financial Regulations

- KYC/AML verification for RWA and security tokens
- Partner with compliance providers (Sumsub, Onfido)
- Regular compliance audits

---

**Deployment Complete! 🚀**

Your Aetheron platform is now live with:

- ✅ Account Abstraction (ERC-4337)
- ✅ Fiat On-Ramp (MoonPay/Stripe/Transak)
- ✅ Limit Orders (Advanced trading)
- ✅ RWA Tokenization (8 asset types)
- ✅ L2 Integration (zkSync/Arbitrum/Optimism/Base)

Monitor your application and happy deploying!
