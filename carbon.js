// Energy/Carbon Credit Marketplace
class CarbonMarket {
  constructor() {
    this.credits = [];
  }

  issueCredit(address, amount) {
    this.credits.push({ address, amount, used: false });
  }

  transferCredit(from, to, amount) {
    const idx = this.credits.findIndex(c => c.address === from && !c.used && c.amount >= amount);
    if (idx === -1) throw new Error('No available credit');
    this.credits[idx].address = to;
  }
}

module.exports = { CarbonMarket };
