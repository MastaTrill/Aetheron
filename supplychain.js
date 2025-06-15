// Supply Chain Tracking
class SupplyChain {
  constructor() {
    this.items = []; // { id, owner, status, history }
  }

  addItem(id, owner, status) {
    this.items.push({ id, owner, status, history: [{ status, timestamp: Date.now() }] });
  }

  updateStatus(id, status) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.status = status;
      item.history.push({ status, timestamp: Date.now() });
    }
  }
}

module.exports = { SupplyChain };
