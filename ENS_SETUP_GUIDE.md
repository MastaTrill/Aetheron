# ENS Domain + IPFS/Web3 Hosting Setup for Aetheron

## 🌐 What is ENS?

**Ethereum Name Service (ENS)** converts crypto addresses into human-readable names:

- Instead of: `0x8A3ad49656Bd07981C9CFc7aD826a808847c3452`
- You get: `aetheron.eth`

Your site will be accessible at:

- **ENS Domain**: `https://aetheron.eth` (via ENS-enabled browsers)
- **IPFS Gateway**: `https://aetheron.eth.limo` or `https://aetheron.eth.link`
- **Traditional URL**: `https://aetheron.on.fleek.co`

---

## 💰 Cost & Requirements

### ENS Domain Registration:

- **1 year**: ~$5 USD (in ETH)
- **Longer = Cheaper**: $3/year for 5+ years
- **One-time gas fee**: ~$10-50 (depends on Ethereum gas prices)

### What You Need:

1. **MetaMask wallet** (or any Ethereum wallet)
2. **~$15-60 in ETH** (for domain + gas fees)
3. **GitHub account** (you have this ✅)

---

## 🚀 Step-by-Step Setup

### Step 1: Get an ENS Domain

1. **Install MetaMask**:

   - Go to: https://metamask.io/
   - Add to Chrome/Firefox
   - Create or import wallet
   - Add some ETH (buy on Coinbase/Binance)

2. **Register ENS Domain**:

   - Go to: https://app.ens.domains/
   - Connect MetaMask
   - Search for: `aetheron.eth`
   - If available, click "Request to Register"
   - Wait 1 minute, then click "Register"
   - Confirm transaction in MetaMask
   - Pay gas fee + domain cost

3. **Set as Primary Name** (Optional):
   - In ENS Manager, set "aetheron.eth" as your primary name

### Step 2: Deploy to IPFS via Fleek

1. **Sign up for Fleek**:

   - Go to: https://app.fleek.co/
   - Click "Sign Up" → Connect GitHub
   - Authorize Fleek

2. **Add New Site**:

   - Click "Add new site"
   - Select "Deploy with GitHub"
   - Choose your `Aetheron` repository
   - Configure:
     - **Framework**: None (static HTML)
     - **Build Command**: Leave empty
     - **Publish Directory**: `/`
   - Click "Deploy Site"

3. **Get IPFS Hash**:
   - After deployment, copy the IPFS CID/hash
   - Example: `QmXxxxx...`
   - Also note your Fleek URL: `https://aetheron.on.fleek.co`

### Step 3: Link ENS to IPFS

1. **Go to ENS Manager**:

   - Visit: https://app.ens.domains/
   - Click on your `aetheron.eth` domain

2. **Add Content Hash**:

   - Click "Add/Edit Record"
   - Select "Content Hash"
   - Paste your IPFS hash from Fleek
   - Format: `ipfs://QmXxxxxx...`
   - Click "Confirm" and pay gas fee

3. **Add Text Records** (Optional but recommended):
   - **url**: `https://aetheron.on.fleek.co`
   - **description**: `Multi-Chain Blockchain Platform`
   - **avatar**: Upload project logo
   - **com.github**: `MastaTrill/Aetheron`
   - **com.twitter**: Your Twitter handle
   - **email**: Contact email

### Step 4: Access Your Site

**Via ENS-Enabled Browsers:**

- Brave browser: `aetheron.eth`
- Opera: `aetheron.eth`
- MetaMask browser: `aetheron.eth`

**Via Traditional Browsers:**

- `https://aetheron.eth.link` (Cloudflare gateway)
- `https://aetheron.eth.limo` (IPFS gateway)
- `https://aetheron.on.fleek.co` (Fleek direct)

---

## 🎯 Alternative: Free Trial with ENS Subdomains

If you don't want to buy an ENS domain yet, you can use **free Web3 alternatives**:

### Option A: Use a Free ENS Subdomain

Some projects offer free subdomains:

