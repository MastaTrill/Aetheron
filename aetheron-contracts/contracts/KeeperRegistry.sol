// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract KeeperRegistry is Ownable2Step, Pausable, ReentrancyGuard {
    struct KeeperRecord {
        bool      active;
        bytes32   permissionsHash;
        uint256   registeredAt;
        uint256   expiresAt;
        uint256   stakedBalance;
        uint256   lastExecution;
        string    module;
    }

    uint256 public constant REGISTRATION_PERIOD = 90 days;
    uint256 public constant SLASH_COOLDOWN      = 1 days;

    mapping(address => KeeperRecord) public keepers;
    address[] public keeperList;
    address public guardian;
    mapping(address => uint256) public slashCount;
    mapping(address => uint256) public lastSlashedAt;

    event KeeperRegistered(address indexed keeper, bytes32 permissionsHash, string module, uint256 expiresAt);
    event KeeperDeregistered(address indexed keeper, address indexed by);
    event KeeperRenewed(address indexed keeper, uint256 newExpiresAt);
    event KeeperSlashed(address indexed keeper, uint256 amount, address indexed by);
    event KeeperExecuted(address indexed keeper, bytes4 selector);
    event KeeperPermissionsUpdated(address indexed keeper, bytes32 newHash);
    event GuardianUpdated(address indexed oldGuardian, address indexed newGuardian);

    error NotGuardianOrOwner();
    error KeeperAlreadyActive();
    error KeeperNotActive();
    error KeeperExpired();
    error KeeperNotExpired();
    error InsufficientStake();
    error SlashCooldownActive();
    error ZeroAddress();

    modifier onlyGuardianOrOwner() {
        if (msg.sender != guardian && msg.sender != owner()) revert NotGuardianOrOwner();
        _;
    }

    modifier keeperActive(address keeper) {
        if (!keepers[keeper].active) revert KeeperNotActive();
        if (block.timestamp > keepers[keeper].expiresAt) revert KeeperExpired();
        _;
    }

    constructor(address initialOwner, address _guardian) Ownable(initialOwner) {
        if (initialOwner == address(0) || _guardian == address(0)) revert ZeroAddress();
        guardian = _guardian;
    }

    function registerKeeper(address keeper, bytes32 permissionsHash, string calldata module)
        external onlyOwner whenNotPaused {
        if (keeper == address(0)) revert ZeroAddress();
        if (keepers[keeper].active) revert KeeperAlreadyActive();
        uint256 expiresAt = block.timestamp + REGISTRATION_PERIOD;
        keepers[keeper] = KeeperRecord({ active: true, permissionsHash: permissionsHash,
            registeredAt: block.timestamp, expiresAt: expiresAt, stakedBalance: 0,
            lastExecution: 0, module: module });
        keeperList.push(keeper);
        emit KeeperRegistered(keeper, permissionsHash, module, expiresAt);
    }

    function deregisterKeeper(address keeper) external onlyGuardianOrOwner {
        if (!keepers[keeper].active) revert KeeperNotActive();
        keepers[keeper].active = false;
        emit KeeperDeregistered(keeper, msg.sender);
    }

    function renewKeeperRegistration() external whenNotPaused {
        address keeper = msg.sender;
        KeeperRecord storage record = keepers[keeper];
        if (!record.active) revert KeeperNotActive();
        record.expiresAt = block.timestamp + REGISTRATION_PERIOD;
        emit KeeperRenewed(keeper, record.expiresAt);
    }

    function updateKeeperPermissions(address keeper, bytes32 newHash) external onlyOwner keeperActive(keeper) {
        keepers[keeper].permissionsHash = newHash;
        emit KeeperPermissionsUpdated(keeper, newHash);
    }

    function slashKeeper(address keeper, uint256 amount) external onlyGuardianOrOwner nonReentrant {
        KeeperRecord storage record = keepers[keeper];
        if (!record.active) revert KeeperNotActive();
        if (block.timestamp < lastSlashedAt[keeper] + SLASH_COOLDOWN) revert SlashCooldownActive();
        if (record.stakedBalance < amount) revert InsufficientStake();
        record.stakedBalance -= amount;
        slashCount[keeper]++;
        lastSlashedAt[keeper] = block.timestamp;
        if (record.stakedBalance == 0) record.active = false;
        emit KeeperSlashed(keeper, amount, msg.sender);
    }

    function recordStake(address keeper, uint256 amount) external onlyOwner {
        require(keepers[keeper].active, "KeeperRegistry: keeper not active");
        keepers[keeper].stakedBalance += amount;
    }

    function logExecution(address keeper, bytes4 selector) external keeperActive(keeper) {
        keepers[keeper].lastExecution = block.timestamp;
        emit KeeperExecuted(keeper, selector);
    }

    function isActive(address keeper) external view returns (bool) {
        return keepers[keeper].active && block.timestamp <= keepers[keeper].expiresAt;
    }

    function getKeeperStatus(address keeper) external view returns (KeeperRecord memory) {
        return keepers[keeper];
    }

    function totalKeepers() external view returns (uint256) { return keeperList.length; }
    function getAllKeepers() external view returns (address[] memory) { return keeperList; }

    function setGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0)) revert ZeroAddress();
        emit GuardianUpdated(guardian, newGuardian);
        guardian = newGuardian;
    }

    function pause() external onlyGuardianOrOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}