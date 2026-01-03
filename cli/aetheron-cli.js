#!/usr/bin/env node

/**
 * Aetheron CLI
 * Developer command-line tool for Aetheron blockchain
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const program = new Command();

// Configuration
const CONFIG_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.aetheron',
  'config.json'
);

/**
 * Load config
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error(chalk.red('Error loading config:'), error.message);
  }
  return { apiUrl: 'https://api.aetheron.network', wallets: [] };
}

/**
 * Save config
 */
function saveConfig(config) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * API request helper
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const config = loadConfig();
  const url = `${config.apiUrl}${endpoint}`;

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  return response.json();
}

// CLI Setup
program.name('aetheron').description('Aetheron blockchain CLI tool').version('1.0.0');

// Config Command
program
  .command('config')
  .description('Configure CLI settings')
  .option('-u, --url <url>', 'Set API URL')
  .option('-s, --show', 'Show current config')
  .action((options) => {
    const config = loadConfig();

    if (options.show) {
      console.log(chalk.blue('Current Configuration:'));
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    if (options.url) {
      config.apiUrl = options.url;
      saveConfig(config);
      console.log(chalk.green('✓ API URL updated'));
    }
  });

// Wallet Commands
const wallet = program.command('wallet').description('Wallet management');

wallet
  .command('create')
  .description('Create a new wallet')
  .option('-n, --name <name>', 'Wallet name')
  .action(async (options) => {
    const spinner = ora('Creating wallet...').start();

    const privateKey = crypto.randomBytes(32).toString('hex');
    const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
    const address = '0x' + publicKey.substring(0, 40);

    const config = loadConfig();
    config.wallets.push({
      name: options.name || `Wallet ${config.wallets.length + 1}`,
      address,
      privateKey,
      createdAt: new Date().toISOString()
    });
    saveConfig(config);

    spinner.succeed('Wallet created successfully!');
    console.log(chalk.green('\nAddress:'), address);
    console.log(chalk.yellow('⚠️  Save your private key securely!'));
    console.log(chalk.gray('Private Key:'), privateKey);
  });

wallet
  .command('list')
  .description('List all wallets')
  .action(() => {
    const config = loadConfig();

    if (config.wallets.length === 0) {
      console.log(chalk.yellow('No wallets found. Create one with: aetheron wallet create'));
      return;
    }

    const table = new Table({
      head: ['Name', 'Address', 'Created'],
      style: { head: ['cyan'] }
    });

    config.wallets.forEach((w) => {
      table.push([w.name, w.address, new Date(w.createdAt).toLocaleDateString()]);
    });

    console.log(table.toString());
  });

wallet
  .command('balance <address>')
  .description('Get wallet balance')
  .action(async (address) => {
    const spinner = ora('Fetching balance...').start();

    try {
      const data = await apiRequest(`/api/balance/${address}`);
      spinner.succeed('Balance retrieved');
      console.log(chalk.green('\nBalance:'), `${data.balance} AETH`);
    } catch (error) {
      spinner.fail('Failed to fetch balance');
      console.error(chalk.red(error.message));
    }
  });

// Transaction Commands
const tx = program.command('tx').description('Transaction operations');

tx.command('send')
  .description('Send AETH')
  .requiredOption('-f, --from <address>', 'From address')
  .requiredOption('-t, --to <address>', 'To address')
  .requiredOption('-a, --amount <amount>', 'Amount to send')
  .option('-k, --key <privateKey>', 'Private key')
  .action(async (options) => {
    const spinner = ora('Sending transaction...').start();

    try {
      const transaction = {
        from: options.from,
        to: options.to,
        amount: parseFloat(options.amount),
        timestamp: Date.now()
      };

      // Sign transaction (simplified)
      const signature = crypto
        .createHmac('sha256', options.key)
        .update(JSON.stringify(transaction))
        .digest('hex');

      transaction.signature = signature;

      const result = await apiRequest('/api/transaction', 'POST', transaction);

      spinner.succeed('Transaction sent!');
      console.log(chalk.green('\nTransaction Hash:'), result.hash);
    } catch (error) {
      spinner.fail('Transaction failed');
      console.error(chalk.red(error.message));
    }
  });

tx.command('get <hash>')
  .description('Get transaction details')
  .action(async (hash) => {
    const spinner = ora('Fetching transaction...').start();

    try {
      const data = await apiRequest(`/api/transaction/${hash}`);
      spinner.succeed('Transaction found');

      console.log(chalk.blue('\nTransaction Details:'));
      console.log(chalk.gray('Hash:'), data.hash);
      console.log(chalk.gray('From:'), data.sender);
      console.log(chalk.gray('To:'), data.receiver);
      console.log(chalk.gray('Amount:'), `${data.amount} AETH`);
      console.log(chalk.gray('Status:'), data.status);
    } catch (error) {
      spinner.fail('Transaction not found');
      console.error(chalk.red(error.message));
    }
  });

// Blockchain Commands
const chain = program.command('chain').description('Blockchain operations');

chain
  .command('info')
  .description('Get blockchain info')
  .action(async () => {
    const spinner = ora('Fetching blockchain info...').start();

    try {
      const data = await apiRequest('/api/blockchain');
      spinner.succeed('Blockchain info retrieved');

      const table = new Table();
      table.push(
        { 'Chain Length': data.chain.length },
        { Difficulty: data.difficulty },
        { 'Mining Reward': `${data.miningReward} AETH` }
      );

      console.log(table.toString());
    } catch (error) {
      spinner.fail('Failed to fetch blockchain info');
      console.error(chalk.red(error.message));
    }
  });

chain
  .command('latest')
  .description('Get latest block')
  .action(async () => {
    const spinner = ora('Fetching latest block...').start();

    try {
      const data = await apiRequest('/api/blockchain');
      const latestBlock = data.chain[data.chain.length - 1];
      spinner.succeed('Latest block retrieved');

      console.log(chalk.blue('\nLatest Block:'));
      console.log(chalk.gray('Index:'), latestBlock.index);
      console.log(chalk.gray('Hash:'), latestBlock.hash);
      console.log(chalk.gray('Timestamp:'), new Date(latestBlock.timestamp).toLocaleString());
      console.log(chalk.gray('Transactions:'), latestBlock.transactions?.length || 0);
    } catch (error) {
      spinner.fail('Failed to fetch latest block');
      console.error(chalk.red(error.message));
    }
  });

// Smart Contract Commands
const contract = program.command('contract').description('Smart contract operations');

contract
  .command('deploy <file>')
  .description('Deploy smart contract')
  .option('-a, --args <args>', 'Constructor arguments (JSON)')
  .action(async (file, options) => {
    const spinner = ora('Deploying contract...').start();

    try {
      const code = fs.readFileSync(file, 'utf8');
      const args = options.args ? JSON.parse(options.args) : [];

      const result = await apiRequest('/api/contract/deploy', 'POST', { code, args });

      spinner.succeed('Contract deployed!');
      console.log(chalk.green('\nContract Address:'), result.address);
    } catch (error) {
      spinner.fail('Deployment failed');
      console.error(chalk.red(error.message));
    }
  });

contract
  .command('call <address> <method>')
  .description('Call contract method')
  .option('-a, --args <args>', 'Method arguments (JSON)')
  .action(async (address, method, options) => {
    const spinner = ora('Calling contract...').start();

    try {
      const args = options.args ? JSON.parse(options.args) : [];
      const result = await apiRequest('/api/contract/call', 'POST', { address, method, args });

      spinner.succeed('Contract called');
      console.log(chalk.green('\nResult:'), result.data);
    } catch (error) {
      spinner.fail('Call failed');
      console.error(chalk.red(error.message));
    }
  });

// NFT Commands
const nft = program.command('nft').description('NFT operations');

nft
  .command('mint')
  .description('Mint an NFT')
  .requiredOption('-m, --metadata <uri>', 'Metadata URI')
  .requiredOption('-t, --to <address>', 'Recipient address')
  .action(async (options) => {
    const spinner = ora('Minting NFT...').start();

    try {
      const result = await apiRequest('/api/nft/mint', 'POST', {
        to: options.to,
        metadata: options.metadata
      });

      spinner.succeed('NFT minted!');
      console.log(chalk.green('\nToken ID:'), result.tokenId);
    } catch (error) {
      spinner.fail('Minting failed');
      console.error(chalk.red(error.message));
    }
  });

nft
  .command('list <tokenId>')
  .description('List NFT for sale')
  .requiredOption('-p, --price <price>', 'Sale price')
  .action(async (tokenId, options) => {
    const spinner = ora('Listing NFT...').start();

    try {
      const result = await apiRequest('/api/nft/list', 'POST', {
        tokenId,
        price: parseFloat(options.price)
      });

      spinner.succeed('NFT listed!');
      console.log(chalk.green('\nListing ID:'), result.listingId);
    } catch (error) {
      spinner.fail('Listing failed');
      console.error(chalk.red(error.message));
    }
  });

// DAO Commands
const dao = program.command('dao').description('DAO operations');

dao
  .command('propose')
  .description('Create DAO proposal')
  .requiredOption('-t, --title <title>', 'Proposal title')
  .requiredOption('-d, --description <desc>', 'Proposal description')
  .action(async (options) => {
    const spinner = ora('Creating proposal...').start();

    try {
      const result = await apiRequest('/api/dao/propose', 'POST', {
        title: options.title,
        description: options.description
      });

      spinner.succeed('Proposal created!');
      console.log(chalk.green('\nProposal ID:'), result.id);
    } catch (error) {
      spinner.fail('Failed to create proposal');
      console.error(chalk.red(error.message));
    }
  });

dao
  .command('vote <proposalId> <vote>')
  .description('Vote on proposal (yes/no)')
  .action(async (proposalId, vote) => {
    const spinner = ora('Submitting vote...').start();

    try {
      await apiRequest('/api/dao/vote', 'POST', { proposalId, vote });
      spinner.succeed('Vote submitted!');
    } catch (error) {
      spinner.fail('Vote failed');
      console.error(chalk.red(error.message));
    }
  });

// Development Commands
const dev = program.command('dev').description('Development utilities');

dev
  .command('init <project-name>')
  .description('Initialize new Aetheron project')
  .action((projectName) => {
    const spinner = ora('Creating project...').start();

    const projectDir = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectDir)) {
      spinner.fail('Project directory already exists');
      return;
    }

    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'contracts'));
    fs.mkdirSync(path.join(projectDir, 'test'));
    fs.mkdirSync(path.join(projectDir, 'scripts'));

    const packageJson = {
      name: projectName,
      version: '1.0.0',
      description: 'Aetheron blockchain project',
      scripts: {
        test: 'node test/test.js',
        deploy: 'node scripts/deploy.js'
      },
      dependencies: {}
    };

    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    fs.writeFileSync(
      path.join(projectDir, 'README.md'),
      `# ${projectName}\n\nAetheron blockchain project\n`
    );

    spinner.succeed('Project created!');
    console.log(chalk.green('\nNext steps:'));
    console.log(chalk.gray(`  cd ${projectName}`));
    console.log(chalk.gray('  aetheron contract deploy contracts/MyContract.sol'));
  });

dev
  .command('test')
  .description('Run tests')
  .action(() => {
    console.log(chalk.blue('Running tests...'));
    // Test execution logic
  });

// Parse commands
program.parse();
