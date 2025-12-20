const fs = require('fs');

function saveBlockchain(chain, filename = 'blockchain_data.json') {
  fs.writeFileSync(filename, JSON.stringify(chain.chain, null, 2));
}

function loadBlockchain(chain, filename = 'blockchain_data.json') {
  if (fs.existsSync(filename)) {
    const data = JSON.parse(fs.readFileSync(filename));
    chain.chain = data;
  }
}

function saveWallets(wallets, filename = 'wallets_data.json') {
  fs.writeFileSync(filename, JSON.stringify(wallets, null, 2));
}

function loadWallets(filename = 'wallets_data.json') {
  if (fs.existsSync(filename)) {
    return JSON.parse(fs.readFileSync(filename));
  }
  return {};
}

module.exports = { saveBlockchain, loadBlockchain, saveWallets, loadWallets };
