/**
 * Advanced NFT Marketplace
 * Auctions, offers, rarity ranking, and advanced trading features
 */

const crypto = require('crypto');

/**
 * NFT Auction System
 */
class NFTAuction {
  constructor() {
    this.auctions = new Map();
    this.bids = new Map();
  }

  /**
   * Create auction
   */
  createAuction(tokenId, seller, config) {
    const auctionId = crypto.randomBytes(16).toString('hex');

    const auction = {
      id: auctionId,
      tokenId,
      seller,
      startPrice: config.startPrice,
      reservePrice: config.reservePrice || 0,
      currentBid: config.startPrice,
      highestBidder: null,
      startTime: config.startTime || Date.now(),
      endTime: config.endTime,
      duration: config.duration || 86400000, // 24 hours
      type: config.type || 'english', // english, dutch, sealed-bid
      status: 'active',
      bidCount: 0,
      createdAt: Date.now()
    };

    this.auctions.set(auctionId, auction);
    this.bids.set(auctionId, []);

    return auction;
  }

  /**
   * Place bid
   */
  placeBid(auctionId, bidder, amount) {
    const auction = this.auctions.get(auctionId);

    if (!auction) throw new Error('Auction not found');
    if (auction.status !== 'active') throw new Error('Auction not active');
    if (Date.now() > auction.endTime) throw new Error('Auction ended');
    if (amount <= auction.currentBid) throw new Error('Bid too low');
    if (bidder === auction.seller) throw new Error('Seller cannot bid');

    const bid = {
      id: crypto.randomBytes(16).toString('hex'),
      auctionId,
      bidder,
      amount,
      timestamp: Date.now()
    };

    // Update auction
    auction.currentBid = amount;
    auction.highestBidder = bidder;
    auction.bidCount++;

    // Store bid
    const auctionBids = this.bids.get(auctionId);
    auctionBids.push(bid);

    return {
      success: true,
      bid,
      auction
    };
  }

  /**
   * End auction
   */
  endAuction(auctionId) {
    const auction = this.auctions.get(auctionId);

    if (!auction) throw new Error('Auction not found');
    if (auction.status !== 'active') throw new Error('Auction already ended');

    // Check if reserve met
    if (auction.currentBid < auction.reservePrice) {
      auction.status = 'reserve-not-met';
      return { success: false, reason: 'Reserve price not met' };
    }

    auction.status = 'ended';
    auction.endedAt = Date.now();
    auction.winner = auction.highestBidder;

    return {
      success: true,
      winner: auction.winner,
      finalPrice: auction.currentBid,
      auction
    };
  }

  /**
   * Get auction details
   */
  getAuction(auctionId) {
    return this.auctions.get(auctionId);
  }

  /**
   * Get auction bids
   */
  getAuctionBids(auctionId) {
    return this.bids.get(auctionId) || [];
  }
}

/**
 * NFT Offer System
 */
class NFTOfferSystem {
  constructor() {
    this.offers = new Map();
    this.nftOffers = new Map(); // Track offers per NFT
  }

  /**
   * Create offer
   */
  createOffer(tokenId, buyer, amount, expiration) {
    const offerId = crypto.randomBytes(16).toString('hex');

    const offer = {
      id: offerId,
      tokenId,
      buyer,
      amount,
      expiration: expiration || Date.now() + 604800000, // 7 days
      status: 'active',
      createdAt: Date.now()
    };

    this.offers.set(offerId, offer);

    // Track by NFT
    if (!this.nftOffers.has(tokenId)) {
      this.nftOffers.set(tokenId, []);
    }
    this.nftOffers.get(tokenId).push(offerId);

    return offer;
  }

  /**
   * Accept offer
   */
  acceptOffer(offerId, seller) {
    const offer = this.offers.get(offerId);

    if (!offer) throw new Error('Offer not found');
    if (offer.status !== 'active') throw new Error('Offer not active');
    if (Date.now() > offer.expiration) throw new Error('Offer expired');

    offer.status = 'accepted';
    offer.seller = seller;
    offer.acceptedAt = Date.now();

    return {
      success: true,
      offer,
      buyer: offer.buyer,
      amount: offer.amount
    };
  }

