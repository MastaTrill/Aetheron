// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAetheronToken {
    function mint(address to, uint256 amount) external;
}

interface IKeeperRegistry {
    function isActive(address keeper) external view returns (bool);
    function getAllKeepers() external view returns (address[] memory);
}

contract EpochManager is Ownable2Step, Pausable, ReentrancyGuard {
    IAetheronToken  public aeth;
    IKeeperRegistry public keeperRegistry;
    address         public treasury;

    uint256 public epochLengthBlocks;
    uint256 public emissionPerEpoch;
    uint256 public firstEpochStartBlock;
    uint256 public currentEpoch;

    uint256 public constant TREASURY_SHARE_BPS  = 2000; // 20%
    uint256 public constant KEEPER_SHARE_BPS    = 500;  // 5%
    uint256 public constant BPS_DENOMINATOR     = 10000;
    uint256 public constant TRIGGER_WINDOW      = 50;   // blocks before epoch end
    uint256 public constant GRACE_PERIOD         = 200;  // blocks after epoch end

    struct EpochInfo {
        uint256 startBlock;
        uint256 endBlock;
        uint256 emission;
        bool    transitioned;
        bool    distributed;
        uint256 treasuryAmount;
        uint256 keeperAmount;
        uint256 communityAmount;
    }

    mapping(uint256 => EpochInfo) public epochs;

    event EpochTransitioned(uint256 indexed epoch, uint256 startBlock, uint256 endBlock);
    event EpochRewardsDistributed(uint256 indexed epoch, uint256 treasuryAmt, uint256 keeperAmt, uint256 communityAmt);
    event EpochLengthUpdated(uint256 oldLength, uint256 newLength);
    event EmissionRateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    error EpochNotReady();
    error EpochAlreadyTransitioned();
    error EpochNotTransitioned();
    error EpochAlreadyDistributed();
    error InvalidEpochLength();
    error InvalidEmissionRate();
    error ZeroAddress();

    constructor(
        address initialOwner,
        address _aeth,
        address _keeperRegistry,
        address _treasury,
        uint256 _epochLengthBlocks,
        uint256 _emissionPerEpoch,
        uint256 _firstEpochStartBlock
    ) Ownable(initialOwner) {
        if (_aeth == address(0) || _keeperRegistry == address(0) || _treasury == address(0))
            revert ZeroAddress();
        if (_epochLengthBlocks == 0) revert InvalidEpochLength();
        if (_emissionPerEpoch == 0) revert InvalidEmissionRate();

        aeth = IAetheronToken(_aeth);
        keeperRegistry = IKeeperRegistry(_keeperRegistry);
        treasury = _treasury;
        epochLengthBlocks = _epochLengthBlocks;
        emissionPerEpoch = _emissionPerEpoch;
        firstEpochStartBlock = _firstEpochStartBlock;
        currentEpoch = 0;

        epochs[0] = EpochInfo({
            startBlock: _firstEpochStartBlock,
            endBlock: _firstEpochStartBlock + _epochLengthBlocks,
            emission: _emissionPerEpoch,
            transitioned: false,
            distributed: false,
            treasuryAmount: 0,
            keeperAmount: 0,
            communityAmount: 0
        });
    }

    function triggerEpochTransition() external whenNotPaused nonReentrant {
        EpochInfo storage current = epochs[currentEpoch];
        if (current.transitioned) revert EpochAlreadyTransitioned();

        uint256 epochEnd = current.endBlock;
        bool inTriggerWindow = block.number >= (epochEnd - TRIGGER_WINDOW);
        bool inGracePeriod = block.number <= (epochEnd + GRACE_PERIOD);
        if (!inTriggerWindow && !inGracePeriod) revert EpochNotReady();

        current.transitioned = true;

        uint256 nextEpoch = currentEpoch + 1;
        uint256 nextStart = epochEnd;
        uint256 nextEnd = nextStart + epochLengthBlocks;

        epochs[nextEpoch] = EpochInfo({
            startBlock: nextStart,
            endBlock: nextEnd,
            emission: emissionPerEpoch,
            transitioned: false,
            distributed: false,
            treasuryAmount: 0,
            keeperAmount: 0,
            communityAmount: 0
        });

        currentEpoch = nextEpoch;
        emit EpochTransitioned(nextEpoch, nextStart, nextEnd);
    }

    function distributeEpochRewards(uint256 epochNumber) external whenNotPaused nonReentrant {
        EpochInfo storage info = epochs[epochNumber];
        if (!info.transitioned) revert EpochNotTransitioned();
        if (info.distributed) revert EpochAlreadyDistributed();

        uint256 emission = info.emission;
        uint256 treasuryAmt = (emission * TREASURY_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 keeperAmt = (emission * KEEPER_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 communityAmt = emission - treasuryAmt - keeperAmt;

        info.treasuryAmount = treasuryAmt;
        info.keeperAmount = keeperAmt;
        info.communityAmount = communityAmt;
        info.distributed = true;

        aeth.mint(treasury, treasuryAmt);
        aeth.mint(address(keeperRegistry), keeperAmt);
        aeth.mint(owner(), communityAmt);

        emit EpochRewardsDistributed(epochNumber, treasuryAmt, keeperAmt, communityAmt);
    }

    function getEpochInfo(uint256 epochNumber) external view returns (EpochInfo memory) {
        return epochs[epochNumber];
    }

    function getCurrentEpochEnd() external view returns (uint256) {
        return epochs[currentEpoch].endBlock;
    }

    function blocksUntilNextEpoch() external view returns (uint256) {
        uint256 endBlock = epochs[currentEpoch].endBlock;
        if (block.number >= endBlock) return 0;
        return endBlock - block.number;
    }

    function setEpochLength(uint256 newLength) external onlyOwner {
        if (newLength == 0) revert InvalidEpochLength();
        emit EpochLengthUpdated(epochLengthBlocks, newLength);
        epochLengthBlocks = newLength;
    }

    function setEmissionRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert InvalidEmissionRate();
        emit EmissionRateUpdated(emissionPerEpoch, newRate);
        emissionPerEpoch = newRate;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}