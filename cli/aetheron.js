#!/usr/bin/env node

/**
 * Aetheron CLI - Developer & Sentinel L3 Operator Tool
 * Command-line interface for Aetheron blockchain & Sentinel L3 operations
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

const program = new Command();

// Configuration
const CONFIG_DIR = path.join(os.homedir(), '.aetheron');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Load configuration
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      apiUrl: 'http://localhost:3001',
      network: 'base-sepolia',
      wallet: null
    };
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

/**
 * Save configuration
 */
function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
  const config = loadConfig();
  const url = `${config.apiUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return await response.json();
}

// CLI Setup
program.name('aetheron').description('Aetheron blockchain & Sentinel L3 CLI tool').version('1.1.0');

// Init command
program
  .command('init')
  .description('Initialize Aetheron CLI')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'network',
        message: 'Select network:',
        choices: ['base-sepolia', 'mainnet', 'testnet', 'localhost']
      },
      {
        type: 'input',
        name: 'apiUrl',
        message: 'API URL:',
        default: 'http://localhost:3001'
      }
    ]);

    const config = {
      ...loadConfig(),
      ...answers
    };

    saveConfig(config);
    console.log(chalk.green('✓ Configuration saved!'));
  });

// Wallet commands
const wallet = program.command('wallet').description('Wallet management');

wallet
  .command('create')
  .description('Create a new wallet')
  .action(async () => {
    const spinner = ora('Creating wallet...').start();

    try {
      const privateKey = crypto.randomBytes(32).toString('hex');
      const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
      const address = '0x' + publicKey.substring(0, 40);

      const config = loadConfig();
      config.wallet = { address, privateKey };
      saveConfig(config);

      spinner.succeed('Wallet created successfully!');

      console.log('\n' + chalk.yellow('⚠️  IMPORTANT: Save your private key securely!'));
      console.log(chalk.white('Address:'), chalk.cyan(address));
      console.log(chalk.white('Private Key:'), chalk.red(privateKey));
    } catch (error) {
      spinner.fail('Failed to create wallet');
      console.error(chalk.red(error.message));
    }
  });

wallet
  .command('import <privateKey>')
  .description('Import wallet from private key')
  .action(async (privateKey) => {
    const spinner = ora('Importing wallet...').start();

    try {
      const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
      const address = '0x' + publicKey.substring(0, 40);

      const config = loadConfig();
      config.wallet = { address, privateKey };
      saveConfig(config);

      spinner.succeed('Wallet imported successfully!');
      console.log(chalk.white('Address:'), chalk.cyan(address));
    } catch (error) {
      spinner.fail('Failed to import wallet');
      console.error(chalk.red(error.message));
    }
  });

wallet
  .command('balance [address]')
  .description('Get wallet balance')
  .action(async (address) => {
    const spinner = ora('Fetching balance...').start();

    try {
      const config = loadConfig();
      const addr = address || config.wallet?.address;

      if (!addr) {
        throw new Error('No wallet configured. Use "aetheron wallet create" first.');
      }

      const data = await apiRequest(`/api/balance/${addr}`);

      spinner.succeed('Balance retrieved');
      console.log(chalk.white('Address:'), chalk.cyan(addr));
      console.log(chalk.white('Balance:'), chalk.green(`${data.balance} AETH`));
    } catch (error) {
      spinner.fail('Failed to get balance');
      console.error(chalk.red(error.message));
    }
  });

// Sentinel L3 commands
const sentinel = program.command('sentinel').description('Aetheron Sentinel L3 & L3Relay operations');

sentinel
  .command('health')
  .description('Check Sentinel L3 guardrail health and active post-quantum policy pack')
  .action(async () => {
    const spinner = ora('Checking Sentinel L3 health...').start();
    try {
      const data = await apiRequest('/api/sentinel/health');
      spinner.succeed('Sentinel L3 status retrieved');
      console.log(chalk.white('System Healthy:'), data.systemHealthy ? chalk.green('Yes') : chalk.red('No'));
      console.log(chalk.white('Kill-Switch Active:'), data.killSwitchActive ? chalk.red('ACTIVE') : chalk.green('Inactive'));
      console.log(chalk.white('Active Policy Pack:'), chalk.cyan(data.activePolicyPack || 'v0.2.0-conservative'));
      console.log(chalk.white('Chain ID:'), chalk.yellow(data.chainId || 84532));
    } catch (error) {
      spinner.fail('Failed to reach Sentinel L3 endpoint');
      console.error(chalk.red(error.message));
    }
  });

sentinel
  .command('evaluate <amount>')
  .option('-l, --liquidity <liquidity>', 'Available pool liquidity', '50000')
  .option('-a, --anomaly <score>', 'Anomaly score (0..1)', '0.02')
  .option('-q, --quorum <ratio>', 'Signer quorum ratio (0..1)', '1.0')
  .description('Evaluate bridge transfer risk via Sentinel L3')
  .action(async (amount, opts) => {
    const spinner = ora('Evaluating transfer risk via Sentinel L3...').start();
    try {
      const numAmt = parseFloat(amount);
      const data = await apiRequest('/api/sentinel/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmt,
          available_liquidity: parseFloat(opts.liquidity),
          velocity_1h: numAmt,
          velocity_24h: Math.max(numAmt * 4, 1000),
          anomaly_score: parseFloat(opts.anomaly),
          signer_quorum_ratio: parseFloat(opts.quorum)
        })
      });
      spinner.succeed(`Decision: ${data.action}`);
      console.log(chalk.white('Risk Score:'), chalk.yellow(data.risk_score));
      console.log(chalk.white('Reasons:'), chalk.cyan((data.reasons || []).join(', ') || 'none'));
      console.log(chalk.white('Controls:'), chalk.magenta((data.controls || []).join(', ')));
    } catch (error) {
      spinner.fail('Sentinel L3 risk evaluation failed');
      console.error(chalk.red(error.message));
    }
  });

sentinel
  .command('relay <payload>')
  .description('Submit cross-chain message via L3Relay')
  .action(async (payload) => {
    const spinner = ora('Submitting L3Relay message...').start();
    try {
      const data = await apiRequest('/api/l3relay/messages', {
        method: 'POST',
        body: JSON.stringify({ payload })
      });
      spinner.succeed('Cross-chain message submitted');
      console.log(chalk.white('Message Hash:'), chalk.cyan(data.messageHash));
      console.log(chalk.white('Status:'), chalk.green(data.status));
    } catch (error) {
      spinner.fail('L3Relay message submission failed');
      console.error(chalk.red(error.message));
    }
  });

// Blockchain commands
const blockchain = program.command('blockchain').alias('bc').description('Blockchain operations');

blockchain
  .command('info')
  .description('Get blockchain information')
  .action(async () => {
    const spinner = ora('Fetching blockchain info...').start();

    try {
      const data = await apiRequest('/api/blockchain');
      spinner.succeed('Blockchain info retrieved');
      console.log(chalk.white('Chain Height:'), chalk.cyan(data.length));
      console.log(chalk.white('Difficulty:'), chalk.cyan(data.difficulty));
      console.log(chalk.white('Pending Transactions:'), chalk.cyan(data.pendingTransactions?.length || 0));
    } catch (error) {
      spinner.fail('Failed to get blockchain info');
      console.error(chalk.red(error.message));
    }
  });

// Config commands
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const config = loadConfig();

    console.log(chalk.cyan('\nAetheron Configuration'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white('Network:'), chalk.yellow(config.network));
    console.log(chalk.white('API URL:'), chalk.yellow(config.apiUrl));
    console.log(
      chalk.white('Wallet:'),
      config.wallet ? chalk.green('Configured') : chalk.red('Not configured')
    );

    if (config.wallet) {
      console.log(chalk.white('Address:'), chalk.cyan(config.wallet.address));
    }
  });

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  program.exitOverride();
  try {
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    } else {
      program.parse(process.argv);
    }
  } catch (error) {
    if (error.code !== 'commander.help' && error.code !== 'commander.helpDisplayed' && error.code !== 'commander.version') {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }
}

export default program;
