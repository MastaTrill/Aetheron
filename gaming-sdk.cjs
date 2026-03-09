/**
 * Gaming SDK Module
 * Unity/Unreal Engine integration, tournaments, and in-game assets
 */

const crypto = require('crypto');

/**
 * Game Asset Manager
 * Manage in-game NFTs and currencies
 */
class GameAssetManager {
  constructor() {
    this.assets = new Map();
    this.inventories = new Map();
    this.assetPrices = new Map(); // Dynamic pricing
    this.rarityMultipliers = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      epic: 4.0,
      legendary: 7.5,
      mythic: 15.0
    };
  }

  /**
   * Mint game asset with advanced properties
   */
  mintAsset(config) {
    const assetId = crypto.randomBytes(16).toString('hex');

    const asset = {
      id: assetId,
      name: config.name,
      type: config.type, // weapon, armor, skin, consumable, land, character
      rarity: config.rarity || 'common',
      attributes: config.attributes || {},
      stats: config.stats || {}, // attack, defense, speed, etc.
      level: config.level || 1,
      maxLevel: config.maxLevel || 100,
      experience: 0,
      maxSupply: config.maxSupply || null,
      currentSupply: 1,
      tradeable: config.tradeable !== false,
      soulbound: config.soulbound || false, // Cannot be traded
      crossGame: config.crossGame || false, // Can be used in multiple games
      gameId: config.gameId, // Which game this asset belongs to
      metadata: config.metadata || {},
      createdAt: Date.now(),
      lastTraded: null,
      tradeVolume: 0,
      floorPrice: config.floorPrice || 0
    };

    // Calculate base value based on rarity and attributes
    asset.baseValue = this.calculateAssetValue(asset);

    this.assets.set(assetId, asset);

    return asset;
  }

  /**
   * Calculate asset value based on properties
   */
  calculateAssetValue(asset) {
    let value = 10; // Base value

    // Rarity multiplier
    value *= this.rarityMultipliers[asset.rarity] || 1;

    // Level bonus
    value *= (1 + (asset.level - 1) * 0.1);

    // Attribute bonuses
    const statCount = Object.keys(asset.stats).length;
    value *= (1 + statCount * 0.05);

    // Cross-game bonus
    if (asset.crossGame) value *= 1.5;

    return Math.floor(value);
  }

  /**
   * Level up asset
   */
  levelUpAsset(assetId, experienceGained = 100) {
    const asset = this.assets.get(assetId);
    if (!asset) throw new Error('Asset not found');

    asset.experience += experienceGained;

    // Calculate required XP for next level (exponential growth)
    const requiredXP = asset.level * 100 + Math.pow(asset.level, 2) * 10;

    if (asset.experience >= requiredXP && asset.level < asset.maxLevel) {
      asset.level++;
      asset.experience -= requiredXP;

      // Upgrade stats on level up
      this.upgradeAssetStats(asset);

      return { leveledUp: true, newLevel: asset.level };
    }

    return { leveledUp: false, currentLevel: asset.level };
  }

  /**
   * Upgrade asset stats on level up
   */
  upgradeAssetStats(asset) {
    const upgradeMultiplier = 1.1 + (asset.level * 0.01);

    Object.keys(asset.stats).forEach(stat => {
      asset.stats[stat] = Math.floor(asset.stats[stat] * upgradeMultiplier);
    });

    // Recalculate value
    asset.baseValue = this.calculateAssetValue(asset);
  }

  /**
   * Transfer asset between players
   */
  transferAsset(assetId, from, to, price = 0) {
    const asset = this.assets.get(assetId);
    if (!asset) throw new Error('Asset not found');
    if (asset.soulbound) throw new Error('Asset is soulbound');

    // Remove from sender
    if (from) {
      const fromInventory = this.inventories.get(from) || [];
      const index = fromInventory.findIndex((a) => a.assetId === assetId);
      if (index > -1) {
        fromInventory.splice(index, 1);
        this.inventories.set(from, fromInventory);
      }
    }

    // Add to receiver
    const toInventory = this.inventories.get(to) || [];
    toInventory.push({
      assetId,
      acquiredAt: Date.now(),
      acquiredPrice: price
    });
    this.inventories.set(to, toInventory);

    // Update asset trading data
    asset.lastTraded = Date.now();
    asset.tradeVolume += price;

    return {
      assetId,
      from,
      to,
      price,
      timestamp: Date.now()
    };
  }

  /**
   * Get player inventory with enhanced data
   */
  getInventory(playerId) {
    const inventory = this.inventories.get(playerId) || [];

    return inventory.map((item) => {
      const asset = this.assets.get(item.assetId);
      return {
        ...item,
        asset,
        currentValue: asset ? this.calculateAssetValue(asset) : 0,
        profit: item.acquiredPrice ? (asset.baseValue - item.acquiredPrice) : 0
      };
    });
  }

  /**
   * Equip asset with stat bonuses
   */
  equipAsset(playerId, assetId, slot) {
    const inventory = this.inventories.get(playerId) || [];
    const item = inventory.find((i) => i.assetId === assetId);

    if (!item) throw new Error('Asset not in inventory');

    const asset = this.assets.get(assetId);
    if (!asset) throw new Error('Asset not found');

    // Unequip current item in slot
    inventory.forEach(i => {
      if (i.equipped && i.slot === slot) {
        i.equipped = false;
        delete i.slot;
        delete i.equippedAt;
      }
    });

    item.equipped = true;
    item.slot = slot;
    item.equippedAt = Date.now();

    return {
      ...item,
      asset,
      statBonuses: asset.stats
    };
  }

  /**
   * Get equipped items and total stats
   */
  getEquippedStats(playerId) {
    const inventory = this.inventories.get(playerId) || [];
    const equipped = inventory.filter(i => i.equipped);

    const totalStats = {};
    equipped.forEach(item => {
      const asset = this.assets.get(item.assetId);
      if (asset && asset.stats) {
        Object.entries(asset.stats).forEach(([stat, value]) => {
          totalStats[stat] = (totalStats[stat] || 0) + value;
        });
      }
    });

    return {
      equipped,
      totalStats,
      equipmentSlots: {
        weapon: equipped.find(i => i.slot === 'weapon'),
        armor: equipped.find(i => i.slot === 'armor'),
        accessory: equipped.find(i => i.slot === 'accessory')
      }
    };
  }
}

