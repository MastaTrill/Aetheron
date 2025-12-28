# Get Free aetheron.tk Domain

## 🌐 Register Free Domain at Freenom

### Step 1: Check Availability

1. **Go to Freenom:**
   - Visit: https://www.freenom.com/
   
2. **Search for domain:**
   - Enter: `aetheron`
   - Click "Check Availability"

3. **Choose extension:**
   - `aetheron.tk` (Tokelau)
   - `aetheron.ml` (Mali)
   - `aetheron.ga` (Gabon)
   - `aetheron.cf` (Central African Republic)
   - `aetheron.gq` (Equatorial Guinea)

4. **Select your domain:**
   - Click "Get it now!" next to `aetheron.tk`
   - Click "Checkout"

### Step 2: Register

1. **Choose period:**
   - Select "12 Months @ FREE"
   - Can renew for free before expiry

2. **Create account:**
   - Enter your email
   - Verify email address
   - Complete registration

3. **Complete order:**
   - Click "Complete Order"
   - Domain is now yours!

---

## 🔗 Connect Domain to Your Hosting

### Option A: Connect to Netlify

1. **Deploy to Netlify first:**
   - Go to: https://app.netlify.com/start
   - Connect GitHub → Select Aetheron
   - Deploy (get temporary URL)

2. **Add custom domain in Netlify:**
   - In Netlify dashboard → Domain settings
   - Click "Add custom domain"
   - Enter: `aetheron.tk`
   - Netlify gives you DNS records

3. **Update Freenom DNS:**
   - Go to: https://my.freenom.com/
   - Click "Services" → "My Domains"
   - Click "Manage Domain" for aetheron.tk
   - Click "Management Tools" → "Nameservers"
   - Choose "Use custom nameservers"
   - Add Netlify nameservers:
     ```
     dns1.p01.nsone.net
     dns2.p01.nsone.net
     dns3.p01.nsone.net
     dns4.p01.nsone.net
     ```
   - Click "Change Nameservers"

4. **Wait for DNS propagation:**
   - Takes 1-24 hours (usually ~1 hour)
   - Check status at: https://www.whatsmydns.net/

5. **Enable SSL:**
   - Netlify auto-enables HTTPS
   - Your site: `https://aetheron.tk`

### Option B: Connect to Vercel

1. **Deploy to Vercel:**
   - Go to: https://vercel.com/new
   - Import Aetheron from GitHub
   - Deploy

2. **Add domain in Vercel:**
   - In project settings → Domains
   - Enter: `aetheron.tk`
   - Vercel gives you DNS records

3. **Update Freenom DNS:**
   - Go to Freenom → Manage Domain
   - Choose "Use custom nameservers"
   - Add Vercel nameservers:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```

### Option C: Connect to Azure

1. **Deploy to Azure Static Web Apps** (already set up)

2. **Add custom domain in Azure:**
   - Azure Portal → Your Static Web App
   - Click "Custom domains"
   - Click "Add"
   - Enter: `aetheron.tk`
   - Azure gives you a CNAME record

3. **Update Freenom DNS:**
   - Go to Freenom → Manage Domain
   - Click "Manage Freenom DNS"
   - Add record:
     - **Type:** CNAME
     - **Name:** www
     - **Target:** Your Azure URL (e.g., `aetheron-xxx.azurestaticapps.net`)
     - **TTL:** 3600
   - Add A record for root domain:
     - **Type:** A
     - **Name:** (leave empty)
     - **Target:** Get IP from Azure
     - **TTL:** 3600

### Option D: Simple DNS Setup (Works with any host)

**Using Freenom DNS Manager:**

1. **Get your hosting IP/CNAME:**
   - From Netlify/Vercel/Azure deployment

2. **Configure Freenom DNS:**
   - Freenom → Manage Domain → Manage Freenom DNS
   - Add records:

   **For root domain (aetheron.tk):**
   ```
   Type: A
   Name: (empty)
   Target: Your hosting IP
   TTL: 14400
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Target: Your hosting URL
   TTL: 14400
   ```

---

## 🚀 Quick Deploy Options

### Fastest: Netlify + aetheron.tk (20 minutes)

1. **Deploy to Netlify** (2 min):
   - https://app.netlify.com/start
   - Import Aetheron
   
2. **Register aetheron.tk** (10 min):
   - https://www.freenom.com/
   - Search and register

3. **Connect domain** (5 min):
   - Netlify: Add custom domain
   - Freenom: Update nameservers

4. **Wait for DNS** (1-24 hours)

5. **Done!** Access at: `https://aetheron.tk`

---

## ⚠️ Important Notes

### Freenom Domain Rules:
- ✅ Free for 12 months
- ✅ Can renew for free (must renew before expiry)
- ✅ Must have content on site (no parking)
- ⚠️ Freenom can reclaim inactive domains
- ⚠️ Keep your Freenom account active

### Best Practices:
1. **Set renewal reminder** 1 month before expiry
2. **Keep site active** (no empty pages)
3. **Add backup domain** (e.g., netlify.app as fallback)
4. **Enable HTTPS** (automatic on most platforms)

### Alternative Free TLDs:
If `.tk` is taken, try:
- `aetheron.ml` (Mali)
- `aetheron.ga` (Gabon)
- `aetheron.cf` (Central African Republic)
- `aetheron.gq` (Equatorial Guinea)

All are free for 12 months!

---

## 🔍 Check Domain Status

### Test if domain is working:
```
# Check DNS propagation
https://www.whatsmydns.net/#A/aetheron.tk

# Test SSL certificate
https://www.sslshopper.com/ssl-checker.html#hostname=aetheron.tk
```

### Troubleshooting:
- **Domain not resolving:** Wait 24 hours for DNS propagation
- **SSL not working:** Host should auto-provision (wait 1 hour)
- **Can't access site:** Check nameservers are correct

---

## 📊 Summary

| Step | Time | Cost |
|------|------|------|
| Register aetheron.tk | 10 min | $0 |
| Deploy to host | 2-5 min | $0 |
| Connect domain | 5 min | $0 |
| DNS propagation | 1-24 hrs | $0 |
| **Total** | **~20 min + waiting** | **$0** ✅ |

**Final URL:** `https://aetheron.tk`

---

## 🎯 Recommended Setup

1. **Register:** Get `aetheron.tk` from Freenom
2. **Deploy:** Use Netlify (easiest DNS setup)
3. **Connect:** Update nameservers in Freenom
4. **Wait:** 1-2 hours for DNS
5. **Done:** Your blockchain platform at `https://aetheron.tk`

Ready to start? Begin at: https://www.freenom.com/
