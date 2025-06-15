#!/usr/bin/env node
const { Blockchain, Transaction, Wallet } = require('./blockchain');
const { saveBlockchain, loadBlockchain, saveWallets, loadWallets } = require('./persistence');
const readline = require('readline');
const readlineSync = require('readline-sync');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let chain = new Blockchain();
let wallets = loadWallets();
loadBlockchain(chain);

function prompt() {
  rl.question('\nAetheron CLI> ', async (input) => {
    const [cmd, ...args] = input.trim().split(' ');
    switch (cmd) {
      case 'create-wallet': {
        const password = readlineSync.question('Set wallet password: ', { hideEchoBack: true });
        const w = new Wallet(password);
        wallets[w.publicKey] = w;
        console.log('Wallet created. Public Key:', w.publicKey);
        break;
      }
      case 'balance': {
        const address = args[0];
        console.log('Balance:', chain.getBalance(address));
        break;
      }
      case 'history': {
        const address = args[0];
        console.log('History:', chain.getTransactionHistory(address));
        break;
      }
      case 'stake': {
        const address = args[0];
        const amount = parseInt(args[1]);
        chain.addValidatorStake(address, amount);
        console.log('Stake added.');
        break;
      }
      case 'send': {
        const sender = args[0];
        const receiver = args[1];
        const amount = parseInt(args[2]);
        const wallet = wallets[sender];
        if (!wallet) return console.log('Sender wallet not found.');
        let password = null;
        if (wallet.encrypted) {
          password = readlineSync.question('Wallet password: ', { hideEchoBack: true });
        }
        const tx = new Transaction(sender, receiver, amount);
        tx.signTransaction(wallet.encrypted ? wallet.getDecryptedPrivateKey(password) : wallet.privateKey);
        chain.addTransaction(tx);
        console.log('Transaction added.');
        break;
      }
      case 'mine': {
        try {
          const block = chain.createBlock();
          console.log('Block created:', block);
        } catch (e) {
          console.log('Error:', e.message);
        }
        break;
      }
      case 'chain': {
        console.log(JSON.stringify(chain.chain, null, 2));
        break;
      }
      case 'create-token': {
        const name = args[0];
        const symbol = args[1];
        const supply = parseInt(args[2]);
        const token = new ERC20Token(name, symbol, 18, 0);
        const address = Object.keys(wallets)[0]; // Use first wallet for demo
        token.mint(address, supply);
        global.erc20 = token;
        console.log(`Token ${symbol} created with supply ${supply} for ${address}`);
        break;
      }
      case 'mint-nft': {
        const name = args[0];
        const symbol = args[1];
        const uri = args[2];
        const nft = new ERC721Token(name, symbol);
        const address = Object.keys(wallets)[0];
        const tokenId = nft.mint(address, uri);
        global.erc721 = nft;
        console.log(`NFT ${symbol} minted with tokenId ${tokenId} for ${address}`);
        break;
      }
      case 'propose': {
        const desc = args.join(' ');
        const id = global.governance ? global.governance.propose(desc) : (global.governance = new (require('./governance').Governance()), global.governance.propose(desc));
        console.log(`Proposal #${id} created: ${desc}`);
        break;
      }
      case 'vote': {
        const id = parseInt(args[0]);
        const voter = args[1];
        const support = args[2] === 'yes';
        if (!global.governance) return console.log('No governance instance.');
        global.governance.vote(id, voter, support);
        console.log(`Voted ${support ? 'yes' : 'no'} on proposal #${id}`);
        break;
      }
      case 'add-asset': {
        const address = args[0];
        const asset = args.slice(1).join(' ');
        if (!global.game) global.game = new (require('./game').GamePlatform)();
        global.game.addAsset(address, asset);
        console.log(`Asset added to ${address}: ${asset}`);
        break;
      }
      case 'update-leaderboard': {
        const address = args[0];
        const score = parseInt(args[1]);
        if (!global.game) global.game = new (require('./game').GamePlatform)();
        global.game.updateLeaderboard(address, score);
        console.log(`Leaderboard updated for ${address}: ${score}`);
        break;
      }
      case 'create-campaign': {
        const owner = args[0];
        const goal = parseInt(args[1]);
        if (!global.crowd) global.crowd = new (require('./crowdfunding').Crowdfunding)();
        const id = global.crowd.createCampaign(owner, goal);
        console.log(`Campaign #${id} created by ${owner} with goal ${goal}`);
        break;
      }
      case 'donate': {
        const id = parseInt(args[0]);
        const donor = args[1];
        const amount = parseInt(args[2]);
        if (!global.crowd) global.crowd = new (require('./crowdfunding').Crowdfunding)();
        global.crowd.donate(id, donor, amount);
        console.log(`Donor ${donor} donated ${amount} to campaign #${id}`);
        break;
      }
      case 'add-liquidity': {
        const tokenA = args[0];
        const tokenB = args[1];
        const amountA = parseInt(args[2]);
        const amountB = parseInt(args[3]);
        if (!global.dex) global.dex = new (require('./dex').DEX)();
        global.dex.addLiquidity(tokenA, tokenB, amountA, amountB);
        console.log(`Liquidity added: ${amountA} ${tokenA}, ${amountB} ${tokenB}`);
        break;
      }
      case 'swap': {
        const tokenA = args[0];
        const tokenB = args[1];
        const amountA = parseInt(args[2]);
        if (!global.dex) global.dex = new (require('./dex').DEX)();
        const amountB = global.dex.swap(tokenA, tokenB, amountA);
        console.log(`Swapped ${amountA} ${tokenA} for ${amountB} ${tokenB}`);
        break;
      }
      case 'dao-add-member': {
        const address = args[0];
        if (!global.dao) global.dao = new (require('./dao').DAO)();
        global.dao.addMember(address);
        console.log(`DAO member added: ${address}`);
        break;
      }
      case 'dao-propose': {
        const desc = args.slice(0).join(' ');
        if (!global.dao) global.dao = new (require('./dao').DAO)();
        const id = global.dao.propose(desc);
        console.log(`DAO proposal #${id} created: ${desc}`);
        break;
      }
      case 'dao-vote': {
        const id = parseInt(args[0]);
        const member = args[1];
        const support = args[2] === 'yes';
        if (!global.dao) global.dao = new (require('./dao').DAO)();
        global.dao.vote(id, member, support);
        console.log(`DAO member ${member} voted ${support ? 'yes' : 'no'} on proposal #${id}`);
        break;
      }
      case 'post': {
        const address = args[0];
        const content = args.slice(1).join(' ');
        if (!global.social) global.social = new (require('./social').SocialNetwork)();
        global.social.post(address, content);
        console.log(`Post by ${address}: ${content}`);
        break;
      }
      case 'create-profile': {
        const address = args[0];
        const data = args.slice(1).join(' ');
        if (!global.social) global.social = new (require('./social').SocialNetwork)();
        global.social.createProfile(address, data);
        console.log(`Profile created for ${address}`);
        break;
      }
      case 'follow': {
        const follower = args[0];
        const followee = args[1];
        if (!global.social) global.social = new (require('./social').SocialNetwork)();
        global.social.follow(follower, followee);
        console.log(`${follower} now follows ${followee}`);
        break;
      }
      case 'add-score': {
        const address = args[0];
        const delta = parseInt(args[1]);
        if (!global.rep) global.rep = new (require('./reputation').Reputation)();
        global.rep.addScore(address, delta);
        console.log(`Reputation for ${address} changed by ${delta}`);
        break;
      }
      case 'get-score': {
        const address = args[0];
        if (!global.rep) global.rep = new (require('./reputation').Reputation)();
        const score = global.rep.getScore(address);
        console.log(`Reputation for ${address}: ${score}`);
        break;
      }
      case 'issue-credit': {
        const address = args[0];
        const amount = parseInt(args[1]);
        if (!global.carbon) global.carbon = new (require('./carbon').CarbonMarket)();
        global.carbon.issueCredit(address, amount);
        console.log(`Issued ${amount} carbon credits to ${address}`);
        break;
      }
      case 'transfer-credit': {
        const from = args[0];
        const to = args[1];
        const amount = parseInt(args[2]);
        if (!global.carbon) global.carbon = new (require('./carbon').CarbonMarket)();
        global.carbon.transferCredit(from, to, amount);
        console.log(`Transferred ${amount} carbon credits from ${from} to ${to}`);
        break;
      }
      case 'issue-certificate': {
        const address = args[0];
        const course = args[1];
        const badge = args[2];
        if (!global.edu) global.edu = new (require('./education').Education)();
        global.edu.issueCertificate(address, course, badge);
        console.log(`Certificate issued to ${address} for ${course} (${badge})`);
        break;
      }
      case 'get-certificates': {
        const address = args[0];
        if (!global.edu) global.edu = new (require('./education').Education)();
        const certs = global.edu.getCertificates(address);
        console.log(`Certificates for ${address}:`, certs);
        break;
      }
      case 'lend': {
        const lender = args[0];
        const borrower = args[1];
        const amount = parseInt(args[2]);
        const collateral = args[3];
        if (!global.defi) global.defi = new (require('./defi').DeFiLending)();
        global.defi.lend(lender, borrower, amount, collateral);
        console.log(`Loan: ${lender} lent ${amount} to ${borrower} (collateral: ${collateral})`);
        break;
      }
      case 'repay': {
        const index = parseInt(args[0]);
        if (!global.defi) global.defi = new (require('./defi').DeFiLending)();
        global.defi.repay(index);
        console.log(`Loan #${index} repaid`);
        break;
      }
      case 'exit':
        rl.close();
        return;
      default:
        console.log('Commands: create-wallet, balance <address>, history <address>, stake <address> <amt>, send <sender> <receiver> <amt>, mine, chain, create-token <name> <symbol> <supply>, mint-nft <name> <symbol> <uri>, propose <description>, vote <proposalId> <voter> <yes|no>, add-asset <address> <asset>, update-leaderboard <address> <score>, create-campaign <owner> <goal>, donate <campaignId> <donor> <amount>, add-liquidity <tokenA> <tokenB> <amountA> <amountB>, swap <tokenA> <tokenB> <amountA>, dao-add-member <address>, dao-propose <description>, dao-vote <proposalId> <member> <yes|no>, post <address> <content>, create-profile <address> <data>, follow <follower> <followee>, add-score <address> <delta>, get-score <address>, issue-credit <address> <amount>, transfer-credit <from> <to> <amount>, issue-certificate <address> <course> <badge>, get-certificates <address>, lend <lender> <borrower> <amount> <collateral>, repay <loanIndex>, exit');
    }
    prompt();
  });
}

process.on('exit', () => {
  saveBlockchain(chain);
  saveWallets(wallets);
});

console.log('Aetheron Blockchain CLI');
prompt();