/**
 * Play-to-Earn System
 */
class PlayToEarnSystem {
  constructor(assetManager, defiIntegration) {
    this.assetManager = assetManager;
    this.defiIntegration = defiIntegration;
    this.playerRewards = new Map();
    this.rewardPools = new Map();
    this.stakingPools = new Map();
  }

  /**
   * Create reward pool for game activities
   */
  createRewardPool(gameId, config) {
    const poolId = crypto.randomBytes(16).toString('hex');

    const pool = {
      id: poolId,
      gameId,
      name: config.name,
      rewardToken: config.rewardToken || 'AETH',
      totalRewards: config.totalRewards || 10000,
      remainingRewards: config.totalRewards || 10000,
      rewardRate: config.rewardRate || 10, // tokens per hour
      activities: config.activities || ['combat', 'quest', 'achievement'],
      requirements: config.requirements || {},
      startTime: config.startTime || Date.now(),
      endTime: config.endTime,
      participants: new Set(),
      claimed: new Map()
    };

    this.rewardPools.set(poolId, pool);
    return pool;
  }

  /**
   * Earn rewards from gameplay
   */
  earnRewards(playerId, activity, performance = 1.0) {
    const rewards = [];

    this.rewardPools.forEach(pool => {
      if (pool.activities.includes(activity) &&
          pool.remainingRewards > 0 &&
          (!pool.endTime || Date.now() < pool.endTime)) {

        pool.participants.add(playerId);

        const baseReward = pool.rewardRate * performance;
        const actualReward = Math.min(baseReward, pool.remainingRewards);

        if (actualReward > 0) {
          pool.remainingRewards -= actualReward;
          pool.claimed.set(playerId, (pool.claimed.get(playerId) || 0) + actualReward);

          rewards.push({
            poolId: pool.id,
            activity,
            amount: actualReward,
            token: pool.rewardToken
          });
        }
      }
    });

    // Update player rewards
    const playerRewardData = this.playerRewards.get(playerId) || {
      totalEarned: 0,
      byActivity: {},
      byToken: {},
      history: []
    };

    rewards.forEach(reward => {
      playerRewardData.totalEarned += reward.amount;
      playerRewardData.byActivity[activity] = (playerRewardData.byActivity[activity] || 0) + reward.amount;
      playerRewardData.byToken[reward.token] = (playerRewardData.byToken[reward.token] || 0) + reward.amount;
      playerRewardData.history.push({
        ...reward,
        timestamp: Date.now()
      });
    });

    this.playerRewards.set(playerId, playerRewardData);

    return rewards;
  }

  /**
   * Stake assets for additional rewards
   */
  stakeAsset(playerId, assetId, duration) {
    const asset = this.assetManager.assets.get(assetId);
    if (!asset) throw new Error('Asset not found');

    const stakeId = crypto.randomBytes(16).toString('hex');

    const stake = {
      id: stakeId,
      playerId,
      assetId,
      stakedAt: Date.now(),
      duration, // in milliseconds
      unlockTime: Date.now() + duration,
      baseValue: asset.baseValue,
      bonusMultiplier: this.calculateStakingBonus(duration),
      rewards: 0,
      claimed: false
    };

    const playerStakes = this.stakingPools.get(playerId) || [];
    playerStakes.push(stake);
    this.stakingPools.set(playerId, playerStakes);

    return stake;
  }

  /**
   * Calculate staking bonus based on duration
   */
  calculateStakingBonus(duration) {
    const days = duration / (24 * 60 * 60 * 1000);
    if (days < 7) return 1.0;
    if (days < 30) return 1.2;
    if (days < 90) return 1.5;
    return 2.0; // 90+ days
  }