- `aetheron.dao.eth` (if part of a DAO)
- `aetheron.web3.eth`
- Ask in Web3 communities for free subdomains

### Option B: Unstoppable Domains (Alternative to ENS)

- Domain: `aetheron.crypto` or `aetheron.blockchain`
- **Cost**: $10-40 one-time (NO renewal fees!)
- Site: https://unstoppabledomains.com/
- Same IPFS integration
- Works with Brave, Opera

### Option C: Just use IPFS for now (FREE)

Deploy to Fleek without ENS:

- URL: `https://aetheron.on.fleek.co`
- IPFS URL: `https://ipfs.fleek.co/ipfs/QmXxxx...`
- Add ENS later when ready

---

## 📋 Fleek Configuration (Already Created)

I've prepared your project for Fleek deployment. The files work as-is!

### What Fleek Will Deploy:

- ✅ All HTML pages
- ✅ CSS and JavaScript files
- ✅ Images and assets
- ✅ Browser extension files
- ✅ Auto-updates on every GitHub push

### Fleek Benefits:

- 🌐 IPFS hosting (decentralized)
- ⚡ Fast CDN
- 🔄 Auto-deploy from GitHub
- 🆓 Free forever
- 🔒 SSL included
- 📊 Analytics dashboard

---

## 🎨 Custom ENS Avatar/Logo

Add your project logo to ENS:

1. Create a 512x512 PNG logo
2. Upload to IPFS via Fleek
3. In ENS Manager:
   - Add record type: `avatar`
   - Value: `ipfs://QmYourLogoHash`

---

## 💡 Pro Tips

### For Best Web3 Experience:

1. **Set up IPNS** (InterPlanetary Name System):

   - Permanent IPFS address that updates
   - Link ENS to IPNS instead of IPFS hash
   - No need to update ENS after each deploy

2. **Add Multiple Content Hashes**:

   - Primary: IPFS/IPNS
   - Fallback: Arweave (permanent storage)
   - Backup: Traditional hosting

3. **Use ENS for Everything**:

   - Update token contracts to use ENS
   - Set wallet address in ENS
   - Link social profiles

4. **Enable ENS Subdomains**:
   - `admin.aetheron.eth` → Admin dashboard
   - `wallet.aetheron.eth` → Browser extension
   - `api.aetheron.eth` → API endpoint

---

## 🚀 Quick Start (Fleek Only - No ENS Yet)

If you want to deploy to IPFS NOW without buying ENS:

1. Go to: https://app.fleek.co/
2. Sign up with GitHub
3. Import "Aetheron" repository
4. Click Deploy
5. Your site is live at: `https://aetheron.on.fleek.co`
6. Buy ENS domain later and link it

**Total time: 5 minutes**  
**Cost: $0** ✅

---

## 📊 Cost Comparison

| Option          | Initial Cost | Annual Cost | Renewal? |
| --------------- | ------------ | ----------- | -------- |
| **ENS .eth**    | $15-60       | $5/year     | Yes      |
| **Unstoppable** | $10-40       | $0          | No       |
| **Fleek only**  | $0           | $0          | No       |
| **ENS + Fleek** | $15-60       | $5/year     | Yes      |

---

## 🎯 Recommended Path

### For Immediate Deployment (FREE):

1. Deploy to Fleek now (5 min)
2. Get URL: `aetheron.on.fleek.co`
3. Test everything
4. Buy ENS domain later

### For Full Web3 Experience:

1. Buy ENS domain `aetheron.eth` ($15-60)
2. Deploy to Fleek (free)
3. Link ENS to IPFS
4. Access via `aetheron.eth.link`

---

## 🆘 Need Help?

**Fleek Setup Issues:**

- Discord: https://discord.gg/fleek
- Docs: https://docs.fleek.co/

**ENS Registration Help:**

- Discord: https://chat.ens.domains/
- Docs: https://docs.ens.domains/

**Funding Help:**

- Buy ETH on: Coinbase, Binance, Kraken
- Send to MetaMask address

---

Want me to help you deploy to Fleek right now (free), or do you want to get the ENS domain first?
