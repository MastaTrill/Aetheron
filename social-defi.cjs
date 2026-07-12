/**
 * Social DeFi System - Combining Social Features with DeFi Capabilities
 * Features: Social trading, community pools, reputation-based lending, social mining
 */

const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Social Trading System
 */
class SocialTradingSystem extends EventEmitter {
  constructor(blockchain, defi) {
    super();
    this.blockchain = blockchain;
    this.defi = defi;
    this.socialTrades = new Map();
    this.traderProfiles = new Map();
    this.followers = new Map();
    this.portfolioShares = new Map();
    this.socialSignals = new Map();
  }

  /**
   * Create trader profile
   */
  async createTraderProfile(userAddress, profileData) {
    const profileId = `PROFILE_${crypto.randomBytes(8).toString('hex')}`;

    const profile = {
      id: profileId,
      address: userAddress,
      displayName: profileData.displayName || `Trader_${userAddress.slice(-6)}`,
      bio: profileData.bio || '',
      avatar: profileData.avatar || '',
      specialization: profileData.specialization || [], // ['DeFi', 'NFT', 'Gaming']
      riskTolerance: profileData.riskTolerance || 'moderate',
      tradingStyle: profileData.tradingStyle || 'swing',
      winRate: 0,
      totalTrades: 0,
      totalPnL: 0,
      followersCount: 0,
      followingCount: 0,
      reputationScore: 100, // Starting reputation
      badges: [],
      achievements: [],
      createdAt: Date.now(),
      lastActive: Date.now(),
      isVerified: false,
      socialStats: {
        postsCount: 0,
        likesReceived: 0,
        commentsReceived: 0,
        sharesReceived: 0
      }
    };

    this.traderProfiles.set(userAddress, profile);
    this.followers.set(userAddress, new Set());

    return profile;
  }

  /**
   * Follow trader
   */
  async followTrader(followerAddress, traderAddress) {
    if (followerAddress === traderAddress) {
      throw new Error('Cannot follow yourself');
    }

    const traderProfile = this.traderProfiles.get(traderAddress);
    if (!traderProfile) throw new Error('Trader profile not found');

    const followerSet = this.followers.get(traderAddress) || new Set();
    followerSet.add(followerAddress);
    this.followers.set(traderAddress, followerSet);

    traderProfile.followersCount = followerSet.size;

    // Update follower's following count
    const followerProfile = this.traderProfiles.get(followerAddress);
    if (followerProfile) {
      followerProfile.followingCount++;
    }

    this.emit('traderFollowed', { follower: followerAddress, trader: traderAddress });

    return {
      success: true,
      trader: traderAddress,
      followersCount: traderProfile.followersCount
    };
  }

  /**
   * Share portfolio publicly
   */
  async sharePortfolio(userAddress, portfolioData, visibility = 'followers') {
    const profile = this.traderProfiles.get(userAddress);
    if (!profile) throw new Error('Profile not found');

    const shareId = `SHARE_${crypto.randomBytes(8).toString('hex')}`;

    const portfolioShare = {
      id: shareId,
      userAddress,
      portfolio: portfolioData, // { assets: [], totalValue: 0, performance: {} }
      visibility, // 'public', 'followers', 'private'
      timestamp: Date.now(),
      likes: new Set(),
      comments: [],
      shares: 0,
      views: 0
    };

    this.portfolioShares.set(shareId, portfolioShare);
    profile.socialStats.postsCount++;

    // Notify followers if visibility allows
    if (visibility === 'public' || visibility === 'followers') {
      this.notifyFollowers(userAddress, {
        type: 'portfolio_shared',
        shareId,
        message: `${profile.displayName} shared their portfolio`
      });
    }

    return portfolioShare;
  }

