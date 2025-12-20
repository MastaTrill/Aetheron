// Automated Compliance Tools (KYC/AML)
class Compliance {
  constructor() {
    this.kyc = {}; // address => status
  }

  setKYC(address, status) {
    this.kyc[address] = status;
  }

  isCompliant(address) {
    return !!this.kyc[address];
  }
}

module.exports = { Compliance };
