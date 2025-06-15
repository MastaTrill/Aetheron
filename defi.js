// DeFi Lending/Borrowing
class DeFiLending {
  constructor() {
    this.loans = [];
  }

  lend(lender, borrower, amount, collateral) {
    this.loans.push({ lender, borrower, amount, collateral, repaid: false });
  }

  repay(index) {
    this.loans[index].repaid = true;
  }
}

module.exports = { DeFiLending };
