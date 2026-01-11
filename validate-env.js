#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Validates .env.production file for deployment readiness
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

console.log('🔍 Validating .env.production configuration...\n');

const envPath = path.join(process.cwd(), '.env.production');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.production file not found');
  console.log('Run: cp .env.production.example .env.production');
  process.exit(1);
}

// Clear any environment variables that might be loaded from default .env
const varsToClear = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ALCHEMY_API_KEY',
  'INFURA_PROJECT_ID',
  'ETHERSCAN_API_KEY',
  'POLYGONSCAN_API_KEY',
  'BASESCAN_API_KEY',
  'DEPLOYER_PRIVATE_KEY',
  'TESTNET_PRIVATE_KEY',
  'COINBASE_API_KEY',
  'COINBASE_API_SECRET'
];
varsToClear.forEach((key) => {
  delete process.env[key];
});

// Load environment variables from production file
dotenv.config({ path: envPath });

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ALCHEMY_API_KEY',
  'INFURA_PROJECT_ID',
  'ETHERSCAN_API_KEY',
  'POLYGONSCAN_API_KEY',
  'BASESCAN_API_KEY',
  'DEPLOYER_PRIVATE_KEY',
  'COINBASE_API_KEY',
  'COINBASE_API_SECRET'
];

let valid = true;

console.log('Required Variables:');
console.log('==================');
required.forEach((key) => {
  const value = process.env[key];
  if (!value) {
    console.log(`❌ ${key}: Missing`);
    valid = false;
  } else if (value.includes('your_') || value.includes('example')) {
    console.log(`❌ ${key}: Contains placeholder value`);
    valid = false;
  } else if (key === 'DEPLOYER_PRIVATE_KEY') {
    if (value.length !== 64) {
      console.log(`❌ ${key}: Invalid length (${value.length} chars, should be 64)`);
      valid = false;
    } else if (value.startsWith('0x')) {
      console.log(`❌ ${key}: Should not start with 0x`);
      valid = false;
    } else {
      console.log(`✅ ${key}: Configured`);
    }
  } else {
    console.log(`✅ ${key}: Configured`);
  }
});

console.log('\n' + '='.repeat(50));

if (valid) {
  console.log('🎉 All required environment variables are configured!');
  console.log('\n🚀 Ready for deployment!');
  console.log('Run: npm run contracts:deploy:testnet (to test)');
  console.log('Run: npm run contracts:deploy:mainnet (for production)');
} else {
  console.log('❌ Configuration incomplete. Please update .env.production');
  console.log('\n📖 See DEPLOYMENT_PRODUCTION.md for detailed instructions');
  process.exit(1);
}
