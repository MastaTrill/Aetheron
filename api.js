const express = require('express');
const { Blockchain, Transaction, Wallet } = require('./blockchain');
const { saveBlockchain, loadBlockchain } = require('./persistence');
const { DEX } = require('./dex');
const { DAO } = require('./dao');
const { SocialNetwork } = require('./social');
const { Reputation } = require('./reputation');
const { CarbonMarket } = require('./carbon');
const { Education } = require('./education');
const { DeFiLending } = require('./defi');
const { GamePlatform } = require('./game');
const { Crowdfunding } = require('./crowdfunding');
const { MultiChainIntegration } = require('./multichain');
const { SolanaIntegration } = require('./solana');

const app = express();
app.use(express.json());

let chain = new Blockchain();
loadBlockchain(chain);
let wallets = {};

const dex = new DEX();
const dao = new DAO();
const social = new SocialNetwork();
const rep = new Reputation();
const carbon = new CarbonMarket();
const edu = new Education();
const defi = new DeFiLending();
const game = new GamePlatform();
const crowd = new Crowdfunding();

// Export for testing
if (process.env.NODE_ENV === 'test') {
  module.exports.wallets = wallets;
  module.exports.chain = chain;
  module.exports.resetState = () => {
    wallets = {};
    chain = new Blockchain();
  };
}

// Multi-chain support
const multichain = new MultiChainIntegration('ethereum');
const solana = new SolanaIntegration('mainnet-beta');

const stats = {
  txCount: 0,
  blockCount: 0,
  users: new Set(),
  proposals: 0,
  liquidity: 0
};

app.get('/chain', (_req, res) => {
  res.json(chain.chain);
});

app.get('/balance/:address', (req, res) => {
  res.json({ balance: chain.getBalance(req.params.address) });
});

app.post('/wallet', (req, res) => {
  const { password } = req.body;
  const w = new Wallet(password);
  wallets[w.publicKey] = w;
  res.json({ publicKey: w.publicKey, encrypted: w.encrypted });
});

