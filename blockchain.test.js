const { Blockchain, Transaction, Wallet } = require('./blockchain');

describe('Blockchain', () => {
  let chain, wallet1, wallet2;
  beforeEach(() => {
    chain = new Blockchain();
    wallet1 = new Wallet();
    wallet2 = new Wallet();
    chain.addValidatorStake(wallet1.publicKey, 100);
    chain.addValidatorStake(wallet2.publicKey, 200);
  });

  it('should add and validate transactions', () => {
    const tx = new Transaction(wallet1.publicKey, wallet2.publicKey, 10);
    tx.signTransaction(wallet1.privateKey);
    chain.addTransaction(tx);
    expect(chain.pendingTransactions.length).toBe(1);
    expect(() =>
      chain.addTransaction(new Transaction(wallet1.publicKey, wallet2.publicKey, -5))
    ).toThrow();
  });

  it('should update balances after mining', () => {
    const tx = new Transaction(wallet1.publicKey, wallet2.publicKey, 10);
    tx.signTransaction(wallet1.privateKey);
    chain.addTransaction(tx);
    chain.createBlock();
    expect(chain.getBalance(wallet1.publicKey)).toBe(-10);
    expect(chain.getBalance(wallet2.publicKey)).toBe(10);
  });

  it('should detect tampering', () => {
    const tx = new Transaction(wallet1.publicKey, wallet2.publicKey, 10);
    tx.signTransaction(wallet1.privateKey);
    chain.addTransaction(tx);
    chain.createBlock();
    chain.chain[1].transactions[0].amount = 1000;
    expect(chain.isChainValid()).toBe(false);
  });
});
