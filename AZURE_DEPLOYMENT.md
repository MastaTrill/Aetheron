# Deploy Aetheron to Azure Static Web Apps

## 🌐 What You'll Get

**Free Azure URL:** `https://aetheron-[random].azurestaticapps.net`

Or with custom domain: `https://aetheron.AETX.com`

### Features:

- ✅ **100GB bandwidth/month** (free tier)
- ✅ **Free SSL certificate**
- ✅ **Global CDN** (fast worldwide)
- ✅ **Auto-deploy** from GitHub
- ✅ **Custom domains** supported
- ✅ **Staging environments** for PRs
- ✅ **API integration** ready (Azure Functions)

---

## 🚀 Deployment Steps

### Step 1: Create Azure Account (Free)

1. **Go to Azure Portal:**

   - Visit: https://portal.azure.com/
   - Click "Start Free" or "Sign In"

2. **Sign up options:**

   - Use GitHub account (recommended)
   - Use Microsoft account
   - Use email

3. **Free tier includes:**
   - $200 credit for 30 days
   - Many services free forever
   - No credit card required for Static Web Apps

### Step 2: Create Static Web App

1. **In Azure Portal:**

   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

2. **Configure basics:**

   - **Subscription:** Your free subscription
   - **Resource Group:** Create new → Name it "aetheron-rg"
   - **Name:** `aetheron` (will become `aetheron.azurestaticapps.net`)
   - **Region:** Choose closest to you (e.g., "East US 2")
   - **Plan type:** Free

3. **Configure deployment:**

   - **Source:** GitHub
   - Click "Sign in with GitHub"
   - **Organization:** MastaTrill
   - **Repository:** Aetheron
   - **Branch:** main

4. **Build Details:**

   - **Build Presets:** Custom
   - **App location:** `/` (root)
   - **Api location:** (leave empty)
   - **Output location:** (leave empty)

5. **Click "Review + create"** → **Create**

### Step 3: Automatic Deployment

Azure will automatically:

1. Add a GitHub Action workflow to your repo
2. Create deployment token (stored as GitHub secret)
3. Deploy your site
4. Generate URL: `https://aetheron-[random].azurestaticapps.net`

**Deployment takes ~2-3 minutes**

### Step 4: Get Your URL

1. **In Azure Portal:**

   - Go to your Static Web App resource
   - Look for "URL" in the Overview page
   - Copy your URL

2. **Test your site:**
   - Open the URL in browser
   - All pages should work!

---

## 🎨 Custom Domain (Optional)

### Add Your Own Domain:

1. **In Azure Portal:**

   - Go to your Static Web App
   - Click "Custom domains" in the left menu
   - Click "Add"

2. **Choose option:**

   - **Custom domain on other DNS:** Use any domain
   - **Custom domain on Azure DNS:** Use Azure-managed DNS

3. **Add DNS records:**

   - Type: `CNAME`
   - Name: `aetheron` or `www`
   - Value: Your Azure URL

4. **Validate and add**

**Free Azure DNS domains:**

- You can use `aetheron.azurewebsites.net` for free

---

## 📊 Monitor Your Site

### View Analytics:

1. **In Azure Portal:**
   - Go to your Static Web App
   - Click "Metrics"
   - View:
     - Request count
     - Data transfer
     - Response time
     - Status codes

### View Logs:

1. **Enable Application Insights** (optional):
   - In Static Web App settings
   - Click "Application Insights"
   - Enable monitoring
   - View detailed logs and performance

---

## 🔧 GitHub Actions Workflow

Azure automatically created: `.github/workflows/azure-static-web-apps.yml`

This workflow:

- ✅ Deploys on every push to `main`
- ✅ Creates preview environments for PRs
- ✅ Auto-closes preview when PR is closed
- ✅ Uses deployment token from secrets

**No manual intervention needed!** Just push to GitHub and Azure deploys automatically.

---

## 🎯 Alternative: Deploy via VS Code

### Using Azure Extension:

1. **Install Azure Static Web Apps extension:**

   - In VS Code
   - Search for "Azure Static Web Apps"
   - Click "Install"

2. **Sign in to Azure:**

   - Click Azure icon in sidebar
   - Sign in with Azure account

3. **Deploy:**
   - Right-click on `staticwebapp.config.json`
   - Select "Deploy to Static Web App"
   - Choose or create Static Web App
   - Follow prompts

---

## 🔐 Environment Variables (For Future API)

If you add backend API later:

1. **In Azure Portal:**

   - Go to your Static Web App
   - Click "Configuration"
   - Add application settings:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - etc.

2. **Access in API Functions:**
   ```javascript
   const mongoUri = process.env.MONGODB_URI;
   ```

---

## 💰 Pricing

### Free Tier Includes:

- ✅ 100 GB bandwidth/month
- ✅ 2 custom domains
- ✅ Free SSL certificates
- ✅ Staging environments
- ✅ GitHub integration

### If You Exceed (unlikely):

- Extra bandwidth: $0.20/GB
- You'll get warnings before charges

**For your project:** Free tier is more than enough!

---

## 🔄 Update Your Site

**Automatic deployment:**

```bash
# Make changes to your HTML files
git add .
git commit -m "Update website"
git push origin main

# Azure automatically deploys in 2-3 minutes!
```

**View deployment status:**

- GitHub Actions tab
- Azure Portal → Deployment History

---

## 🌟 Staging Environments

**Automatic PR previews:**

1. Create a pull request
2. Azure creates preview environment
3. Get unique URL: `https://aetheron-[random]-[pr-number].azurestaticapps.net`
4. Test changes before merging
5. Preview auto-deleted when PR closes

---

## 📚 Additional Resources

**Azure Docs:**

- https://docs.microsoft.com/azure/static-web-apps/

**Pricing Details:**

- https://azure.microsoft.com/pricing/details/app-service/static/

**Support:**

- Azure Portal → Support
- GitHub Issues → Azure/static-web-apps

---

## 🚨 Troubleshooting

### Site not deploying?

- Check GitHub Actions tab for errors
- Verify `staticwebapp.config.json` is valid
- Check Azure Portal → Deployment History

### 404 errors?

- Verify file paths in `staticwebapp.config.json`
- Check files are in root directory

### Custom domain not working?

- Verify DNS records propagated (24-48 hours)
- Check CNAME points to correct Azure URL

---

## 🎯 Quick Summary

1. **Create Azure account** (free)
2. **Create Static Web App** via Azure Portal
3. **Connect to GitHub** (automatic)
4. **Get URL**: `aetheron-[random].azurestaticapps.net`
5. **Push to GitHub** → Auto-deploys

**Total time: 10 minutes**  
**Cost: $0** ✅

---

Ready to deploy? Follow Step 1 above!
