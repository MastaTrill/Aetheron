// Simple smart contract support (safe callable conditions only)
class SmartContract {
  constructor(code) {
    this.code = code;
  }

  execute(context) {
    // context: { sender, receiver, amount, blockchain }
    if (typeof this.code !== 'function') {
      throw new Error('String-based smart contract execution is disabled. Provide a callable function instead.');
    }

    return this.code(context);
  }
}

module.exports = { SmartContract };
