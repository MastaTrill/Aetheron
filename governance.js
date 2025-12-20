// On-chain Governance (Proposals & Voting)
class Governance {
  constructor() {
    this.proposals = [];
    this.votes = {}; // proposalId => { voter: vote }
  }

  propose(description) {
    const id = this.proposals.length;
    this.proposals.push({ id, description, status: 'open', votes: {} });
    return id;
  }

  vote(proposalId, voter, support) {
    const proposal = this.proposals[proposalId];
    if (!proposal || proposal.status !== 'open') throw new Error('Invalid proposal');
    proposal.votes[voter] = support;
  }

  tally(proposalId) {
    const proposal = this.proposals[proposalId];
    if (!proposal) throw new Error('Invalid proposal');
    let yes = 0,
      no = 0;
    for (const v in proposal.votes) {
      if (proposal.votes[v]) yes++;
      else no++;
    }
    return { yes, no };
  }

  close(proposalId) {
    const proposal = this.proposals[proposalId];
    proposal.status = 'closed';
  }
}

module.exports = { Governance };
