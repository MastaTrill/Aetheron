#!/usr/bin/env node

/**
 * Aetheron Health Check Script
 * Verifies all services are running correctly
 */

import http from 'http';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const PORT = process.env.PORT || 3001;
const TIMEOUT = 5000;

const checks = [
  {
    name: 'HTTP Server',
    url: `http://localhost:${PORT}/health`,
    critical: true
  },
  {
    name: 'GraphQL API',
    url: `http://localhost:${PORT}/graphql`,
    critical: true
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
    await exec('node --version');
    deps.push({ name: 'Node.js', status: 'PASS' });
  } catch (err) {
    deps.push({ name: 'Node.js', status: 'FAIL' });
  }

  try {
    await exec('npm --version');
    deps.push({ name: 'npm', status: 'PASS' });
  } catch (err) {
    deps.push({ name: 'npm', status: 'FAIL' });
  }

  return deps;
}

async function runHealthCheck() {
  console.log('\n🏥 Aetheron Health Check\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check dependencies
  console.log('📦 Dependencies:');
  const deps = await checkDependencies();
  deps.forEach((dep) => {
    const icon = dep.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${icon} ${dep.name}`);
  });

  console.log('\n🔌 Service Endpoints:');

  // Check all endpoints
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

// Run health check
runHealthCheck().catch((err) => {
  console.error('Health check error:', err);
  process.exit(1);
});