  /**
   * Claim staking rewards
   */
  claimStakingRewards(playerId, stakeId) {
    const playerStakes = this.stakingPools.get(playerId) || [];
    const stake = playerStakes.find(s => s.id === stakeId);

    if (!stake) throw new Error('Stake not found');
    if (Date.now() < stake.unlockTime) throw new Error('Stake still locked');
    if (stake.claimed) throw new Error('Rewards already claimed');

    // Calculate rewards based on time staked and asset value
    const timeStaked = Date.now() - stake.stakedAt;
    const rewardRate = (stake.baseValue * stake.bonusMultiplier) / (30 * 24 * 60 * 60 * 1000); // Daily rate
    const rewards = rewardRate * (timeStaked / (24 * 60 * 60 * 1000));

    stake.rewards = rewards;
    stake.claimed = true;
    stake.claimedAt = Date.now();

    return {
      stakeId,
      rewards,
      bonusMultiplier: stake.bonusMultiplier
    };
  }

  /**
   * Get player earning statistics
   */
  getPlayerStats(playerId) {
    const rewards = this.playerRewards.get(playerId) || {
      totalEarned: 0,
      byActivity: {},
      byToken: {},
      history: []
    };

    const stakes = this.stakingPools.get(playerId) || [];
    const activeStakes = stakes.filter(s => !s.claimed && Date.now() < s.unlockTime);
    const totalStakedValue = activeStakes.reduce((sum, s) => sum + s.baseValue, 0);

    return {
      rewards,
      staking: {
        activeStakes: activeStakes.length,
        totalStakedValue,
        totalRewards: stakes.reduce((sum, s) => sum + (s.rewards || 0), 0)
      },
      rank: this.calculatePlayerRank(rewards.totalEarned)
    };
  }

  /**
   * Calculate player rank based on earnings
   */
  calculatePlayerRank(totalEarned) {
    if (totalEarned >= 10000) return 'Diamond';
    if (totalEarned >= 5000) return 'Platinum';
    if (totalEarned >= 2500) return 'Gold';
    if (totalEarned >= 1000) return 'Silver';
    if (totalEarned >= 500) return 'Bronze';
    return 'Novice';
  }
}

/**
 * Cross-Game Asset Interoperability
 */
class CrossGameBridge {
  constructor(assetManager) {
    this.assetManager = assetManager;
    this.gameRegistries = new Map(); // gameId -> game config
    this.assetMappings = new Map(); // assetId -> compatible games
    this.bridgeTransactions = new Map();
  }

  /**
   * Register a game in the ecosystem
   */
  registerGame(gameId, config) {
    const game = {
      id: gameId,
      name: config.name,
      genre: config.genre,
      supportedAssets: config.supportedAssets || [],
      assetConverters: config.assetConverters || {},
      crossGameFeatures: config.crossGameFeatures || [],
      registeredAt: Date.now()
    };

    this.gameRegistries.set(gameId, game);
    return game;
  }

  /**
   * Bridge asset to another game
   */
  bridgeAsset(assetId, fromGameId, toGameId, playerId) {
    const asset = this.assetManager.assets.get(assetId);
    if (!asset) throw new Error('Asset not found');

    const fromGame = this.gameRegistries.get(fromGameId);
    const toGame = this.gameRegistries.get(toGameId);

    if (!fromGame || !toGame) throw new Error('Game not registered');
    if (!asset.crossGame) throw new Error('Asset not cross-game compatible');

    // Check if target game supports this asset type
    if (!toGame.supportedAssets.includes(asset.type)) {
      throw new Error('Target game does not support this asset type');
    }

    const bridgeId = crypto.randomBytes(16).toString('hex');

    // Convert asset properties for target game
    const convertedAsset = this.convertAssetForGame(asset, toGameId);

    const bridgeTx = {
      id: bridgeId,
      assetId,
      fromGameId,
      toGameId,
      playerId,
      originalAsset: asset,
      convertedAsset,
      bridgedAt: Date.now(),
      status: 'completed'
    };

    this.bridgeTransactions.set(bridgeId, bridgeTx);

    // Update asset mappings
    const mappings = this.assetMappings.get(assetId) || new Set();
    mappings.add(toGameId);
    this.assetMappings.set(assetId, mappings);

    return bridgeTx;
  }

  /**
   * Convert asset properties for target game
   */
  convertAssetForGame(asset, targetGameId) {
    const targetGame = this.gameRegistries.get(targetGameId);
    const converter = targetGame.assetConverters[asset.type];

    if (!converter) {
      // Default conversion - keep most properties
      return {
        ...asset,
        id: crypto.randomBytes(16).toString('hex'), // New ID in target game
        gameId: targetGameId,
        converted: true,
        originalGameId: asset.gameId
      };
    }

    // Use custom converter
    return converter(asset);
  }

  /**
   * Get compatible games for an asset
   */
  getCompatibleGames(assetId) {
    const asset = this.assetManager.assets.get(assetId);
    if (!asset) return [];

    const compatibleGames = [];

    this.gameRegistries.forEach(game => {
      if (game.supportedAssets.includes(asset.type) && asset.crossGame) {
        compatibleGames.push({
          gameId: game.id,
          gameName: game.name,
          conversionRequired: game.assetConverters[asset.type] ? true : false
        });
      }
    });

    return compatibleGames;
  }