  /**
   * Copy trade signal
   */
  async copyTradeSignal(signalId, copierAddress) {
    const signal = this.socialSignals.get(signalId);
    if (!signal) throw new Error('Signal not found');

    const copierProfile = this.traderProfiles.get(copierAddress);
    if (!copierProfile) throw new Error('Copier profile not found');

    // Execute the trade for the copier
    const tradeResult = await this.executeCopiedTrade(signal, copierAddress);

    // Record the copy trade
    const copyRecord = {
      signalId,
      copierAddress,
      originalTrader: signal.traderAddress,
      tradeType: signal.tradeType,
      asset: signal.asset,
      amount: signal.amount,
      executedAt: Date.now(),
      status: tradeResult.success ? 'executed' : 'failed',
      txHash: tradeResult.txHash
    };

    signal.copies = signal.copies || [];
    signal.copies.push(copyRecord);

    this.emit('tradeCopied', copyRecord);

    return copyRecord;
  }

  /**
   * Create social trade signal
   */
  async createTradeSignal(traderAddress, signalData) {
    const profile = this.traderProfiles.get(traderAddress);
    if (!profile) throw new Error('Profile not found');

    const signalId = `SIGNAL_${crypto.randomBytes(8).toString('hex')}`;

    const signal = {
      id: signalId,
      traderAddress,
      tradeType: signalData.tradeType, // 'buy', 'sell', 'swap'
      asset: signalData.asset,
      amount: signalData.amount,
      price: signalData.price,
      reasoning: signalData.reasoning,
      confidence: signalData.confidence || 50, // 0-100
      riskLevel: signalData.riskLevel || 'medium',
      timeframe: signalData.timeframe || 'swing', // 'scalping', 'day', 'swing', 'position'
      timestamp: Date.now(),
      likes: new Set(),
      comments: [],
      copies: [],
      performance: null // Will be updated when trade closes
    };

    this.socialSignals.set(signalId, signal);

    // Notify followers
    this.notifyFollowers(traderAddress, {
      type: 'trade_signal',
      signalId,
      message: `${profile.displayName} created a ${signal.tradeType} signal for ${signal.asset}`
    });

    return signal;
  }

  /**
   * Update trade performance
   */
  async updateTradePerformance(signalId, performanceData) {
    const signal = this.socialSignals.get(signalId);
    if (!signal) return;

    signal.performance = {
      ...performanceData,
      updatedAt: Date.now()
    };

    // Update trader reputation based on performance
    const traderProfile = this.traderProfiles.get(signal.traderAddress);
    if (traderProfile && signal.performance.pnl !== undefined) {
      traderProfile.totalPnL += signal.performance.pnl;
      traderProfile.totalTrades++;

      if (signal.performance.pnl > 0) {
        traderProfile.winRate = ((traderProfile.winRate * (traderProfile.totalTrades - 1)) + 1) / traderProfile.totalTrades;
      } else {
        traderProfile.winRate = (traderProfile.winRate * (traderProfile.totalTrades - 1)) / traderProfile.totalTrades;
      }

      // Update reputation score
      traderProfile.reputationScore = this.calculateReputationScore(traderProfile);
    }
  }

  /**
   * Calculate reputation score
   */
  calculateReputationScore(profile) {
    let score = 100; // Base score

    // Win rate bonus (max +50)
    score += Math.min(50, profile.winRate * 50);

    // Experience bonus (max +30)
    const experienceMonths = (Date.now() - profile.createdAt) / (30 * 24 * 60 * 60 * 1000);
    score += Math.min(30, experienceMonths * 2);

    // Social engagement bonus (max +20)
    const engagementScore = Math.min(20, (profile.socialStats.likesReceived + profile.socialStats.commentsReceived) / 10);
    score += engagementScore;

    // Followers bonus (max +25)
    score += Math.min(25, Math.log10(profile.followersCount + 1) * 10);

    return Math.max(0, Math.min(300, score));
  }

  /**
   * Get trader leaderboard
   */
  getTraderLeaderboard(criteria = 'reputation', limit = 50) {
    const profiles = Array.from(this.traderProfiles.values());

    const sorted = profiles.sort((a, b) => {
      switch (criteria) {
      case 'reputation':
        return b.reputationScore - a.reputationScore;
      case 'winRate':
        return b.winRate - a.winRate;
      case 'followers':
        return b.followersCount - a.followersCount;
      case 'pnl':
        return b.totalPnL - a.totalPnL;
      default:
        return b.reputationScore - a.reputationScore;
      }
    });

    return sorted.slice(0, limit);
  }