  /**
   * Cancel offer
   */
  cancelOffer(offerId, buyer) {
    const offer = this.offers.get(offerId);

    if (!offer) throw new Error('Offer not found');
    if (offer.buyer !== buyer) throw new Error('Not offer owner');

    offer.status = 'cancelled';
    offer.cancelledAt = Date.now();

    return { success: true };
  }

  /**
   * Get offers for NFT
   */
  getOffersForNFT(tokenId) {
    const offerIds = this.nftOffers.get(tokenId) || [];
    return offerIds
      .map((id) => this.offers.get(id))
      .filter((offer) => offer.status === 'active' && Date.now() < offer.expiration)
      .sort((a, b) => b.amount - a.amount);
  }
}

/**
 * Rarity Ranking System
 */
class RarityRanking {
  constructor() {
    this.collections = new Map();
    this.rarityScores = new Map();
  }

  /**
   * Calculate rarity for collection
   */
  calculateCollectionRarity(collectionId, nfts) {
    const traitCounts = new Map();
    const totalNFTs = nfts.length;

    // Count trait occurrences
    for (const nft of nfts) {
      for (const [trait, value] of Object.entries(nft.attributes)) {
        const key = `${trait}:${value}`;
        traitCounts.set(key, (traitCounts.get(key) || 0) + 1);
      }
    }

    // Calculate rarity scores
    for (const nft of nfts) {
      let rarityScore = 0;

      for (const [trait, value] of Object.entries(nft.attributes)) {
        const key = `${trait}:${value}`;
        const count = traitCounts.get(key);
        const rarity = 1 / (count / totalNFTs);
        rarityScore += rarity;
      }

      this.rarityScores.set(nft.tokenId, {
        tokenId: nft.tokenId,
        rarityScore,
        rank: 0 // Will be calculated after sorting
      });
    }

    // Rank NFTs
    const sorted = Array.from(this.rarityScores.values())
      .filter((item) => nfts.find((n) => n.tokenId === item.tokenId))
      .sort((a, b) => b.rarityScore - a.rarityScore);

    sorted.forEach((item, index) => {
      item.rank = index + 1;
      item.percentile = ((totalNFTs - index) / totalNFTs) * 100;
    });

    this.collections.set(collectionId, {
      totalNFTs,
      traitCounts,
      updatedAt: Date.now()
    });

    return sorted;
  }

  /**
   * Get NFT rarity
   */
  getRarity(tokenId) {
    return this.rarityScores.get(tokenId);
  }

  /**
   * Get rarest NFTs in collection
   */
  getRarestNFTs(collectionId, limit = 10) {
    return Array.from(this.rarityScores.values())
      .sort((a, b) => b.rarityScore - a.rarityScore)
      .slice(0, limit);
  }
}

/**
 * Bundle System (Buy multiple NFTs together)
 */
class NFTBundle {
  constructor() {
    this.bundles = new Map();
  }

  /**
   * Create bundle
   */
  createBundle(tokenIds, seller, price, name) {
    const bundleId = crypto.randomBytes(16).toString('hex');

    const bundle = {
      id: bundleId,
      name,
      tokenIds,
      seller,
      price,
      discount: 0,
      status: 'active',
      createdAt: Date.now()
    };

    this.bundles.set(bundleId, bundle);
    return bundle;
  }

  /**
   * Buy bundle
   */
  buyBundle(bundleId, buyer) {
    const bundle = this.bundles.get(bundleId);

    if (!bundle) throw new Error('Bundle not found');
    if (bundle.status !== 'active') throw new Error('Bundle not active');

    bundle.status = 'sold';
    bundle.buyer = buyer;
    bundle.soldAt = Date.now();

    return {
      success: true,
      bundle,
      tokenIds: bundle.tokenIds
    };
  }
}

/**
 * NFT Loan System (Collateralized loans)
 */
class NFTLoan {
  constructor() {
    this.loans = new Map();
  }

  /**
   * Request loan
   */
  requestLoan(tokenId, borrower, amount, duration, interestRate) {
    const loanId = crypto.randomBytes(16).toString('hex');

    const loan = {
      id: loanId,
      tokenId,
      borrower,
      lender: null,
      amount,
      duration,
      interestRate,
      startTime: null,
      endTime: null,
      status: 'pending',
      repaid: false,
      createdAt: Date.now()
    };

    this.loans.set(loanId, loan);
    return loan;
  }

  /**
   * Fund loan
   */
  fundLoan(loanId, lender) {
    const loan = this.loans.get(loanId);

    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'pending') throw new Error('Loan not available');