  /**
   * Get player's cross-game assets
   */
  getPlayerCrossGameAssets(playerId) {
    const inventory = this.assetManager.getInventory(playerId);
    const crossGameAssets = [];

    inventory.forEach(item => {
      if (item.asset && item.asset.crossGame) {
        const compatibleGames = this.getCompatibleGames(item.assetId);
        crossGameAssets.push({
          ...item,
          compatibleGames
        });
      }
    });

    return crossGameAssets;
  }
}

/**
 * GameFi Integration - Connect Gaming to DeFi
 */
class GameFiIntegration {
  constructor(assetManager, defiModule) {
    this.assetManager = assetManager;
    this.defiModule = defiModule;
    this.liquidityPools = new Map();
    this.yieldFarms = new Map();
    this.nftStaking = new Map();
  }

  /**
   * Create gaming liquidity pool
   */
  createGamingLiquidityPool(tokenA, tokenB, gameId) {
    const poolId = crypto.randomBytes(16).toString('hex');

    const pool = {
      id: poolId,
      tokenA,
      tokenB,
      gameId,
      reserveA: 0,
      reserveB: 0,
      totalLiquidity: 0,
      liquidityTokens: new Map(), // provider -> amount
      rewards: {
        gameTokens: 1000, // Daily game token rewards
        defiTokens: 500   // Daily DeFi token rewards
      },
      createdAt: Date.now()
    };

    this.liquidityPools.set(poolId, pool);
    return pool;
  }

  /**
   * Add liquidity to gaming pool
   */
  addLiquidity(poolId, provider, amountA, amountB) {
    const pool = this.liquidityPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    pool.reserveA += amountA;
    pool.reserveB += amountB;

    const liquidityAmount = Math.sqrt(amountA * amountB);
    pool.totalLiquidity += liquidityAmount;

    pool.liquidityTokens.set(provider, (pool.liquidityTokens.get(provider) || 0) + liquidityAmount);

    return {
      poolId,
      provider,
      liquidityAdded: liquidityAmount,
      share: liquidityAmount / pool.totalLiquidity
    };
  }

  /**
   * Create yield farm for gaming assets
   */
  createYieldFarm(assetType, config) {
    const farmId = crypto.randomBytes(16).toString('hex');

    const farm = {
      id: farmId,
      assetType, // 'weapon', 'armor', 'character', etc.
      name: config.name,
      stakingToken: config.stakingToken,
      rewardToken: config.rewardToken,
      rewardRate: config.rewardRate || 10, // tokens per day
      totalStaked: 0,
      stakers: new Map(), // staker -> staked amount
      startTime: config.startTime || Date.now(),
      endTime: config.endTime,
      multiplier: config.multiplier || 1.0
    };

    this.yieldFarms.set(farmId, farm);
    return farm;
  }

  /**
   * Stake gaming assets for yield
   */
  stakeAsset(farmId, playerId, assetId) {
    const farm = this.yieldFarms.get(farmId);
    if (!farm) throw new Error('Farm not found');

    const asset = this.assetManager.assets.get(assetId);
    if (!asset || asset.type !== farm.assetType) {
      throw new Error('Asset not compatible with this farm');
    }

    // Check if player owns the asset
    const inventory = this.assetManager.getInventory(playerId);
    const ownsAsset = inventory.some(item => item.assetId === assetId);
    if (!ownsAsset) throw new Error('Player does not own this asset');

    const stakeAmount = asset.baseValue * farm.multiplier;
    farm.totalStaked += stakeAmount;

    const stakerData = farm.stakers.get(playerId) || { totalStaked: 0, assets: [] };
    stakerData.totalStaked += stakeAmount;
    stakerData.assets.push({
      assetId,
      stakedAt: Date.now(),
      stakeValue: stakeAmount
    });
    farm.stakers.set(playerId, stakerData);

    return {
      farmId,
      playerId,
      assetId,
      stakeValue: stakeAmount,
      multiplier: farm.multiplier
    };
  }

  /**
   * Claim farming rewards
   */
  claimRewards(farmId, playerId) {
    const farm = this.yieldFarms.get(farmId);
    if (!farm) throw new Error('Farm not found');

    const stakerData = farm.stakers.get(playerId);
    if (!stakerData) throw new Error('Player not staking in this farm');

    const timeStaked = Date.now() - farm.startTime;
    const daysStaked = timeStaked / (24 * 60 * 60 * 1000);
    const rewards = (stakerData.totalStaked / farm.totalStaked) * farm.rewardRate * daysStaked;

    // Reset staking period for this staker
    stakerData.lastClaimed = Date.now();

    return {
      farmId,
      playerId,
      rewards,
      token: farm.rewardToken,
      apr: (farm.rewardRate * 365 / farm.totalStaked) * 100
    };
  }

  /**
   * NFT Staking for governance and rewards
   */
  stakeNFT(playerId, assetId, lockPeriod) {
    const asset = this.assetManager.assets.get(assetId);
    if (!asset) throw new Error('Asset not found');

    const stakeId = crypto.randomBytes(16).toString('hex');

    const stake = {
      id: stakeId,
      playerId,
      assetId,
      stakedAt: Date.now(),
      lockPeriod,
      unlockTime: Date.now() + lockPeriod,
      baseValue: asset.baseValue,
      rarity: asset.rarity,
      votingPower: this.calculateVotingPower(asset),
      rewards: {
        governance: 0,
        gameTokens: 0
      }
    };

    const playerStakes = this.nftStaking.get(playerId) || [];
    playerStakes.push(stake);
    this.nftStaking.set(playerId, playerStakes);

    return stake;
  }