  /**
   * Notify followers
   */
  notifyFollowers(traderAddress, notification) {
    const followers = this.followers.get(traderAddress) || new Set();

    for (const follower of followers) {
      this.emit('notification', {
        recipient: follower,
        ...notification
      });
    }
  }

  /**
   * Execute copied trade (mock)
   */
  async executeCopiedTrade(signal, copierAddress) {
    // Simulate trade execution
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: Math.random() > 0.1, // 90% success rate
      txHash: `0x${crypto.randomBytes(32).toString('hex')}`
    };
  }
}

/**
 * Community Pool System
 */
class CommunityPoolSystem extends EventEmitter {
  constructor(blockchain, defi) {
    super();
    this.blockchain = blockchain;
    this.defi = defi;
    this.communityPools = new Map();
    this.poolMemberships = new Map();
    this.poolContributions = new Map();
    this.poolStrategies = new Map();
  }

  /**
   * Create community pool
   */
  async createCommunityPool(creatorAddress, poolConfig) {
    const poolId = `POOL_${crypto.randomBytes(8).toString('hex')}`;

    const pool = {
      id: poolId,
      name: poolConfig.name,
      description: poolConfig.description,
      creator: creatorAddress,
      strategy: poolConfig.strategy, // 'conservative', 'balanced', 'aggressive', 'custom'
      minContribution: poolConfig.minContribution || 0.1,
      maxMembers: poolConfig.maxMembers || 100,
      votingThreshold: poolConfig.votingThreshold || 51, // % needed to pass proposals
      autoRebalance: poolConfig.autoRebalance !== false,
      isPrivate: poolConfig.isPrivate || false,
      joinCode: poolConfig.isPrivate ? crypto.randomBytes(6).toString('hex') : null,

      // Pool metrics
      totalValue: 0,
      memberCount: 0,
      performance: {
        totalReturn: 0,
        monthlyReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      },

      // Governance
      proposals: [],
      activeProposals: [],

      // Assets and allocations
      assets: new Map(), // asset -> amount
      allocations: new Map(), // asset -> percentage

      createdAt: Date.now(),
      lastRebalance: Date.now()
    };

    this.communityPools.set(poolId, pool);
    this.poolMemberships.set(poolId, new Map());
    this.poolContributions.set(poolId, new Map());

    // Creator automatically joins
    await this.joinPool(creatorAddress, poolId);

    return pool;
  }

  /**
   * Join community pool
   */
  async joinPool(memberAddress, poolId, initialContribution = 0) {
    const pool = this.communityPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    if (pool.isPrivate && !pool.joinCode) {
      throw new Error('Private pool requires join code');
    }

    if (pool.memberCount >= pool.maxMembers) {
      throw new Error('Pool is full');
    }

    const memberships = this.poolMemberships.get(poolId);
    if (memberships.has(memberAddress)) {
      throw new Error('Already a member of this pool');
    }

    // Add member
    memberships.set(memberAddress, {
      joinedAt: Date.now(),
      contribution: initialContribution,
      sharePercentage: 0, // Will be calculated after contribution
      votingPower: 0,
      rewards: 0
    });

    pool.memberCount++;

    // Process initial contribution if provided
    if (initialContribution > 0) {
      await this.contributeToPool(memberAddress, poolId, initialContribution);
    }

    this.emit('poolJoined', { member: memberAddress, poolId });

    return {
      success: true,
      poolId,
      memberCount: pool.memberCount
    };
  }

  /**
   * Contribute to pool
   */
  async contributeToPool(memberAddress, poolId, amount) {
    const pool = this.communityPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    const memberships = this.poolMemberships.get(poolId);
    const memberInfo = memberships.get(memberAddress);
    if (!memberInfo) throw new Error('Not a pool member');

    // Update member contribution
    memberInfo.contribution += amount;
    pool.totalValue += amount;

    // Recalculate share percentages for all members
    const totalContributions = Array.from(memberships.values())
      .reduce((sum, member) => sum + member.contribution, 0);

    for (const [address, info] of memberships) {
      info.sharePercentage = (info.contribution / totalContributions) * 100;
      info.votingPower = info.sharePercentage; // Voting power = share percentage
    }

    // Record contribution
    const contributions = this.poolContributions.get(poolId) || [];
    contributions.push({
      member: memberAddress,
      amount,
      timestamp: Date.now(),
      txHash: `0x${crypto.randomBytes(32).toString('hex')}`
    });
    this.poolContributions.set(poolId, contributions);

    this.emit('poolContribution', { member: memberAddress, poolId, amount });

    return {
      success: true,
      newContribution: memberInfo.contribution,
      sharePercentage: memberInfo.sharePercentage
    };
  }

