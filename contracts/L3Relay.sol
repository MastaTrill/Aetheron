// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISentinel {
    function systemHealthy() external view returns (bool);
}

interface IRelayKeeperRegistry {
    function isActive(address keeper) external view returns (bool);
}

contract L3Relay is Ownable2Step, Pausable, ReentrancyGuard {
    IRelayKeeperRegistry public keeperRegistry;
    ISentinel            public sentinel;
    address              public guardian;
    string               public rpcEndpoint;

    enum MessageStatus { PENDING, ACKNOWLEDGED, FAILED, RETRYING }

    struct CrossChainMessage {
        bytes32       messageHash;
        address       sender;
        bytes         payload;
        MessageStatus status;
        uint256       submittedAt;
        uint256       acknowledgedAt;
        uint256       retryCount;
    }

    uint256 public constant ACK_TIMEOUT_SECONDS = 120;
    uint256 public constant MAX_RETRIES         = 5;
    uint256 public constant MAX_PAYLOAD_SIZE    = 32768;

    mapping(bytes32 => CrossChainMessage) public messages;
    bytes32[] public messageList;
    uint256 public totalMessages;
    uint256 public acknowledgedCount;
    uint256 public failedCount;

    event MessageSubmitted(bytes32 indexed messageHash, address indexed sender, uint256 payloadSize);
    event MessageAcknowledged(bytes32 indexed messageHash, uint256 timestamp);
    event MessageFailed(bytes32 indexed messageHash, uint256 retryCount);
    event MessageRetrying(bytes32 indexed messageHash, uint256 retryCount);
    event RPCEndpointUpdated(string oldEndpoint, string newEndpoint);
    event GuardianUpdated(address indexed oldGuardian, address indexed newGuardian);

    error SystemUnhealthy();
    error PayloadTooLarge();
    error PayloadEmpty();
    error MessageNotFound();
    error MessageNotPending();
    error MessageNotFailed();
    error MaxRetriesExceeded();
    error NotGuardianOrOwner();
    error ZeroAddress();
    error InvalidEndpoint();

    modifier onlyGuardianOrOwner() {
        if (msg.sender != guardian && msg.sender != owner()) revert NotGuardianOrOwner();
        _;
    }

    modifier onlyWhenHealthy() {
        if (!sentinel.systemHealthy()) revert SystemUnhealthy();
        _;
    }

    constructor(
        address initialOwner,
        address _keeperRegistry,
        address _sentinel,
        address _guardian,
        string memory _rpcEndpoint
    ) Ownable(initialOwner) {
        if (_keeperRegistry == address(0) || _sentinel == address(0) || _guardian == address(0))
            revert ZeroAddress();
        if (bytes(_rpcEndpoint).length == 0) revert InvalidEndpoint();
        keeperRegistry = IRelayKeeperRegistry(_keeperRegistry);
        sentinel = ISentinel(_sentinel);
        guardian = _guardian;
        rpcEndpoint = _rpcEndpoint;
    }

    function submitCrossChainMessage(bytes calldata payload)
        external whenNotPaused nonReentrant onlyWhenHealthy returns (bytes32) {
        if (payload.length == 0) revert PayloadEmpty();
        if (payload.length > MAX_PAYLOAD_SIZE) revert PayloadTooLarge();

        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender, payload, block.timestamp, totalMessages
        ));

        messages[messageHash] = CrossChainMessage({
            messageHash: messageHash,
            sender: msg.sender,
            payload: payload,
            status: MessageStatus.PENDING,
            submittedAt: block.timestamp,
            acknowledgedAt: 0,
            retryCount: 0
        });

        messageList.push(messageHash);
        totalMessages++;

        emit MessageSubmitted(messageHash, msg.sender, payload.length);
        return messageHash;
    }

    function acknowledgeCrossChainMessage(bytes32 messageHash)
        external onlyGuardianOrOwner nonReentrant {
        CrossChainMessage storage m = messages[messageHash];
        if (m.submittedAt == 0) revert MessageNotFound();
        if (m.status != MessageStatus.PENDING && m.status != MessageStatus.RETRYING)
            revert MessageNotPending();

        m.status = MessageStatus.ACKNOWLEDGED;
        m.acknowledgedAt = block.timestamp;
        acknowledgedCount++;

        emit MessageAcknowledged(messageHash, block.timestamp);
    }

    function retryFailedMessage(bytes32 messageHash)
        external whenNotPaused nonReentrant onlyWhenHealthy {
        CrossChainMessage storage m = messages[messageHash];
        if (m.submittedAt == 0) revert MessageNotFound();
        if (m.status != MessageStatus.FAILED) revert MessageNotFailed();
        if (m.retryCount >= MAX_RETRIES) revert MaxRetriesExceeded();

        m.retryCount++;
        m.status = MessageStatus.RETRYING;

        emit MessageRetrying(messageHash, m.retryCount);
    }

    function markMessageFailed(bytes32 messageHash) external onlyGuardianOrOwner {
        CrossChainMessage storage m = messages[messageHash];
        if (m.submittedAt == 0) revert MessageNotFound();
        m.status = MessageStatus.FAILED;
        failedCount++;
        emit MessageFailed(messageHash, m.retryCount);
    }

    function getMessageStatus(bytes32 messageHash) external view returns (CrossChainMessage memory) {
        return messages[messageHash];
    }

    function setRPCEndpoint(string calldata newEndpoint) external onlyOwner {
        if (bytes(newEndpoint).length == 0) revert InvalidEndpoint();
        emit RPCEndpointUpdated(rpcEndpoint, newEndpoint);
        rpcEndpoint = newEndpoint;
    }

    function setGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0)) revert ZeroAddress();
        emit GuardianUpdated(guardian, newGuardian);
        guardian = newGuardian;
    }

    function pause() external onlyGuardianOrOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}