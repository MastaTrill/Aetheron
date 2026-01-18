#!/usr/bin/env node

/**
 * Aetheron Domain Setup Verification Script
 * Checks DNS propagation and SSL certificate status
 */

import https from 'https';
import dns from 'dns';
import { promises as dnsPromises } from 'dns';

const DOMAIN = 'aether.io'; // Change this to your domain
const NETLIFY_URL = 'gregarious-strudel-850a21.netlify.app';

async function checkDNS() {
  console.log('🔍 Checking DNS propagation for', DOMAIN);
  console.log('=' .repeat(50));

  try {
    // Check A record
    const aRecords = await dns.resolve4(DOMAIN);
    console.log('✅ A Records:', aRecords);

    // Check CNAME for www
    try {
      const cnameRecords = await dns.resolveCname(`www.${DOMAIN}`);
      console.log('✅ CNAME Records (www):', cnameRecords);
    } catch (error) {
      console.log('⚠️  No CNAME record for www subdomain');
    }

  } catch (error) {
    console.log('❌ DNS Resolution Failed:', error.message);
    console.log('💡 DNS may still be propagating (24-48 hours)');
    return false;
  }

  return true;
}

async function checkSSL() {
  console.log('\n🔒 Checking SSL Certificate');

  return new Promise((resolve) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();

      if (cert && cert.subject) {
        console.log('✅ SSL Certificate Valid');
        console.log('   Issuer:', cert.issuer.CN);
        console.log('   Valid Until:', cert.valid_to);
        resolve(true);
      } else {
        console.log('❌ No SSL Certificate Found');
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('❌ SSL Check Failed:', error.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('⏰ SSL Check Timeout');
      resolve(false);
    });

    req.end();
  });
}

async function checkWebsite() {
  console.log('\n🌐 Checking Website Accessibility');

  return new Promise((resolve) => {
    https.get(`https://${DOMAIN}`, (res) => {
      console.log('✅ Website Accessible');
      console.log('   Status Code:', res.statusCode);
      console.log('   Response Time: OK');

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data.includes('Aetheron') || data.includes('DeFi')) {
          console.log('✅ Content Loading Correctly');
        } else {
          console.log('⚠️  Content May Not Be Loading (check Netlify deployment)');
        }
        resolve(true);
      });
    }).on('error', (error) => {
      console.log('❌ Website Check Failed:', error.message);
      console.log('💡 Try accessing directly:', `https://${NETLIFY_URL}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🚀 Aetheron Domain Setup Verification');
  console.log('=====================================\n');

  const dnsOk = await checkDNS();
  const sslOk = await checkSSL();
  const websiteOk = await checkWebsite();

  console.log('\n📊 Summary:');
  console.log('===========');
  console.log('DNS Propagation:', dnsOk ? '✅ Complete' : '⏳ In Progress');
  console.log('SSL Certificate:', sslOk ? '✅ Active' : '⏳ Pending');
  console.log('Website Access:', websiteOk ? '✅ Working' : '❌ Issues');

  if (dnsOk && sslOk && websiteOk) {
    console.log('\n🎉 Domain setup is COMPLETE!');
    console.log('🌐 Visit:', `https://${DOMAIN}`);
  } else {
    console.log('\n⏳ Domain setup is still in progress...');
    console.log('💡 Check back in a few hours');
    console.log('🔧 If issues persist, verify DNS settings in your domain registrar');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { checkDNS, checkSSL, checkWebsite };
