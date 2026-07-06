// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Treasury is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20  public aeth;
    address public guardian;
    uint256 public treasuryCap;
    uint256 public totalReceived;

    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount, string reason);
    event ETHWithdrawn(address indexed to, uint256 amount, string reason);
    event KeeperRewardsFunded(address indexed epochManager, uint256 amount);
    event EmissionReceived(uint256 amount, uint256 epoch);
    event EmergencyWithdrawal(address indexed to, uint256 amount);
    event TreasuryCapUpdated(uint256 oldCap, uint256 newCap);
    event GuardianUpdated(address indexed oldGuardian, address indexed newGuardian);

    error NotGuardianOrOwner();
    error TreasuryCapExceeded();
    error InsufficientBalance();
    error ZeroAddress();
    error ZeroAmount();
    error TransferFailed();

    modifier onlyGuardianOrOwner() {
        if (msg.sender != guardian && msg.sender != owner()) revert NotGuardianOrOwner();
        _;
    }

    constructor(
        address initialOwner,
        address _aeth,
        address _guardian,
        uint256 _treasuryCap
    ) Ownable(initialOwner) {
        if (_aeth == address(0) || _guardian == address(0)) revert ZeroAddress();
        aeth = IERC20(_aeth);
        guardian = _guardian;
        treasuryCap = _treasuryCap;
    }

    receive() external payable {}

    function withdrawFunds(
        address token,
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyOwner whenNotPaused nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        IERC20(token).safeTransfer(to, amount);
        emit FundsWithdrawn(token, to, amount, reason);
    }

    function withdrawETH(
        address payable to,
        uint256 amount,
        string calldata reason
    ) external onlyOwner whenNotPaused nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (address(this).balance < amount) revert InsufficientBalance();
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit ETHWithdrawn(to, amount, reason);
    }

    function fundKeeperRewards(
        address epochManager,
        uint256 amount
    ) external onlyOwner whenNotPaused nonReentrant {
        if (epochManager == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        aeth.safeTransfer(epochManager, amount);
        emit KeeperRewardsFunded(epochManager, amount);
    }

    function receiveEmission(uint256 amount, uint256 epoch) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (totalReceived + amount > treasuryCap) revert TreasuryCapExceeded();
        totalReceived += amount;
        emit EmissionReceived(amount, epoch);
    }

    function emergencyWithdraw(address payable to) external onlyGuardianOrOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 aethBal = aeth.balanceOf(address(this));
        if (aethBal > 0) {
            aeth.safeTransfer(to, aethBal);
        }
        uint256 ethBal = address(this).balance;
        if (ethBal > 0) {
            (bool success, ) = to.call{value: ethBal}("");
            if (!success) revert TransferFailed();
        }
        emit EmergencyWithdrawal(to, aethBal + ethBal);
    }

    function setTreasuryCap(uint256 newCap) external onlyOwner {
        emit TreasuryCapUpdated(treasuryCap, newCap);
        treasuryCap = newCap;
    }

    function setGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0)) revert ZeroAddress();
        emit GuardianUpdated(guardian, newGuardian);
        guardian = newGuardian;
    }

    function pause() external onlyGuardianOrOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}