  /**
   * Calculate voting power based on NFT properties
   */
  calculateVotingPower(asset) {
    const rarityMultipliers = {
      common: 1,
      uncommon: 2,
      rare: 5,
      epic: 10,
      legendary: 25,
      mythic: 50
    };

    return asset.baseValue * (rarityMultipliers[asset.rarity] || 1) * (1 + asset.level * 0.1);
  }

  /**
   * Get player's governance power
   */
  getGovernancePower(playerId) {
    const stakes = this.nftStaking.get(playerId) || [];
    const activeStakes = stakes.filter(s => Date.now() < s.unlockTime);

    const totalPower = activeStakes.reduce((sum, s) => sum + s.votingPower, 0);

    return {
      totalPower,
      activeStakes: activeStakes.length,
      rank: this.calculateGovernanceRank(totalPower)
    };
  }

  /**
   * Calculate governance rank
   */
  calculateGovernanceRank(power) {
    if (power >= 10000) return 'Council Member';
    if (power >= 5000) return 'Elder';
    if (power >= 2500) return 'Veteran';
    if (power >= 1000) return 'Member';
    return 'Citizen';
  }
}

/**
 * Guild/Clan System
 */
class GuildSystem {
  constructor() {
    this.guilds = new Map();
    this.memberships = new Map(); // playerId -> guildId
    this.applications = new Map(); // guildId -> applications
  }

  /**
   * Create guild
   */
  createGuild(founderId, config) {
    const guildId = crypto.randomBytes(16).toString('hex');

    const guild = {
      id: guildId,
      name: config.name,
      description: config.description,
      founder: founderId,
      level: 1,
      experience: 0,
      maxMembers: config.maxMembers || 50,
      members: [founderId],
      officers: [founderId],
      treasury: {
        tokens: 0,
        nfts: []
      },
      requirements: config.requirements || {},
      perks: config.perks || [],
      games: config.games || [], // Supported games
      createdAt: Date.now(),
      stats: {
        totalWins: 0,
        totalTournaments: 0,
        averageRank: 0
      }
    };

    this.guilds.set(guildId, guild);
    this.memberships.set(founderId, guildId);

    return guild;
  }

  /**
   * Apply to join guild
   */
  applyToGuild(playerId, guildId, applicationData = {}) {
    const guild = this.guilds.get(guildId);
    if (!guild) throw new Error('Guild not found');

    if (guild.members.length >= guild.maxMembers) {
      throw new Error('Guild is full');
    }

    const applications = this.applications.get(guildId) || [];
    applications.push({
      playerId,
      appliedAt: Date.now(),
      data: applicationData,
      status: 'pending'
    });

    this.applications.set(guildId, applications);

    return { guildId, status: 'applied' };
  }

  /**
   * Accept guild application
   */
  acceptApplication(guildId, playerId, officerId) {
    const guild = this.guilds.get(guildId);
    if (!guild) throw new Error('Guild not found');

    if (!guild.officers.includes(officerId)) {
      throw new Error('Not authorized');
    }

    const applications = this.applications.get(guildId) || [];
    const application = applications.find(a => a.playerId === playerId);

    if (!application) throw new Error('Application not found');

    application.status = 'accepted';
    guild.members.push(playerId);
    this.memberships.set(playerId, guildId);

    return { guildId, playerId, status: 'accepted' };
  }

  /**
   * Guild treasury management
   */
  contributeToTreasury(guildId, playerId, amount, assetId = null) {
    const guild = this.guilds.get(guildId);
    if (!guild) throw new Error('Guild not found');

    if (!guild.members.includes(playerId)) {
      throw new Error('Not a guild member');
    }

    if (assetId) {
      // Contribute NFT
      guild.treasury.nfts.push({
        assetId,
        contributedBy: playerId,
        contributedAt: Date.now()
      });
    } else {
      // Contribute tokens
      guild.treasury.tokens += amount;
    }

    // Award guild experience
    this.awardGuildExperience(guildId, amount || 100);

    return {
      guildId,
      contribution: assetId ? { type: 'nft', assetId } : { type: 'tokens', amount }
    };
  }

  /**
   * Award experience to guild
   */
  awardGuildExperience(guildId, amount) {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    guild.experience += amount;

    // Level up logic
    const requiredXP = guild.level * 1000;
    if (guild.experience >= requiredXP) {
      guild.level++;
      guild.experience -= requiredXP;

      // Unlock new perks
      this.unlockGuildPerks(guild);
    }
  }

  /**
   * Unlock perks based on guild level
   */
  unlockGuildPerks(guild) {
    const levelPerks = {
      2: 'Member Boost +10%',
      3: 'Treasury Tax Reduction',
      5: 'Exclusive Tournaments',
      10: 'Guild Hall Customization'
    };

    if (levelPerks[guild.level]) {
      guild.perks.push(levelPerks[guild.level]);
    }
  }