  /**
   * Create pool proposal
   */
  async createProposal(proposerAddress, poolId, proposalData) {
    const pool = this.communityPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    const memberships = this.poolMemberships.get(poolId);
    const proposerInfo = memberships.get(proposerAddress);
    if (!proposerInfo) throw new Error('Not a pool member');

    const proposalId = `PROP_${poolId}_${crypto.randomBytes(8).toString('hex')}`;

    const proposal = {
      id: proposalId,
      poolId,
      proposer: proposerAddress,
      title: proposalData.title,
      description: proposalData.description,
      type: proposalData.type, // 'strategy_change', 'asset_allocation', 'withdrawal', 'member_kick'
      changes: proposalData.changes,
      votingPeriod: proposalData.votingPeriod || (7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: Date.now(),
      expiresAt: Date.now() + (proposalData.votingPeriod || (7 * 24 * 60 * 60 * 1000)),

      // Voting
      votes: new Map(), // address -> {choice, votingPower}
      totalVotingPower: 0,
      votesFor: 0,
      votesAgainst: 0,
      status: 'active'
    };

    pool.proposals.push(proposalId);
    pool.activeProposals.push(proposalId);

    this.emit('proposalCreated', { proposalId, poolId, proposer: proposerAddress });

    return proposal;
  }

  /**
   * Vote on proposal
   */
  async voteOnProposal(voterAddress, proposalId, choice) {
    const proposal = this.getProposalById(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const pool = this.communityPools.get(proposal.poolId);
    const memberships = this.poolMemberships.get(proposal.poolId);
    const voterInfo = memberships.get(voterAddress);

    if (!voterInfo) throw new Error('Not a pool member');
    if (Date.now() > proposal.expiresAt) throw new Error('Voting period ended');
    if (proposal.votes.has(voterAddress)) throw new Error('Already voted');

    // Record vote
    proposal.votes.set(voterAddress, {
      choice,
      votingPower: voterInfo.votingPower,
      timestamp: Date.now()
    });

    // Update vote counts
    if (choice === 'for') {
      proposal.votesFor += voterInfo.votingPower;
    } else {
      proposal.votesAgainst += voterInfo.votingPower;
    }
    proposal.totalVotingPower += voterInfo.votingPower;

    // Check if proposal can be resolved
    this.checkProposalResolution(proposal);

    return {
      success: true,
      proposalId,
      choice,
      votingPower: voterInfo.votingPower
    };
  }

  /**
   * Check if proposal can be resolved
   */
  checkProposalResolution(proposal) {
    const pool = this.communityPools.get(proposal.poolId);
    const totalPossibleVotes = Array.from(this.poolMemberships.get(proposal.poolId).values())
      .reduce((sum, member) => sum + member.votingPower, 0);

    const participationRate = (proposal.totalVotingPower / totalPossibleVotes) * 100;

    if (participationRate >= 10) { // Minimum 10% participation
      const forPercentage = (proposal.votesFor / proposal.totalVotingPower) * 100;

      if (forPercentage >= pool.votingThreshold) {
        proposal.status = 'passed';
        this.executeProposal(proposal);
      } else if (participationRate >= 50 && forPercentage < 50) {
        proposal.status = 'rejected';
      }
    }

    // Remove from active proposals if resolved
    if (proposal.status !== 'active') {
      const index = pool.activeProposals.indexOf(proposal.id);
      if (index > -1) {
        pool.activeProposals.splice(index, 1);
      }
    }
  }

  /**
   * Execute passed proposal
   */
  async executeProposal(proposal) {
    const pool = this.communityPools.get(proposal.poolId);

    switch (proposal.type) {
    case 'strategy_change':
      pool.strategy = proposal.changes.newStrategy;
      break;
    case 'asset_allocation':
      // Update allocations
      for (const [asset, percentage] of Object.entries(proposal.changes.allocations)) {
        pool.allocations.set(asset, percentage);
      }
      // Trigger rebalancing
      if (pool.autoRebalance) {
        await this.rebalancePool(proposal.poolId);
      }
      break;
    case 'withdrawal':
      // Process withdrawal for specific member
      await this.processPoolWithdrawal(proposal.poolId, proposal.changes.memberAddress, proposal.changes.amount);
      break;
    }

    this.emit('proposalExecuted', { proposalId: proposal.id, poolId: proposal.poolId });
  }

  /**
   * Rebalance pool assets
   */
  async rebalancePool(poolId) {
    const pool = this.communityPools.get(poolId);
    if (!pool) return;

    // Simulate rebalancing logic
    // In real implementation, this would interact with DeFi protocols
    pool.lastRebalance = Date.now();

    this.emit('poolRebalanced', { poolId });
  }

  /**
   * Process pool withdrawal
   */
  async processPoolWithdrawal(poolId, memberAddress, amount) {
    const pool = this.communityPools.get(poolId);
    const memberships = this.poolMemberships.get(poolId);
    const memberInfo = memberships.get(memberAddress);

    if (!memberInfo || memberInfo.contribution < amount) {
      throw new Error('Insufficient balance');
    }

    // Process withdrawal
    memberInfo.contribution -= amount;
    pool.totalValue -= amount;

    // Recalculate shares
    const totalContributions = Array.from(memberships.values())
      .reduce((sum, member) => sum + member.contribution, 0);

    for (const [address, info] of memberships) {
      info.sharePercentage = totalContributions > 0 ? (info.contribution / totalContributions) * 100 : 0;
      info.votingPower = info.sharePercentage;
    }

    return {
      success: true,
      withdrawnAmount: amount,
      remainingContribution: memberInfo.contribution
    };
  }

  /**
   * Get proposal by ID
   */
  getProposalById(proposalId) {
    for (const pool of this.communityPools.values()) {
      const proposal = pool.proposals.find(id => {
        const p = this.getProposalFromPool(pool.id, id);
        return p && p.id === proposalId;
      });
      if (proposal) return this.getProposalFromPool(pool.id, proposal);
    }
    return null;
  }

  /**
   * Get proposal from pool
   */
  getProposalFromPool(poolId, proposalId) {
    // This would need to be implemented to store proposals separately
    // For now, return mock
    return null;
  }

  /**
   * Get pool performance
   */
  getPoolPerformance(poolId) {
    const pool = this.communityPools.get(poolId);
    if (!pool) return null;

    return {
      ...pool.performance,
      memberCount: pool.memberCount,
      totalValue: pool.totalValue,
      lastRebalance: pool.lastRebalance
    };
  }
}

/**
 * Reputation-Based Lending System
 */
class ReputationBasedLendingSystem extends EventEmitter {
  constructor(blockchain, defi, socialTrading) {
    super();
    this.blockchain = blockchain;
    this.defi = defi;
    this.socialTrading = socialTrading;
    this.lendingPools = new Map();
    this.loans = new Map();
    this.reputationMultipliers = new Map();
  }

  /**
   * Create reputation-based lending pool
   */
  async createLendingPool(creatorAddress, poolConfig) {
    const poolId = `LEND_${crypto.randomBytes(8).toString('hex')}`;

    const pool = {
      id: poolId,
      name: poolConfig.name,
      asset: poolConfig.asset,
      creator: creatorAddress,
      minReputationScore: poolConfig.minReputationScore || 100,
      maxLoanToValue: poolConfig.maxLoanToValue || 0.7, // 70% LTV
      interestRate: poolConfig.interestRate || 0.05, // 5% APR
      liquidationThreshold: poolConfig.liquidationThreshold || 0.8, // 80%

      // Pool stats
      totalDeposits: 0,
      totalBorrowed: 0,
      availableLiquidity: 0,
      utilizationRate: 0,

      // Reputation bonuses
      reputationBonus: {
        rateReduction: 0.001, // 0.1% reduction per 10 reputation points
        ltvIncrease: 0.005 // 0.5% LTV increase per 10 reputation points
      },

      createdAt: Date.now()
    };

    this.lendingPools.set(poolId, pool);

    return pool;
  }

  /**
   * Deposit to lending pool
   */
  async depositToPool(depositorAddress, poolId, amount) {
    const pool = this.lendingPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    pool.totalDeposits += amount;
    pool.availableLiquidity += amount;
    pool.utilizationRate = pool.totalDeposits > 0 ? pool.totalBorrowed / pool.totalDeposits : 0;

    return {
      success: true,
      poolId,
      depositedAmount: amount,
      newTotalDeposits: pool.totalDeposits
    };
  }

  /**
   * Request reputation-based loan
   */
  async requestLoan(borrowerAddress, poolId, loanAmount, collateralAmount, collateralAsset) {
    const pool = this.lendingPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    // Get borrower reputation
    const borrowerProfile = this.socialTrading.traderProfiles.get(borrowerAddress);
    const reputationScore = borrowerProfile ? borrowerProfile.reputationScore : 100;

    if (reputationScore < pool.minReputationScore) {
      throw new Error('Insufficient reputation score');
    }

    // Calculate reputation-adjusted terms
    const reputationBonus = Math.floor(reputationScore / 10); // Bonus per 10 points
    const adjustedLTV = Math.min(0.9, pool.maxLoanToValue + (reputationBonus * pool.reputationBonus.ltvIncrease));
    const adjustedRate = Math.max(0.01, pool.interestRate - (reputationBonus * pool.reputationBonus.rateReduction));

    // Check LTV ratio
    const collateralValue = await this.getAssetValue(collateralAsset, collateralAmount);
    const ltvRatio = loanAmount / collateralValue;

    if (ltvRatio > adjustedLTV) {
      throw new Error(`Loan-to-value ratio too high. Max allowed: ${adjustedLTV * 100}%`);
    }

    // Check pool liquidity
    if (loanAmount > pool.availableLiquidity) {
      throw new Error('Insufficient pool liquidity');
    }

    const loanId = `LOAN_${crypto.randomBytes(8).toString('hex')}`;

    const loan = {
      id: loanId,
      borrower: borrowerAddress,
      poolId,
      loanAmount,
      collateralAmount,
      collateralAsset,
      interestRate: adjustedRate,
      ltvRatio,
      liquidationThreshold: pool.liquidationThreshold,
      status: 'active',
      borrowedAt: Date.now(),
      lastInterestPayment: Date.now(),
      totalInterestPaid: 0,
      healthFactor: collateralValue / loanAmount
    };

    this.loans.set(loanId, loan);

    // Update pool stats
    pool.totalBorrowed += loanAmount;
    pool.availableLiquidity -= loanAmount;
    pool.utilizationRate = pool.totalDeposits > 0 ? pool.totalBorrowed / pool.totalDeposits : 0;

    this.emit('loanCreated', { loanId, borrower: borrowerAddress, amount: loanAmount });

    return loan;
  }

  /**
   * Repay loan
   */
  async repayLoan(loanId, repaymentAmount) {
    const loan = this.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'active') throw new Error('Loan not active');

    const pool = this.lendingPools.get(loan.poolId);

    // Calculate interest accrued
    const interestAccrued = this.calculateInterestAccrued(loan);
    const totalDue = loan.loanAmount + interestAccrued;

    let actualRepayment = Math.min(repaymentAmount, totalDue);
    let remainingLoan = Math.max(0, totalDue - actualRepayment);

    // Update loan
    loan.totalInterestPaid += Math.min(interestAccrued, actualRepayment);
    loan.lastInterestPayment = Date.now();

    if (remainingLoan === 0) {
      loan.status = 'repaid';
      loan.repaidAt = Date.now();

      // Return collateral
      // (implementation would transfer collateral back to borrower)
    } else {
      loan.loanAmount = remainingLoan;
    }

    // Update pool
    pool.totalBorrowed -= (actualRepayment - Math.min(interestAccrued, actualRepayment));
    pool.availableLiquidity += (actualRepayment - Math.min(interestAccrued, actualRepayment));

    return {
      success: true,
      loanId,
      repaidAmount: actualRepayment,
      remainingAmount: remainingLoan,
      status: loan.status
    };
  }

  /**
   * Check loan health and liquidate if necessary
   */
  async checkLoanHealth(loanId) {
    const loan = this.loans.get(loanId);
    if (!loan || loan.status !== 'active') return;

    const collateralValue = await this.getAssetValue(loan.collateralAsset, loan.collateralAmount);
    const currentLTV = loan.loanAmount / collateralValue;

    loan.healthFactor = collateralValue / loan.loanAmount;

    if (currentLTV >= loan.liquidationThreshold) {
      await this.liquidateLoan(loanId);
    }

    return {
      loanId,
      healthFactor: loan.healthFactor,
      currentLTV,
      liquidationThreshold: loan.liquidationThreshold
    };
  }

  /**
   * Liquidate underwater loan
   */
  async liquidateLoan(loanId) {
    const loan = this.loans.get(loanId);
    const pool = this.lendingPools.get(loan.poolId);

    loan.status = 'liquidated';
    loan.liquidatedAt = Date.now();

    // Transfer collateral to pool
    // (implementation would handle collateral transfer)

    // Update pool stats
    pool.totalBorrowed -= loan.loanAmount;
    pool.availableLiquidity += loan.collateralAmount; // Simplified

    this.emit('loanLiquidated', { loanId, borrower: loan.borrower });

    return {
      success: true,
      loanId,
      liquidatedAmount: loan.loanAmount
    };
  }

  /**
   * Calculate accrued interest
   */
  calculateInterestAccrued(loan) {
    const timeElapsed = (Date.now() - loan.lastInterestPayment) / (365 * 24 * 60 * 60 * 1000); // Years
    return loan.loanAmount * loan.interestRate * timeElapsed;
  }

  /**
   * Get asset value (mock)
   */
  async getAssetValue(asset, amount) {
    // Mock price feed - in real implementation, use oracle
    const prices = {
      'ETH': 2000,
      'USDC': 1,
      'WBTC': 30000,
      'LINK': 15
    };

    return amount * (prices[asset] || 1);
  }

  /**
   * Get borrower's reputation-adjusted terms
   */
  getReputationAdjustedTerms(borrowerAddress, poolId) {
    const pool = this.lendingPools.get(poolId);
    const borrowerProfile = this.socialTrading.traderProfiles.get(borrowerAddress);
    const reputationScore = borrowerProfile ? borrowerProfile.reputationScore : 100;

    const reputationBonus = Math.floor(reputationScore / 10);
    const adjustedLTV = Math.min(0.9, pool.maxLoanToValue + (reputationBonus * pool.reputationBonus.ltvIncrease));
    const adjustedRate = Math.max(0.01, pool.interestRate - (reputationBonus * pool.reputationBonus.rateReduction));

    return {
      baseLTV: pool.maxLoanToValue,
      adjustedLTV,
      baseRate: pool.interestRate,
      adjustedRate,
      reputationScore,
      reputationBonus
    };
  }
}

/**
 * Social Mining System
 */
class SocialMiningSystem extends EventEmitter {
  constructor(socialTrading, blockchain) {
    super();
    this.socialTrading = socialTrading;
    this.blockchain = blockchain;
    this.miningRewards = new Map();
    this.userRewards = new Map();
    this.miningPools = new Map();
  }

