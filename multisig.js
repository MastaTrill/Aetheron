// Multi-signature Wallet
const crypto = require('crypto');

class MultiSigWallet {
  constructor(owners, required) {
    this.owners = owners; // array of public keys
    this.required = required; // number of required signatures
    this.transactions = [];
  }

  proposeTransaction(tx) {
    tx.signatures = [];
    this.transactions.push(tx);
    return this.transactions.length - 1;
  }

  signTransaction(index, privateKey) {
    const tx = this.transactions[index];
    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(tx)).end();
    const signature = sign.sign(privateKey, 'hex');
    tx.signatures.push(signature);
  }

  isApproved(index) {
    const tx = this.transactions[index];
    return tx.signatures.length >= this.required;
  }
}

module.exports = { MultiSigWallet };
