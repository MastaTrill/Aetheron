// Simple smart contract support (scripted conditions)
class SmartContract {
  constructor(code) {
    this.code = code; // code as a JS function string
  }

  execute(context) {
    // context: { sender, receiver, amount, blockchain }
    // WARNING: eval is dangerous! In real blockchains, use a VM/sandbox.
    return eval(`(${this.code})`)(context);
  }
}

module.exports = { SmartContract };