  /**
   * Create social mining pool
   */
  async createMiningPool(poolConfig) {
    const poolId = `MINE_${crypto.randomBytes(8).toString('hex')}`;

    const pool = {
      id: poolId,
      name: poolConfig.name,
      rewardToken: poolConfig.rewardToken,
      totalRewards: poolConfig.totalRewards,
      distributedRewards: 0,
      miningActivities: poolConfig.miningActivities || ['trading', 'social', 'governance'],
      activityWeights: poolConfig.activityWeights || { trading: 1, social: 0.5, governance: 0.8 },
      duration: poolConfig.duration || (30 * 24 * 60 * 60 * 1000), // 30 days
      startTime: Date.now(),
      endTime: Date.now() + (poolConfig.duration || (30 * 24 * 60 * 60 * 1000)),
      status: 'active',
      participants: new Map() // address -> mining stats
    };

    this.miningPools.set(poolId, pool);

    return pool;
  }

  /**
   * Record mining activity
   */
  async recordMiningActivity(userAddress, poolId, activityType, activityData) {
    const pool = this.miningPools.get(poolId);
    if (!pool || pool.status !== 'active') return;

    if (!pool.miningActivities.includes(activityType)) return;

    const participant = pool.participants.get(userAddress) || {
      address: userAddress,
      totalScore: 0,
      activities: {},
      rewards: 0,
      joinedAt: Date.now()
    };

    // Calculate activity score
    const baseScore = this.calculateActivityScore(activityType, activityData);
    const weight = pool.activityWeights[activityType] || 1;
    const weightedScore = baseScore * weight;

    participant.totalScore += weightedScore;
    participant.activities[activityType] = (participant.activities[activityType] || 0) + weightedScore;
    participant.lastActivity = Date.now();

    pool.participants.set(userAddress, participant);

    return {
      poolId,
      userAddress,
      activityType,
      score: weightedScore,
      totalScore: participant.totalScore
    };
  }

