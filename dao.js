// DAO Platform
class DAO {
  constructor() {
    this.treasury = 0;
    this.members = new Set();
    this.proposals = [];
  }

  addMember(address) {
    this.members.add(address);
  }

  propose(description) {
    const id = this.proposals.length;
    this.proposals.push({ id, description, votes: {}, status: 'open' });
    return id;
  }

  vote(id, member, support) {
    if (!this.members.has(member)) throw new Error('Not a member');
    this.proposals[id].votes[member] = support;
  }
}

module.exports = { DAO };