    loan.lender = lender;
    loan.status = 'active';
    loan.startTime = Date.now();
    loan.endTime = Date.now() + loan.duration;

    return {
      success: true,
      loan,
      amount: loan.amount
    };
  }

  /**
   * Repay loan
   */
  repayLoan(loanId, borrower) {
    const loan = this.loans.get(loanId);

    if (!loan) throw new Error('Loan not found');
    if (loan.borrower !== borrower) throw new Error('Not loan borrower');
    if (loan.status !== 'active') throw new Error('Loan not active');

    const interest = (loan.amount * loan.interestRate) / 100;
    const totalDue = loan.amount + interest;

    loan.status = 'repaid';
    loan.repaid = true;
    loan.repaidAt = Date.now();

    return {
      success: true,
      principal: loan.amount,
      interest,
      totalDue
    };
  }

  /**
   * Liquidate loan
   */
  liquidateLoan(loanId) {
    const loan = this.loans.get(loanId);

    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'active') throw new Error('Loan not active');
    if (Date.now() < loan.endTime) throw new Error('Loan not defaulted');

    loan.status = 'liquidated';
    loan.liquidatedAt = Date.now();

    return {
      success: true,
      tokenId: loan.tokenId,
      newOwner: loan.lender
    };
  }
}

/**
 * Advanced NFT Marketplace Manager
 */
class AdvancedNFTMarketplace {
  constructor() {
    this.auctions = new NFTAuction();
    this.offers = new NFTOfferSystem();
    this.rarity = new RarityRanking();
    this.bundles = new NFTBundle();
    this.loans = new NFTLoan();
    this.listings = new Map();
    this.sales = new Map();
  }

  /**
   * List NFT for sale
   */
  listNFT(tokenId, seller, price, options = {}) {
    const listingId = crypto.randomBytes(16).toString('hex');

    const listing = {
      id: listingId,
      tokenId,
      seller,
      price,
      currency: options.currency || 'AETH',
      status: 'active',
      views: 0,
      favorites: 0,
      createdAt: Date.now()
    };

    this.listings.set(listingId, listing);
    return listing;
  }

  /**
   * Buy NFT
   */
  buyNFT(listingId, buyer) {
    const listing = this.listings.get(listingId);

    if (!listing) throw new Error('Listing not found');
    if (listing.status !== 'active') throw new Error('Listing not active');

    listing.status = 'sold';
    listing.buyer = buyer;
    listing.soldAt = Date.now();

    const saleId = crypto.randomBytes(16).toString('hex');
    this.sales.set(saleId, {
      id: saleId,
      listingId,
      tokenId: listing.tokenId,
      seller: listing.seller,
      buyer,
      price: listing.price,
      timestamp: Date.now()
    });

    return {
      success: true,
      sale: this.sales.get(saleId),
      tokenId: listing.tokenId
    };
  }

  /**
   * Get marketplace stats
   */
  getStats() {
    const activeListings = Array.from(this.listings.values()).filter((l) => l.status === 'active');
    const totalSales = this.sales.size;
    const totalVolume = Array.from(this.sales.values()).reduce((sum, s) => sum + s.price, 0);
    const activeAuctions = Array.from(this.auctions.auctions.values()).filter(
      (a) => a.status === 'active'
    );

    return {
      activeListings: activeListings.length,
      totalSales,
      totalVolume,
      averagePrice: totalSales > 0 ? totalVolume / totalSales : 0,
      activeAuctions: activeAuctions.length,
      floorPrice: Math.min(...activeListings.map((l) => l.price))
    };
  }

  /**
   * Search NFTs
   */
  searchNFTs(filters) {
    let results = Array.from(this.listings.values()).filter((l) => l.status === 'active');

    if (filters.minPrice) {
      results = results.filter((l) => l.price >= filters.minPrice);
    }

    if (filters.maxPrice) {
      results = results.filter((l) => l.price <= filters.maxPrice);
    }

    if (filters.sortBy === 'price-asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'recent') {
      results.sort((a, b) => b.createdAt - a.createdAt);
    }

    return results.slice(0, filters.limit || 20);
  }
}

module.exports = {
  NFTAuction,
  NFTOfferSystem,
  RarityRanking,
  NFTBundle,
  NFTLoan,
  AdvancedNFTMarketplace
};
