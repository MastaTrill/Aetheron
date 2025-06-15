// Aetheron Blockchain Core Infrastructure (extracted from aethBLOCKCHAINCODE.txt)

// Use Node.js crypto for real SHA256
const crypto = require('crypto');
const { encrypt, decrypt } = require('./encryption');
const { ERC20Token, ERC721Token } = require('./tokens');
const { blockchainEvents } = require('./events');

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
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0; // Added for PoS
  }

  calculateHash() {
    // Simplified hash function (in real-world, use SHA256)
    return SHA256(this.timestamp + this.previousHash + JSON.stringify(this.transactions) + this.nonce);
  }

  // Proof of Stake method (simplified)
  validateBlock(stake) {
    // In a real PoS system, validation depends on the validator's stake and other factors
    return this.hash.startsWith("00") && stake > 0; // Example: Hash starts with "00" and validator has stake
  }
}

class Blockchain {
  constructor(consensus = 'pos') {
    this.consensus = consensus; // 'pos', 'pow', or 'hybrid'
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.validatorStake = {}; // { validatorAddress: stakeAmount }
  }

  createGenesisBlock() {
    return new Block(Date.now(), "Genesis Block", "0");
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
      if (!contract.execute({
        sender: transaction.sender,
        receiver: transaction.receiver,
        amount: transaction.amount,
        blockchain: this
      })) {
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
        if (tx.sender === address) balance -= (tx.amount + (tx.fee || 0));
        if (tx.receiver === address) balance += tx.amount;
        // Block reward
        if (tx.sender === null && tx.receiver === address) balance += tx.amount;
      }
    }
    for (const tx of this.pendingTransactions) {
      if (tx.sender === address) balance -= (tx.amount + (tx.fee || 0));
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
      do {
        block = new Block(Date.now(), this.pendingTransactions, previousHash);
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
      const block = new Block(Date.now(), this.pendingTransactions, previousHash);
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

// Example Usage
if (require.main === module) {
  // Create a new blockchain
  let Aetheron = new Blockchain();

  // Register some validators and their stakes
  Aetheron.addValidatorStake('validator1', 100);
  Aetheron.addValidatorStake('validator2', 200);

  // Create some transactions
Aetheron.addTransaction(new Transaction("address1", "address2", 10));
Aetheron.addTransaction(new Transaction("address3", "address4", 25));
  //create a new block
  let newBlock = Aetheron.createBlock();
  console.log("New Block", newBlock);

  // Validate the blockchain
  console.log("Is chain valid?", Aetheron.isChainValid());

  // Tamper with a block
  Aetheron.chain[1].transactions = [new Transaction("address1", "address5", 500)];
  console.log("Is chain valid after tampering?", Aetheron.isChainValid());  // Should now be false
}