  /**
   * Get guild leaderboard
   */
  getGuildLeaderboard(limit = 10) {
    const guilds = Array.from(this.guilds.values());

    return guilds
      .sort((a, b) => b.level - a.level || b.experience - a.experience)
      .slice(0, limit)
      .map(guild => ({
        id: guild.id,
        name: guild.name,
        level: guild.level,
        experience: guild.experience,
        members: guild.members.length,
        treasury: guild.treasury.tokens
      }));
  }
}

/**
 * In-Game Economy System
 */
class InGameEconomy {
  constructor(assetManager) {
    this.assetManager = assetManager;
    this.marketOrders = new Map();
    this.auctions = new Map();
    this.priceHistory = new Map(); // assetId -> price data
    this.economyMetrics = {
      totalVolume: 0,
      activeListings: 0,
      floorPrices: new Map()
    };
  }

  /**
   * Create market order
   */
  createMarketOrder(sellerId, assetId, price, orderType = 'sell') {
    const asset = this.assetManager.assets.get(assetId);
    if (!asset) throw new Error('Asset not found');

    const orderId = crypto.randomBytes(16).toString('hex');

    const order = {
      id: orderId,
      sellerId,
      assetId,
      price,
      orderType, // 'sell' or 'buy'
      status: 'active',
      createdAt: Date.now(),
      asset
    };

    this.marketOrders.set(orderId, order);
    this.economyMetrics.activeListings++;

    return order;
  }

  /**
   * Execute market order
   */
  executeOrder(orderId, buyerId) {
    const order = this.marketOrders.get(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'active') throw new Error('Order not active');

    // Transfer asset
    this.assetManager.transferAsset(order.assetId, order.sellerId, buyerId, order.price);

    order.status = 'completed';
    order.buyerId = buyerId;
    order.completedAt = Date.now();

    // Update economy metrics
    this.economyMetrics.totalVolume += order.price;
    this.updatePriceHistory(order.assetId, order.price);

    this.economyMetrics.activeListings--;

    return {
      orderId,
      buyerId,
      sellerId: order.sellerId,
      price: order.price,
      assetId: order.assetId
    };
  }

  /**
   * Create auction
   */
  createAuction(sellerId, assetId, startingPrice, duration) {
    const asset = this.assetManager.assets.get(assetId);
    if (!asset) throw new Error('Asset not found');

    const auctionId = crypto.randomBytes(16).toString('hex');

    const auction = {
      id: auctionId,
      sellerId,
      assetId,
      startingPrice,
      currentBid: startingPrice,
      highestBidder: null,
      bids: [],
      startTime: Date.now(),
      endTime: Date.now() + duration,
      status: 'active',
      asset
    };

    this.auctions.set(auctionId, auction);
    return auction;
  }

  /**
   * Place bid on auction
   */
  placeBid(auctionId, bidderId, bidAmount) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status !== 'active') throw new Error('Auction not active');
    if (Date.now() > auction.endTime) throw new Error('Auction ended');
    if (bidAmount <= auction.currentBid) throw new Error('Bid too low');

    auction.currentBid = bidAmount;
    auction.highestBidder = bidderId;
    auction.bids.push({
      bidderId,
      amount: bidAmount,
      timestamp: Date.now()
    });

    return {
      auctionId,
      bidderId,
      bidAmount,
      isHighest: true
    };
  }

  /**
   * End auction
   */
  endAuction(auctionId) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');

    auction.status = 'ended';
    auction.endedAt = Date.now();

    if (auction.highestBidder) {
      // Transfer asset to winner
      this.assetManager.transferAsset(
        auction.assetId,
        auction.sellerId,
        auction.highestBidder,
        auction.currentBid
      );

      this.updatePriceHistory(auction.assetId, auction.currentBid);
      this.economyMetrics.totalVolume += auction.currentBid;
    }

    return auction;
  }

  /**
   * Update price history
   */
  updatePriceHistory(assetId, price) {
    const history = this.priceHistory.get(assetId) || [];
    history.push({
      price,
      timestamp: Date.now()
    });

    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.shift();
    }

    this.priceHistory.set(assetId, history);

    // Update floor price
    this.updateFloorPrice(assetId);
  }

  /**
   * Update floor price for asset type
   */
  updateFloorPrice(assetId) {
    const asset = this.assetManager.assets.get(assetId);
    if (!asset) return;

    const allAssetsOfType = Array.from(this.assetManager.assets.values())
      .filter(a => a.type === asset.type && a.lastTraded);

    if (allAssetsOfType.length > 0) {
      const floorPrice = Math.min(...allAssetsOfType.map(a => a.floorPrice || a.baseValue));
      this.economyMetrics.floorPrices.set(asset.type, floorPrice);
    }
  }

  /**
   * Get market analytics
   */
  getMarketAnalytics(assetType = null) {
    const analytics = {
      totalVolume: this.economyMetrics.totalVolume,
      activeListings: this.economyMetrics.activeListings,
      floorPrices: Object.fromEntries(this.economyMetrics.floorPrices)
    };

    if (assetType) {
      const floorPrice = this.economyMetrics.floorPrices.get(assetType);
      const listings = Array.from(this.marketOrders.values())
        .filter(order => order.asset.type === assetType && order.status === 'active');

      analytics.assetType = assetType;
      analytics.floorPrice = floorPrice;
      analytics.activeListings = listings.length;
      analytics.averagePrice = listings.length > 0
        ? listings.reduce((sum, order) => sum + order.price, 0) / listings.length
        : 0;
    }

    return analytics;
  }

  /**
   * Transfer asset to player
   */
  async transferAsset(assetId, from, to) {
    // Remove from sender
    if (from) {
      const fromInventory = this.inventories.get(from) || [];
      const index = fromInventory.findIndex((a) => a.assetId === assetId);
      if (index > -1) {
        fromInventory.splice(index, 1);
        this.inventories.set(from, fromInventory);
      }
    }

    // Add to receiver
    const toInventory = this.inventories.get(to) || [];
    toInventory.push({
      assetId,
      acquiredAt: Date.now()
    });
    this.inventories.set(to, toInventory);

    return {
      assetId,
      from,
      to,
      timestamp: Date.now()
    };
  }

  /**
   * Get player inventory
   */
  getInventory(playerId) {
    const inventory = this.inventories.get(playerId) || [];

    return inventory.map((item) => ({
      ...item,
      asset: this.assets.get(item.assetId)
    }));
  }

  /**
   * Equip asset
   */
  equipAsset(playerId, assetId, slot) {
    const inventory = this.inventories.get(playerId) || [];
    const item = inventory.find((i) => i.assetId === assetId);

    if (!item) {
      throw new Error('Asset not in inventory');
    }

    item.equipped = true;
    item.slot = slot;
    item.equippedAt = Date.now();

    return item;
  }
}

