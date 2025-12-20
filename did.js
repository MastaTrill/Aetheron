// Decentralized Identity (DID) Registry
class DIDRegistry {
  constructor() {
    this.dids = {}; // address => { did, metadata }
  }

  register(address, did, metadata = {}) {
    this.dids[address] = { did, metadata };
  }

  getDID(address) {
    return this.dids[address] || null;
  }
}

module.exports = { DIDRegistry };