app.post('/transaction', (req, res) => {
  const { sender, receiver, amount, fee, contract, password } = req.body;
  const wallet = wallets[sender];
  if (!wallet) return res.status(400).json({ error: 'Sender wallet not found' });
  let privKey;
  if (wallet.encrypted) {
    if (!password) return res.status(400).json({ error: 'Password required for encrypted wallet' });
    privKey = wallet.getDecryptedPrivateKey(password);
  } else {
    privKey = wallet.privateKey;
  }
  const tx = new Transaction(sender, receiver, amount, null, fee);
  if (contract) tx.contract = contract;
  tx.signTransaction(privKey);
  try {
    chain.addTransaction(tx);
    res.json({ status: 'Transaction added' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/mine', (req, res) => {
  const { rewardAddress } = req.body;
  try {
    const block = chain.createBlock(rewardAddress);
    res.json({ block });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DEX endpoints
app.post('/dex/add-liquidity', (req, res) => {
  const { tokenA, tokenB, amountA, amountB } = req.body;
  dex.addLiquidity(tokenA, tokenB, amountA, amountB);
  stats.liquidity += Number(req.body.amountA) + Number(req.body.amountB);
  res.json({ status: 'Liquidity added' });
});
app.post('/dex/swap', (req, res) => {
  const { tokenA, tokenB, amountA } = req.body;
  const amountB = dex.swap(tokenA, tokenB, amountA);
  res.json({ amountB });
});

// DAO endpoints
app.post('/dao/add-member', (req, res) => {
  const { address } = req.body;
  dao.addMember(address);
  res.json({ status: 'Member added' });
});
app.post('/dao/propose', (req, res) => {
  const { description } = req.body;
  const id = dao.propose(description);
  stats.proposals++;
  res.json({ proposalId: id });
});
app.post('/dao/vote', (req, res) => {
  const { id, member, support } = req.body;
  dao.vote(id, member, support);
  res.json({ status: 'Vote recorded' });
});

// Social endpoints
app.post('/social/profile', (req, res) => {
  const { address, data } = req.body;
  social.createProfile(address, data);
  stats.users.add(req.body.address);
  res.json({ status: 'Profile created' });
});
app.post('/social/post', (req, res) => {
  const { address, content } = req.body;
  social.post(address, content);
  stats.txCount++;
  res.json({ status: 'Post created' });
});
app.post('/social/follow', (req, res) => {
  const { follower, followee } = req.body;
  social.follow(follower, followee);
  res.json({ status: 'Followed' });
});

// Reputation endpoints
app.post('/reputation/add', (req, res) => {
  const { address, delta } = req.body;
  rep.addScore(address, delta);
  res.json({ status: 'Score updated' });
});
app.get('/reputation/:address', (req, res) => {
  res.json({ score: rep.getScore(req.params.address) });
});

// Carbon Market endpoints
app.post('/carbon/issue', (req, res) => {
  const { address, amount } = req.body;
  carbon.issueCredit(address, amount);
  res.json({ status: 'Credit issued' });
});
app.post('/carbon/transfer', (req, res) => {
  const { from, to, amount } = req.body;
  carbon.transferCredit(from, to, amount);
  res.json({ status: 'Credit transferred' });
});

// Education endpoints
app.post('/education/issue', (req, res) => {
  const { address, course, badge } = req.body;
  edu.issueCertificate(address, course, badge);
  res.json({ status: 'Certificate issued' });
});
app.get('/education/:address', (req, res) => {
  res.json({ certificates: edu.getCertificates(req.params.address) });
});

// DeFi endpoints
app.post('/defi/lend', (req, res) => {
  const { lender, borrower, amount, collateral } = req.body;
  defi.lend(lender, borrower, amount, collateral);
  stats.txCount++;
  res.json({ status: 'Loan created' });
});
app.post('/defi/repay', (req, res) => {
  const { index } = req.body;
  defi.repay(index);
  res.json({ status: 'Loan repaid' });
});

// Gaming endpoints
app.post('/game/asset', (req, res) => {
  const { address, asset } = req.body;
  game.addAsset(address, asset);
  res.json({ status: 'Asset added' });
});
app.post('/game/leaderboard', (req, res) => {
  const { address, score } = req.body;
  game.updateLeaderboard(address, score);
  res.json({ status: 'Leaderboard updated' });
});

// Crowdfunding endpoints
app.post('/crowd/campaign', (req, res) => {
  const { owner, goal } = req.body;
  const id = crowd.createCampaign(owner, goal);
  stats.txCount++;
  res.json({ campaignId: id });
});
app.post('/crowd/donate', (req, res) => {
  const { id, donor, amount } = req.body;
  crowd.donate(id, donor, amount);
  res.json({ status: 'Donation received' });
});
app.get('/stats', (_req, res) => {
  res.json({
    txCount: stats.txCount,
    blockCount: stats.blockCount,
    userCount: stats.users.size,
    proposals: stats.proposals,
    liquidity: stats.liquidity
  });
});

// User management API
const users = [];
app.post('/users/add', (req, res) => {
  const { address, role = 'user', kyc = false } = req.body;
  if (!users.find((u) => u.address === address))
    users.push({ address, role, kyc, lastActive: new Date().toISOString() });
  res.json({ status: 'User added' });
});
app.get('/users', (_req, res) => {
  res.json(users);
});
app.post('/users/kyc', (req, res) => {
  const { address, kyc } = req.body;
  const user = users.find((u) => u.address === address);
  if (user) user.kyc = kyc;
  res.json({ status: 'KYC updated' });
});
app.post('/users/role', (req, res) => {
  const { address, role } = req.body;
  const user = users.find((u) => u.address === address);
  if (user) user.role = role;
  res.json({ status: 'Role updated' });
});

// Logs & audit trail
const logs = [];
function logAction(type, details) {
  logs.push({ time: new Date().toISOString(), type, details });
  if (logs.length > 200) logs.shift();
}
// Log user actions
app.post('/users/add', (req, _res, next) => {
  logAction('user_add', req.body);
  next();
});
app.post('/users/kyc', (req, _res, next) => {
  logAction('user_kyc', req.body);
  next();
});
app.post('/users/role', (req, _res, next) => {
  logAction('user_role', req.body);
  next();
});
// Log DEX, DAO, etc. (add more as needed)
app.post('/dex/add-liquidity', (req, _res, next) => {
  logAction('dex_liquidity', req.body);
  next();
});
app.post('/dao/propose', (req, _res, next) => {
  logAction('dao_propose', req.body);
  next();
});
app.post('/defi/lend', (req, _res, next) => {
  logAction('defi_lend', req.body);
  next();
});
app.get('/logs', (_req, res) => {
  res.json(logs.slice().reverse());
});

// Multi-chain endpoints
app.get('/multichain/chains', (req, res) => {
  res.json(multichain.getSupportedChains());
});

// Get native balance from PolygonScan API
app.get('/polygon/balance/:address', async (req, res) => {
  const { address } = req.params;
  const apiKey = process.env.POLYGONSCAN_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'POLYGONSCAN_API_KEY not set' });
  }
  try {
    const url = `https://api.polygonscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === '1') {
      res.json({
        address,
        balance: data.result,
        unit: 'MATIC',
        wei: data.result,
        eth: (parseInt(data.result) / 1e18).toString()
      });
    } else {
      res.status(400).json({ error: data.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/multichain/balance/:chain/:address', async (req, res) => {
  const { chain, address } = req.params;
  try {
    if (chain === 'solana') {
      const balance = await solana.getBalance(address);
      res.json({ chain, address, balance, unit: 'SOL' });
    } else {
      const balance = await multichain.getEVMBalance(address, chain);
      res.json({
        chain,
        address,
        balance,
        unit: multichain.getChainConfig(chain).nativeCurrency.symbol
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/multichain/token-balance/:chain/:address', async (req, res) => {
  const { chain, address } = req.params;
  try {
    if (chain === 'solana') {
      const balance = await solana.getTokenBalance(address);
      res.json({ chain, address, balance, token: 'AETH' });
    } else {
      const balance = await multichain.getTokenBalance(address, chain);
      res.json({ chain, address, balance, token: 'AETH' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/multichain/block-number/:chain', async (req, res) => {
  const { chain } = req.params;
  try {
    const blockNumber = await multichain.getBlockNumber(chain);
    res.json({ chain, blockNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/multichain/config/:chain', (req, res) => {
  const { chain } = req.params;
  try {
    const config = multichain.getChainConfig(chain);
    res.json(config);
  } catch (error) {
    res.status(404).json({ error: 'Chain not found' });
  }
});

process.on('exit', () => {
  saveBlockchain(chain);
});

const { ADMIN_USER, checkAdminPassword } = require('./admin-auth');

function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Aetheron Admin"');
    return res.status(401).send('Authentication required.');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === ADMIN_USER && checkAdminPassword(pass)) return next();
  res.set('WWW-Authenticate', 'Basic realm="Aetheron Admin"');
  return res.status(401).send('Invalid credentials.');
}

// Protect admin endpoints
app.use(
  ['/dex', '/dao', '/social', '/reputation', '/carbon', '/education', '/defi', '/game', '/crowd'],
  basicAuth
);

// === Plugin Marketplace Endpoints ===
const plugins = [];
app.get('/plugins', (_req, res) => {
  res.json(plugins);
});
app.post('/plugins/install', (req, res) => {
  const { url } = req.body;
  // Simulate plugin install (in real use, fetch and validate plugin)
  const id = 'plugin-' + (plugins.length + 1);
  const plugin = { id, name: url.split('/').pop() || url, description: 'Installed from ' + url };
  plugins.push(plugin);
  logAction('plugin_install', { id, url });
  res.json({ status: 'installed', message: `Plugin ${plugin.name} installed.` });
});
app.post('/plugins/uninstall', (req, res) => {
  const { id } = req.body;
  const idx = plugins.findIndex((p) => p.id === id);
  if (idx !== -1) {
    const [removed] = plugins.splice(idx, 1);
    logAction('plugin_uninstall', { id });
    res.json({ status: 'uninstalled', message: `Plugin ${removed.name} uninstalled.` });
  } else {
    res.status(404).json({ error: 'Plugin not found' });
  }
});

// Export for testing
if (process.env.NODE_ENV === 'test') {
  module.exports.wallets = wallets;
  module.exports.chain = chain;
  module.exports.resetState = () => {
    wallets = {};
    chain = new Blockchain();
  };
}

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

module.exports = app;