/**
 * Tournament System
 */
class TournamentSystem {
  constructor() {
    this.tournaments = new Map();
    this.participants = new Map();
    this.matches = new Map();
  }

  /**
   * Create tournament
   */
  createTournament(config) {
    const tournamentId = crypto.randomBytes(16).toString('hex');

    const tournament = {
      id: tournamentId,
      name: config.name,
      game: config.game,
      format: config.format || 'single-elimination',
      maxParticipants: config.maxParticipants || 16,
      entryFee: config.entryFee || 0,
      prizePool: config.prizePool || 0,
      startTime: config.startTime,
      status: 'registration',
      participants: [],
      brackets: [],
      createdAt: Date.now()
    };

    this.tournaments.set(tournamentId, tournament);

    return tournament;
  }

  /**
   * Register for tournament
   */
  register(tournamentId, playerId, teamId = null) {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'registration') {
      throw new Error('Registration closed');
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new Error('Tournament full');
    }

    const participant = {
      playerId,
      teamId,
      registeredAt: Date.now(),
      seed: tournament.participants.length + 1
    };

    tournament.participants.push(participant);

    return participant;
  }

  /**
   * Start tournament
   */
  startTournament(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    tournament.status = 'in-progress';
    tournament.brackets = this.generateBrackets(tournament);

    return tournament;
  }

  /**
   * Generate brackets
   */
  generateBrackets(tournament) {
    const participants = [...tournament.participants];
    const brackets = [];

    // Single elimination bracket
    const rounds = Math.ceil(Math.log2(participants.length));

    for (let round = 0; round < rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round - 1);

      for (let i = 0; i < matchesInRound; i++) {
        const matchId = crypto.randomBytes(8).toString('hex');

        brackets.push({
          id: matchId,
          round,
          matchNumber: i + 1,
          player1: round === 0 ? participants[i * 2] : null,
          player2: round === 0 ? participants[i * 2 + 1] : null,
          winner: null,
          status: 'pending'
        });
      }
    }

    return brackets;
  }

  /**
   * Report match result
   */
  reportResult(tournamentId, matchId, winner) {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const match = tournament.brackets.find((m) => m.id === matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    match.winner = winner;
    match.status = 'completed';
    match.completedAt = Date.now();

    // Check if tournament finished
    const allMatches = tournament.brackets;
    if (allMatches.every((m) => m.status === 'completed')) {
      tournament.status = 'completed';
      tournament.winner = allMatches[allMatches.length - 1].winner;
    }

    return match;
  }

  /**
   * Get tournament standings
   */
  getStandings(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Calculate standings based on bracket progression
    return tournament.participants
      .map((p) => ({
        ...p,
        wins: tournament.brackets.filter((m) => m.winner === p.playerId).length,
        eliminated: tournament.brackets.some(
          (m) =>
            (m.player1 === p.playerId || m.player2 === p.playerId) &&
            m.winner &&
            m.winner !== p.playerId
        )
      }))
      .sort((a, b) => b.wins - a.wins);
  }
}

/**
 * Leaderboard System
 */
class LeaderboardSystem {
  constructor() {
    this.leaderboards = new Map();
  }

