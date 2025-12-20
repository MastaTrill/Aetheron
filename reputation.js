// Decentralized Identity & Reputation
class Reputation {
  constructor() {
    this.scores = {}; // address => score
  }

  addScore(address, delta) {
    this.scores[address] = (this.scores[address] || 0) + delta;
  }

  getScore(address) {
    return this.scores[address] || 0;
  }
}

module.exports = { Reputation };