  /**
   * Calculate activity score
   */
  calculateActivityScore(activityType, activityData) {
    switch (activityType) {
    case 'trading':
      return Math.min(activityData.volume || 0, 1000) / 10; // Max 100 points for $10k volume
    case 'social':
      return (activityData.likes || 0) + (activityData.comments || 0) * 2 + (activityData.shares || 0) * 3;
    case 'governance':
      return (activityData.votes || 0) * 5 + (activityData.proposals || 0) * 20;
    default:
      return 1;
    }
  }

  /**
   * Distribute mining rewards
   */
  async distributeMiningRewards(poolId) {
    const pool = this.miningPools.get(poolId);
    if (!pool) return;

    const remainingRewards = pool.totalRewards - pool.distributedRewards;
    if (remainingRewards <= 0) return;

    const participants = Array.from(pool.participants.values());
    const totalScore = participants.reduce((sum, p) => sum + p.totalScore, 0);

    if (totalScore === 0) return;

    // Distribute rewards proportionally
    for (const participant of participants) {
      const share = participant.totalScore / totalScore;
      const reward = remainingRewards * share;

      participant.rewards += reward;

      // Record user rewards
      const userRewards = this.userRewards.get(participant.address) || [];
      userRewards.push({
        poolId,
        amount: reward,
        token: pool.rewardToken,
        timestamp: Date.now()
      });
      this.userRewards.set(participant.address, userRewards);
    }

    pool.distributedRewards = pool.totalRewards;
    pool.status = 'completed';

    this.emit('miningRewardsDistributed', { poolId, totalDistributed: remainingRewards });

    return {
      poolId,
      totalDistributed: remainingRewards,
      participantsCount: participants.length
    };
  }

