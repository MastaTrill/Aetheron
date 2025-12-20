#!/usr/bin/env node

/**
 * Aetheron CLI - Developer Tool
 * Command-line interface for Aetheron blockchain operations
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const Table = require('cli-table3');
const figlet = require('figlet');
const fs = require('fs');
const path = require('path');

const program = new Command();

// Configuration
const CONFIG_DIR = path.join(require('os').homedir(), '.aetheron');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Load configuration
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      apiUrl: 'https://api.aetheron.network',
      network: 'mainnet',
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
program.name('aetheron').description('Aetheron blockchain CLI tool').version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize Aetheron CLI')
  .action(async () => {
    console.log(chalk.cyan(figlet.textSync('Aetheron', { horizontalLayout: 'full' })));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'network',
        message: 'Select network:',
        choices: ['mainnet', 'testnet', 'localhost']
      },
      {
        type: 'input',
        name: 'apiUrl',
        message: 'API URL:',
        default: 'https://api.aetheron.network'
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
      const crypto = require('crypto');
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
      const crypto = require('crypto');
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

      const table = new Table();
      table.push(
        ['Chain Height', data.length],
        ['Difficulty', data.difficulty],
        ['Pending Transactions', data.pendingTransactions?.length || 0]
      );

      console.log(table.toString());
    } catch (error) {
      spinner.fail('Failed to get blockchain info');
      console.error(chalk.red(error.message));
    }
  });

blockchain
  .command('block <index>')
  .description('Get block by index')
  .action(async (index) => {
    const spinner = ora('Fetching block...').start();

    try {
      const data = await apiRequest(`/api/block/${index}`);

      spinner.succeed('Block retrieved');

      console.log(chalk.white('\nBlock #' + data.index));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.white('Hash:'), chalk.cyan(data.hash));
      console.log(chalk.white('Previous Hash:'), chalk.cyan(data.previousHash));
      console.log(chalk.white('Timestamp:'), new Date(data.timestamp).toLocaleString());
      console.log(chalk.white('Nonce:'), data.nonce);
      console.log(chalk.white('Transactions:'), data.transactions?.length || 0);

      if (data.transactions?.length > 0) {
        console.log(chalk.white('\nTransactions:'));
        data.transactions.forEach((tx, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${tx.sender} → ${tx.receiver}: ${tx.amount} AETH`));
        });
      }
    } catch (error) {
      spinner.fail('Failed to get block');
      console.error(chalk.red(error.message));
    }
  });

// Transaction commands
const tx = program.command('tx').description('Transaction operations');

tx.command('send <to> <amount>')
  .description('Send AETH to an address')
  .action(async (to, amount) => {
    const spinner = ora('Creating transaction...').start();

    try {
      const config = loadConfig();

      if (!config.wallet) {
        throw new Error('No wallet configured. Use "aetheron wallet create" first.');
      }

      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Send ${amount} AETH to ${to}?`,
          default: false
        }
      ]);

      if (!confirm.proceed) {
        spinner.info('Transaction cancelled');
        return;
      }

      spinner.text = 'Sending transaction...';

      const data = await apiRequest('/api/transaction', {
        method: 'POST',
        body: JSON.stringify({
          from: config.wallet.address,
          to,
          amount: parseFloat(amount),
          privateKey: config.wallet.privateKey
        })
      });

      spinner.succeed('Transaction sent!');
      console.log(chalk.white('Transaction Hash:'), chalk.cyan(data.hash));
    } catch (error) {
      spinner.fail('Transaction failed');
      console.error(chalk.red(error.message));
    }
  });

tx.command('get <hash>')
  .description('Get transaction by hash')
  .action(async (hash) => {
    const spinner = ora('Fetching transaction...').start();

    try {
      const data = await apiRequest(`/api/transaction/${hash}`);

      spinner.succeed('Transaction retrieved');

      console.log(chalk.white('\nTransaction Details'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.white('Hash:'), chalk.cyan(data.hash));
      console.log(chalk.white('From:'), chalk.cyan(data.sender));
      console.log(chalk.white('To:'), chalk.cyan(data.receiver));
      console.log(chalk.white('Amount:'), chalk.green(`${data.amount} AETH`));
      console.log(chalk.white('Fee:'), `${data.fee} AETH`);
      console.log(
        chalk.white('Status:'),
        data.status === 'confirmed' ? chalk.green(data.status) : chalk.yellow(data.status)
      );
      console.log(chalk.white('Timestamp:'), new Date(data.timestamp).toLocaleString());
    } catch (error) {
      spinner.fail('Failed to get transaction');
      console.error(chalk.red(error.message));
    }
  });

// Smart contract commands
const contract = program.command('contract').description('Smart contract operations');

contract
  .command('deploy <file>')
  .description('Deploy a smart contract')
  .action(async (file) => {
    const spinner = ora('Deploying contract...').start();

    try {
      const code = fs.readFileSync(file, 'utf8');
      const config = loadConfig();

      if (!config.wallet) {
        throw new Error('No wallet configured.');
      }

      const data = await apiRequest('/api/contract/deploy', {
        method: 'POST',
        body: JSON.stringify({
          code,
          from: config.wallet.address,
          privateKey: config.wallet.privateKey
        })
      });

      spinner.succeed('Contract deployed!');
      console.log(chalk.white('Contract Address:'), chalk.cyan(data.address));
      console.log(chalk.white('Transaction Hash:'), chalk.cyan(data.txHash));
    } catch (error) {
      spinner.fail('Deployment failed');
      console.error(chalk.red(error.message));
    }
  });

contract
  .command('call <address> <method> [args...]')
  .description('Call a contract method')
  .action(async (address, method, args) => {
    const spinner = ora('Calling contract...').start();

    try {
      const config = loadConfig();

      const data = await apiRequest('/api/contract/call', {
        method: 'POST',
        body: JSON.stringify({
          address,
          method,
          args: args || [],
          from: config.wallet?.address
        })
      });

      spinner.succeed('Contract call successful');
      console.log(chalk.white('Result:'), chalk.cyan(JSON.stringify(data.result, null, 2)));
    } catch (error) {
      spinner.fail('Contract call failed');
      console.error(chalk.red(error.message));
    }
  });

// Mining commands
program
  .command('mine')
  .description('Mine a new block')
  .action(async () => {
    const spinner = ora('Mining block...').start();

    try {
      const config = loadConfig();

      if (!config.wallet) {
        throw new Error('No wallet configured.');
      }

      const data = await apiRequest('/api/mine', {
        method: 'POST',
        body: JSON.stringify({
          minerAddress: config.wallet.address
        })
      });

      spinner.succeed('Block mined!');
      console.log(chalk.white('Block Index:'), chalk.cyan(data.index));
      console.log(chalk.white('Block Hash:'), chalk.cyan(data.hash));
      console.log(chalk.white('Reward:'), chalk.green(`${data.reward} AETH`));
    } catch (error) {
      spinner.fail('Mining failed');
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

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan(figlet.textSync('Aetheron CLI', { font: 'Small' })));
  program.outputHelp();
}

module.exports = program;
