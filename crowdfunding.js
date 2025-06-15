// Charity & Crowdfunding Platform
class Crowdfunding {
  constructor() {
    this.campaigns = [];
  }

  createCampaign(owner, goal) {
    const id = this.campaigns.length;
    this.campaigns.push({ id, owner, goal, raised: 0, donors: [] });
    return id;
  }

  donate(id, donor, amount) {
    const campaign = this.campaigns[id];
    campaign.raised += amount;
    campaign.donors.push({ donor, amount });
  }
}

module.exports = { Crowdfunding };
