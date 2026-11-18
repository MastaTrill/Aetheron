#!/usr/bin/env node

/**
 * Aetheron & Sentinel L3 Health Check Script
 * Verifies all services and Sentinel L3 guardrails are configured and running correctly
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const TIMEOUT = 5000;

const checks = [
  {
    name: 'HTTP Server',
    url: `http://localhost:${PORT}/health`,
    critical: true
  },
  {
    name: 'Sentinel L3 Guardrail API',
    url: `http://localhost:${PORT}/api/sentinel/health`,
    critical: true
  },
  {
    name: 'GraphQL API',
    url: `http://localhost:${PORT}/graphql`,
    critical: false
  },
  {
    name: 'Metrics Endpoint',
    url: `http://localhost:${PORT}/metrics`,
    critical: false
  },
  {
    name: 'API Documentation',
    url: `http://localhost:${PORT}/api-docs`,
    critical: false
  }
];

async function checkEndpoint(check) {
  return new Promise((resolve) => {
    const request = http.get(check.url, { timeout: TIMEOUT }, (res) => {
      const success = res.statusCode >= 200 && res.statusCode < 400;
      resolve({
        ...check,
        status: success ? 'PASS' : 'FAIL',
        statusCode: res.statusCode
      });
    });

    request.on('error', (err) => {
      resolve({
        ...check,
        status: 'FAIL',
        error: err.message
      });
    });

    request.on('timeout', () => {
      request.destroy();
      resolve({
        ...check,
        status: 'FAIL',
        error: 'Timeout'
      });
    });
  });
}

async function checkDependencies() {
  const deps = [];

  try {
    await execAsync('node --version');
    deps.push({ name: 'Node.js', status: 'PASS' });
  } catch (_err) {
    deps.push({ name: 'Node.js', status: 'FAIL' });
  }

  try {
    const addressesPath = path.join(__dirname, 'aetheron-contracts', 'deployments', 'addresses.json');
    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    const validSentinel =
      addresses.sentinel &&
      addresses.sentinel.startsWith('0x') &&
      addresses.l3Relay &&
      addresses.l3Relay.startsWith('0x') &&
      addresses._meta?.sentinelSystemHealthy === true;
    deps.push({
      name: `Sentinel L3 Contracts (Base Sepolia: ${addresses.sentinel?.slice(0, 10)}...)`,
      status: validSentinel ? 'PASS' : 'FAIL'
    });
  } catch (_err) {
    deps.push({ name: 'Sentinel L3 Contracts Manifest', status: 'FAIL' });
  }

  return deps;
}

async function runHealthCheck() {
  console.log('\n🏥 Aetheron & Sentinel L3 Health Check\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📦 Dependencies & Guardrail Manifests:');
  const deps = await checkDependencies();
  deps.forEach((dep) => {
    const icon = dep.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${icon} ${dep.name}`);
  });

  console.log('\n🔌 Service Endpoints:');
  const results = await Promise.all(checks.map(checkEndpoint));

  let allPassed = true;
  let criticalFailed = false;

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const critical = result.critical ? '[CRITICAL]' : '';
    console.log(`   ${icon} ${result.name} ${critical}`);

    if (result.status === 'FAIL') {
      allPassed = false;
      if (result.critical) {
        criticalFailed = true;
      }
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      } else if (result.statusCode) {
        console.log(`      Status: ${result.statusCode}`);
      }
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (allPassed) {
    console.log('✅ All health checks passed!\n');
    process.exit(0);
  } else if (criticalFailed) {
    console.log('❌ Critical health checks failed!\n');
    console.log('💡 Make sure the server is running: npm start\n');
    process.exit(1);
  } else {
    console.log('⚠️  Some non-critical checks failed\n');
    process.exit(0);
  }
}

runHealthCheck().catch((err) => {
  console.error('Health check error:', err);
  process.exit(1);
});
