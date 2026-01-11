// Aetheron Blockchain Core Infrastructure (extracted from aethBLOCKCHAINCODE.txt)

// Use Node.js crypto for real SHA256
import crypto from 'crypto';
import { encrypt, decrypt } from './encryption.js';
// Note: Token contracts would be deployed on-chain, not imported here
import { blockchainEvents } from './events.js';

class Wallet {
  constructor(password = null) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    this.publicKey = publicKey;
    if (password) {
      this.privateKey = encrypt(privateKey, password);
      this.encrypted = true;
    } else {
      this.privateKey = privateKey;
      this.encrypted = false;
    }
  }

  getDecryptedPrivateKey(password) {
    if (this.encrypted) {
      return decrypt(this.privateKey, password);
    }
    return this.privateKey;
  }

  sign(data, password = null) {
    const privKey = this.encrypted ? this.getDecryptedPrivateKey(password) : this.privateKey;
    const sign = crypto.createSign('SHA256');
    sign.update(data).end();
    return sign.sign(privKey, 'hex');
  }

  static verifySignature(publicKey, data, signature) {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'hex');
  }
}

function SHA256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

class Block {
  constructor(index, transactions, timestamp, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp || Date.now();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    // Simplified hash function (in real-world, use SHA256)
    return SHA256(
      this.index + this.timestamp + this.previousHash + JSON.stringify(this.transactions) + this.nonce
    );
  }

  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== '0'.repeat(difficulty)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  // Proof of Stake method (simplified)
  validateBlock(stake) {
    // In a real PoS system, validation depends on the validator's stake and other factors
    // For simplicity, just check if validator has stake (no mining required for PoS)
    return stake > 0;
  }
}

class Blockchain {
  constructor(consensus = 'pos') {
    this.consensus = consensus; // 'pos', 'pow', or 'hybrid'
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.validatorStake = { 'default-validator': 1000 }; // Add default validator for testing
  }

  createGenesisBlock() {
    return new Block(0, [], Date.now(), '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    //basic transaction validation
    if (!transaction.sender || !transaction.receiver || transaction.amount <= 0) {
      throw new Error('Invalid transaction');
    }
    if (!transaction.isValid()) {
      throw new Error('Invalid transaction signature');
    }
    // Smart contract execution (if present)
    if (transaction.contract) {
      const { SmartContract } = require('./smartcontract');
      const contract = new SmartContract(transaction.contract);
      if (
        !contract.execute({
          sender: transaction.sender,
          receiver: transaction.receiver,
          amount: transaction.amount,
          blockchain: this
        })
      ) {
        throw new Error('Smart contract condition failed');
      }
    }
    this.pendingTransactions.push(transaction);
    blockchainEvents.emit('transaction', transaction);
  }

  getBalance(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.sender === address) balance -= tx.amount + (tx.fee || 0);
        if (tx.receiver === address) balance += tx.amount;
        // Block reward
        if (tx.sender === null && tx.receiver === address) balance += tx.amount;
      }
    }
    for (const tx of this.pendingTransactions) {
      if (tx.sender === address) balance -= tx.amount + (tx.fee || 0);
      if (tx.receiver === address) balance += tx.amount;
    }
    return balance;
  }

  getTransactionHistory(address) {
    let history = [];
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.sender === address || tx.receiver === address) {
          history.push(tx);
        }
      }
    }
    for (const tx of this.pendingTransactions) {
      if (tx.sender === address || tx.receiver === address) {
        history.push(tx);
      }
    }
    return history;
  }

  //selects the validator and validates the block.
  selectValidator() {
    let validators = Object.entries(this.validatorStake);
    if (validators.length === 0) {
      throw new Error('No validators available');
    }
    // Weighted random selection based on stake
    const totalStake = validators.reduce((sum, v) => sum + v[1], 0);
    let rand = Math.random() * totalStake;
    for (const [address, stake] of validators) {
      if (rand < stake) return address;
      rand -= stake;
    }
    return validators[validators.length - 1][0];
  }

  addValidatorStake(address, stake) {
    this.validatorStake[address] = stake;
  }

  slashValidator(address, reason) {
    if (this.validatorStake[address]) {
      this.validatorStake[address] = Math.floor(this.validatorStake[address] * 0.5); // Slash 50%
      console.log(`Validator ${address} slashed for: ${reason}`);
    }
  }

  createBlock(rewardAddress = null) {
    let validator;
    if (this.consensus === 'pow') {
      // Simple PoW: find a hash with leading zeros
      let nonce = 0;
      let block;
      const previousHash = this.getLatestBlock().hash;
      const index = this.chain.length;
      do {
        block = new Block(index, this.pendingTransactions, Date.now(), previousHash);
        block.nonce = nonce++;
        block.hash = block.calculateHash();
      } while (!block.hash.startsWith('00'));
      if (rewardAddress) {
        const rewardTx = new Transaction(null, rewardAddress, 10);
        block.transactions.push(rewardTx);
      }
      this.chain.push(block);
      this.pendingTransactions = [];
      blockchainEvents.emit('block', block);
      return block;
    } else {
      // PoS or hybrid
      validator = this.selectValidator();
      const previousHash = this.getLatestBlock().hash;
      const index = this.chain.length;
      const block = new Block(index, this.pendingTransactions, Date.now(), previousHash);
      if (!block.validateBlock(this.validatorStake[validator])) {
        throw new Error('Block validation failed');
      }
      if (rewardAddress) {
        const rewardTx = new Transaction(null, rewardAddress, 10);
        block.transactions.push(rewardTx);
      }
      this.chain.push(block);
      this.pendingTransactions = [];
      blockchainEvents.emit('block', block);
      return block;
    }
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

class Transaction {
  constructor(sender, receiver, amount, signature = null, fee = 0) {
    this.sender = sender;
    this.receiver = receiver;
    this.amount = amount;
    this.signature = signature;
    this.fee = fee;
  }

  signTransaction(privateKey) {
    const data = this.sender + this.receiver + this.amount;
    const sign = crypto.createSign('SHA256');
    sign.update(data).end();
    this.signature = sign.sign(privateKey, 'hex');
  }

  isValid() {
    if (this.sender === null) return true; // For genesis or reward tx
    if (!this.signature || !this.sender) return false;
    const data = this.sender + this.receiver + this.amount;
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(this.sender, this.signature, 'hex');
  }
}

// Export all classes
export { Blockchain, Block, Transaction, Wallet, SHA256 };
