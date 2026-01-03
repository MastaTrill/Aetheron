// Unit tests for blockchain core functionality
const { Blockchain, Block, Transaction, Wallet } = require('../../blockchain');

describe('Blockchain Core', () => {
  let blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  describe('Block', () => {
    test('should create a valid block', () => {
      const block = new Block(1, [], Date.now());
      expect(block.index).toBe(1);
      expect(Array.isArray(block.transactions)).toBe(true);
      expect(block.hash).toBeTruthy();
    });

    test('should calculate correct hash', () => {
      const block = new Block(1, [], Date.now());
      const hash = block.calculateHash();
      expect(hash).toBe(block.hash);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 hex chars
    });

    test('should mine block with correct difficulty', () => {
      const block = new Block(1, [], Date.now());
      const difficulty = 2;
      block.mineBlock(difficulty);

      expect(block.hash.substring(0, difficulty)).toBe('0'.repeat(difficulty));
      expect(block.nonce).toBeGreaterThan(0);
    });
  });

  describe('Wallet', () => {
    test('should create wallet with keys', () => {
      const wallet = new Wallet();
      expect(wallet.publicKey).toBeTruthy();
      expect(wallet.privateKey).toBeTruthy();
    });

    test('should create encrypted wallet', () => {
      const wallet = new Wallet('password123');
      expect(wallet.encrypted).toBe(true);
      expect(wallet.privateKey).toBeTruthy();
    });

    test('should sign transaction', () => {
      const wallet = new Wallet();
      const data = 'test transaction data';
      const signature = wallet.sign(data);

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
    });

    test('should verify signature', () => {
      const wallet = new Wallet();
      const data = 'test transaction data';
      const signature = wallet.sign(data);

      const isValid = Wallet.verifySignature(wallet.publicKey, data, signature);
      expect(isValid).toBe(true);
    });

    test('should fail invalid signature', () => {
      const wallet = new Wallet();
      const data = 'test transaction data';
      const signature = wallet.sign(data);

      const isValid = Wallet.verifySignature(wallet.publicKey, 'different data', signature);
      expect(isValid).toBe(false);
    });
  });

  describe('Transaction', () => {
    let wallet;

    beforeEach(() => {
      wallet = new Wallet();
    });

    test('should create valid transaction', () => {
      const tx = new Transaction(wallet.publicKey, 'receiver_address', 100, null, 1);

      expect(tx.sender).toBe(wallet.publicKey);
      expect(tx.receiver).toBe('receiver_address');
      expect(tx.amount).toBe(100);
      expect(tx.fee).toBe(1);
    });

    test('should sign transaction', () => {
      const tx = new Transaction(wallet.publicKey, 'receiver', 100);
      tx.signTransaction(wallet.privateKey);

      expect(tx.signature).toBeTruthy();
    });

    test('should validate signed transaction', () => {
      const tx = new Transaction(wallet.publicKey, 'receiver', 100);
      tx.signTransaction(wallet.privateKey);

      expect(tx.isValid()).toBe(true);
    });

    test('should reject tampered transaction', () => {
      const tx = new Transaction(wallet.publicKey, 'receiver', 100);
      tx.signTransaction(wallet.privateKey);

      // Tamper with amount
      tx.amount = 200;

      expect(tx.isValid()).toBe(false);
    });
  });

  describe('Blockchain', () => {
    test('should initialize with genesis block', () => {
      expect(blockchain.chain.length).toBe(1);
      expect(blockchain.chain[0].index).toBe(0);
    });

    test('should add valid transaction', () => {
      const wallet = new Wallet();
      const tx = new Transaction(wallet.publicKey, 'receiver', 50);
      tx.signTransaction(wallet.privateKey);

      blockchain.addTransaction(tx);
      expect(blockchain.pendingTransactions.length).toBeGreaterThan(0);
    });

    test('should reject invalid transaction', () => {
      const tx = new Transaction('sender', 'receiver', 50);
      // Not signed

      expect(() => blockchain.addTransaction(tx)).toThrow();
    });

    test('should mine block with pending transactions', () => {
      const wallet = new Wallet();
      const tx = new Transaction(wallet.publicKey, 'receiver', 50);
      tx.signTransaction(wallet.privateKey);

      blockchain.addTransaction(tx);
      const initialLength = blockchain.chain.length;

      blockchain.createBlock('miner_address');
      expect(blockchain.chain.length).toBe(initialLength + 1);
      expect(blockchain.pendingTransactions.length).toBe(0);
    });

    test('should calculate balance correctly', () => {
      const wallet1 = new Wallet();

      // Add reward to wallet1
      blockchain.createBlock(wallet1.publicKey);

      const balance = blockchain.getBalance(wallet1.publicKey);
      expect(balance).toBeGreaterThan(0);
    });

    test('should validate chain', () => {
      expect(blockchain.isChainValid()).toBe(true);
    });

    test('should detect tampered chain', () => {
      const wallet = new Wallet();
      const tx = new Transaction(wallet.publicKey, 'receiver', 50);
      tx.signTransaction(wallet.privateKey);

      blockchain.addTransaction(tx);
      blockchain.createBlock('miner');

      // Tamper with block
      blockchain.chain[1].transactions[0].amount = 999;

      expect(blockchain.isChainValid()).toBe(false);
    });
  });
});
