// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISentinelKeeperRegistry {
    function isActive(address keeper) external view returns (bool);
}

contract Sentinel is Ownable2Step, Pausable, ReentrancyGuard {
    ISentinelKeeperRegistry public keeperRegistry;
    address public guardian;

    enum SentinelStatus { INACTIVE, ACTIVE, SUSPENDED }
    enum AnomalyStatus  { OPEN, CLEARED, ESCALATED }

    struct SentinelNode {
        SentinelStatus status;
        string         endpoint;
        uint256        activatedAt;
        uint256        lastHealthCheck;
        uint256        healthCheckCount;
    }

    struct Anomaly {
        bytes32       anomalyHash;
        string        description;
        AnomalyStatus status;
        address       reporter;
        uint256       reportedAt;
        uint256       resolvedAt;
    }

    bool    public systemHealthy = true;
    uint256 public rewardRate;
    uint256 public healthCheckInterval = 300; // 5 minutes in seconds

    mapping(address => SentinelNode) public sentinels;
    mapping(bytes32 => Anomaly) public anomalies;
    address[] public sentinelList;
    bytes32[] public anomalyList;

    event SentinelActivated(address indexed node, string endpoint);
    event SentinelDeactivated(address indexed node);
    event SentinelSuspended(address indexed node);
    event HealthCheckSubmitted(address indexed node, uint256 timestamp);
    event AnomalyReported(bytes32 indexed anomalyHash, string description, address indexed reporter);
    event AnomalyCleared(bytes32 indexed anomalyHash);
    event AnomalyEscalated(bytes32 indexed anomalyHash);
    event SystemHealthUpdated(bool healthy);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event HealthCheckIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event GuardianUpdated(address indexed oldGuardian, address indexed newGuardian);

    error NotGuardianOrOwner();
    error SentinelNotActive();
    error SentinelAlreadyActive();
    error AnomalyNotFound();
    error AnomalyNotOpen();
    error HealthCheckTooEarly();
    error ZeroAddress();
    error InvalidEndpoint();

    modifier onlyGuardianOrOwner() {
        if (msg.sender != guardian && msg.sender != owner()) revert NotGuardianOrOwner();
        _;
    }

    modifier onlyActiveSentinel() {
        if (sentinels[msg.sender].status != SentinelStatus.ACTIVE) revert SentinelNotActive();
        _;
    }

    constructor(
        address initialOwner,
        address _keeperRegistry,
        address _guardian
    ) Ownable(initialOwner) {
        if (_keeperRegistry == address(0) || _guardian == address(0)) revert ZeroAddress();
        keeperRegistry = ISentinelKeeperRegistry(_keeperRegistry);
        guardian = _guardian;
    }

    function activateSentinel(string calldata endpoint) external onlyOwner whenNotPaused {
        address node = msg.sender;
        if (bytes(endpoint).length == 0) revert InvalidEndpoint();
        if (sentinels[node].status == SentinelStatus.ACTIVE) revert SentinelAlreadyActive();
        sentinels[node] = SentinelNode({
            status: SentinelStatus.ACTIVE,
            endpoint: endpoint,
            activatedAt: block.timestamp,
            lastHealthCheck: block.timestamp,
            healthCheckCount: 0
        });
        sentinelList.push(node);
        emit SentinelActivated(node, endpoint);
    }

    function deactivateSentinel(address node) external onlyGuardianOrOwner {
        if (sentinels[node].status == SentinelStatus.INACTIVE) revert SentinelNotActive();
        sentinels[node].status = SentinelStatus.INACTIVE;
        emit SentinelDeactivated(node);
    }

    function suspendSentinel(address node) external onlyGuardianOrOwner {
        if (sentinels[node].status != SentinelStatus.ACTIVE) revert SentinelNotActive();
        sentinels[node].status = SentinelStatus.SUSPENDED;
        emit SentinelSuspended(node);
    }

    function submitHealthCheck() external onlyActiveSentinel whenNotPaused {
        SentinelNode storage node = sentinels[msg.sender];
        if (block.timestamp < node.lastHealthCheck + healthCheckInterval)
            revert HealthCheckTooEarly();
        node.lastHealthCheck = block.timestamp;
        node.healthCheckCount++;
        emit HealthCheckSubmitted(msg.sender, block.timestamp);
    }

    function reportAnomaly(bytes32 anomalyHash, string calldata description)
        external onlyActiveSentinel whenNotPaused {
        anomalies[anomalyHash] = Anomaly({
            anomalyHash: anomalyHash,
            description: description,
            status: AnomalyStatus.OPEN,
            reporter: msg.sender,
            reportedAt: block.timestamp,
            resolvedAt: 0
        });
        anomalyList.push(anomalyHash);
        systemHealthy = false;
        emit SystemHealthUpdated(false);
        emit AnomalyReported(anomalyHash, description, msg.sender);
    }

    function clearAnomaly(bytes32 anomalyHash) external onlyGuardianOrOwner {
        Anomaly storage a = anomalies[anomalyHash];
        if (a.reportedAt == 0) revert AnomalyNotFound();
        if (a.status != AnomalyStatus.OPEN) revert AnomalyNotOpen();
        a.status = AnomalyStatus.CLEARED;
        a.resolvedAt = block.timestamp;
        _recheckSystemHealth();
        emit AnomalyCleared(anomalyHash);
    }

    function escalateAnomaly(bytes32 anomalyHash) external onlyGuardianOrOwner {
        Anomaly storage a = anomalies[anomalyHash];
        if (a.reportedAt == 0) revert AnomalyNotFound();
        if (a.status != AnomalyStatus.OPEN) revert AnomalyNotOpen();
        a.status = AnomalyStatus.ESCALATED;
        emit AnomalyEscalated(anomalyHash);
    }

    function _recheckSystemHealth() internal {
        for (uint256 i = 0; i < anomalyList.length; i++) {
            if (anomalies[anomalyList[i]].status == AnomalyStatus.OPEN) {
                return; // still unhealthy
            }
        }
        systemHealthy = true;
        emit SystemHealthUpdated(true);
    }

    function getSentinelStatus(address node) external view returns (SentinelNode memory) {
        return sentinels[node];
    }

    function getAnomaly(bytes32 anomalyHash) external view returns (Anomaly memory) {
        return anomalies[anomalyHash];
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        emit RewardRateUpdated(rewardRate, newRate);
        rewardRate = newRate;
    }

    function setHealthCheckInterval(uint256 newInterval) external onlyOwner {
        emit HealthCheckIntervalUpdated(healthCheckInterval, newInterval);
        healthCheckInterval = newInterval;
    }

    function setGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0)) revert ZeroAddress();
        emit GuardianUpdated(guardian, newGuardian);
        guardian = newGuardian;
    }

    function pause() external onlyGuardianOrOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}