  /**
   * Get user mining stats
   */
  getUserMiningStats(userAddress, poolId = null) {
    if (poolId) {
      const pool = this.miningPools.get(poolId);
      return pool ? pool.participants.get(userAddress) : null;
    }

    // Get stats across all pools
    const allPools = Array.from(this.miningPools.values());
    const userStats = {
      totalScore: 0,
      totalRewards: 0,
      poolsParticipated: 0,
      activities: {}
    };

    for (const pool of allPools) {
      const participant = pool.participants.get(userAddress);
      if (participant) {
        userStats.totalScore += participant.totalScore;
        userStats.totalRewards += participant.rewards;
        userStats.poolsParticipated++;

        for (const [activity, score] of Object.entries(participant.activities)) {
          userStats.activities[activity] = (userStats.activities[activity] || 0) + score;
        }
      }
    }

    return userStats;
  }

  /**
   * Get mining pool leaderboard
   */
  getMiningLeaderboard(poolId, limit = 50) {
    const pool = this.miningPools.get(poolId);
    if (!pool) return [];

    const participants = Array.from(pool.participants.values());

    return participants
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map(p => ({
        address: p.address,
        totalScore: p.totalScore,
        rewards: p.rewards,
        activities: p.activities
      }));
  }
}

module.exports = {
  SocialTradingSystem,
  CommunityPoolSystem,
  ReputationBasedLendingSystem,
  SocialMiningSystem
};
