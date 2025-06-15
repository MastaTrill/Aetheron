// NFT Marketplace
class NFTMarketplace {
  constructor() {
    this.listings = []; // { tokenId, owner, price }
  }

  list(tokenId, owner, price) {
    this.listings.push({ tokenId, owner, price });
  }

  buy(tokenId, buyer) {
    const idx = this.listings.findIndex(l => l.tokenId === tokenId);
    if (idx === -1) throw new Error('Not listed');
    const listing = this.listings[idx];
    // Transfer logic would go here
    this.listings.splice(idx, 1);
    return { tokenId, from: listing.owner, to: buyer, price: listing.price };
  }
}

module.exports = { NFTMarketplace };
