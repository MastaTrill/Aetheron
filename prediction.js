// Prediction Market
class PredictionMarket {
  constructor() {
    this.markets = [];
  }

  createMarket(question, oracle) {
    const id = this.markets.length;
    this.markets.push({ id, question, oracle, bets: [], resolved: false, outcome: null });
    return id;
  }

  bet(marketId, user, outcome, amount) {
    this.markets[marketId].bets.push({ user, outcome, amount });
  }

  resolve(marketId, outcome) {
    this.markets[marketId].resolved = true;
    this.markets[marketId].outcome = outcome;
  }
}

module.exports = { PredictionMarket };