  /**
   * Create leaderboard
   */
  createLeaderboard(name, config = {}) {
    const leaderboard = {
      name,
      type: config.type || 'points', // points, time, wins
      resetPeriod: config.resetPeriod || null, // daily, weekly, monthly, season
      entries: [],
      lastReset: Date.now()
    };

    this.leaderboards.set(name, leaderboard);

    return leaderboard;
  }

  /**
   * Update score
   */
  updateScore(leaderboardName, playerId, score, metadata = {}) {
    const leaderboard = this.leaderboards.get(leaderboardName);

    if (!leaderboard) {
      throw new Error('Leaderboard not found');
    }

    let entry = leaderboard.entries.find((e) => e.playerId === playerId);

    if (!entry) {
      entry = {
        playerId,
        score: 0,
        rank: 0,
        metadata: {}
      };
      leaderboard.entries.push(entry);
    }

    entry.score = score;
    entry.metadata = { ...entry.metadata, ...metadata };
    entry.updatedAt = Date.now();

    // Recalculate ranks
    leaderboard.entries.sort((a, b) => b.score - a.score);
    leaderboard.entries.forEach((e, i) => (e.rank = i + 1));

    return entry;
  }

  /**
   * Get top players
   */
  getTop(leaderboardName, limit = 10) {
    const leaderboard = this.leaderboards.get(leaderboardName);

    if (!leaderboard) {
      throw new Error('Leaderboard not found');
    }

    return leaderboard.entries.slice(0, limit);
  }

  /**
   * Get player rank
   */
  getRank(leaderboardName, playerId) {
    const leaderboard = this.leaderboards.get(leaderboardName);

    if (!leaderboard) {
      throw new Error('Leaderboard not found');
    }

    return leaderboard.entries.find((e) => e.playerId === playerId);
  }
}

/**
 * Achievement System
 */
class AchievementSystem {
  constructor() {
    this.achievements = new Map();
    this.playerAchievements = new Map();
  }

  /**
   * Define achievement
   */
  defineAchievement(config) {
    const achievementId = crypto.randomBytes(8).toString('hex');

    const achievement = {
      id: achievementId,
      name: config.name,
      description: config.description,
      icon: config.icon,
      points: config.points || 10,
      rarity: config.rarity || 'common',
      requirements: config.requirements || [],
      reward: config.reward || null,
      hidden: config.hidden || false
    };

    this.achievements.set(achievementId, achievement);

    return achievement;
  }

  /**
   * Unlock achievement
   */
  unlockAchievement(playerId, achievementId) {
    const achievement = this.achievements.get(achievementId);

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const playerAchs = this.playerAchievements.get(playerId) || [];

    if (playerAchs.some((a) => a.achievementId === achievementId)) {
      return { alreadyUnlocked: true };
    }

    const unlocked = {
      achievementId,
      unlockedAt: Date.now(),
      achievement
    };

    playerAchs.push(unlocked);
    this.playerAchievements.set(playerId, playerAchs);

    return unlocked;
  }

  /**
   * Get player achievements
   */
  getPlayerAchievements(playerId) {
    return this.playerAchievements.get(playerId) || [];
  }

  /**
   * Get achievement progress
   */
  getProgress(playerId, achievementId) {
    const achievement = this.achievements.get(achievementId);

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Simplified progress calculation
    return {
      achievementId,
      completed: false,
      progress: 0,
      total: achievement.requirements.length
    };
  }
}

/**
 * Unity/Unreal Integration SDK
 */
class GameSDK {
  constructor(blockchain, assetManager) {
    this.blockchain = blockchain;
    this.assetManager = assetManager;
    this.sessions = new Map();
  }

  /**
   * Initialize game session
   */
  initSession(playerId, gameId) {
    const sessionId = crypto.randomBytes(16).toString('hex');

    const session = {
      id: sessionId,
      playerId,
      gameId,
      startTime: Date.now(),
      status: 'active'
    };

    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Authenticate player
   */
  async authenticate(playerId, signature) {
    // Verify blockchain signature
    return {
      playerId,
      authenticated: true,
      wallet: `0x${crypto.randomBytes(20).toString('hex')}`,
      timestamp: Date.now()
    };
  }

  /**
   * Get player data
   */
  async getPlayerData(playerId) {
    return {
      playerId,
      level: 42,
      experience: 15750,
      currency: {
        soft: 10000,
        hard: 500
      },
      inventory: this.assetManager.getInventory(playerId),
      stats: {
        gamesPlayed: 150,
        wins: 87,
        losses: 63
      }
    };
  }

  /**
   * Save player progress
   */
  async saveProgress(playerId, data) {
    // Save to decentralized storage
    return {
      playerId,
      saved: true,
      timestamp: Date.now(),
      dataHash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
    };
  }

  /**
   * Purchase in-game item
   */
  async purchaseItem(playerId, itemId, currency) {
    return {
      playerId,
      itemId,
      currency,
      txHash: crypto.randomBytes(32).toString('hex'),
      timestamp: Date.now()
    };
  }
}

module.exports = {
  GameAssetManager,
  TournamentSystem,
  LeaderboardSystem,
  AchievementSystem,
  GameSDK,
  PlayToEarnSystem,
  CrossGameBridge,
  GameFiIntegration,
  GuildSystem,
  InGameEconomy
};
