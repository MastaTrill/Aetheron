// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

contract AetheronToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable2Step {
    mapping(address => bool) public isMinter;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;
    event MinterGranted(address indexed account);
    event MinterRevoked(address indexed account);
    error NotMinter();
    error SupplyCapExceeded();

    constructor(uint256 initialSupply, address initialOwner)
        ERC20("Aetheron", "AETH")
        ERC20Permit("Aetheron")
        Ownable(initialOwner)
    {
        if (initialSupply > MAX_SUPPLY) revert SupplyCapExceeded();
        if (initialOwner == address(0)) revert OwnableInvalidOwner(address(0));
        _mint(initialOwner, initialSupply);
    }

    function grantMinter(address account) external onlyOwner {
        require(account != address(0), "AetheronToken: zero address");
        isMinter[account] = true;
        emit MinterGranted(account);
    }

    function revokeMinter(address account) external onlyOwner {
        isMinter[account] = false;
        emit MinterRevoked(account);
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != owner() && !isMinter[msg.sender]) revert NotMinter();
        require(to != address(0), "AetheronToken: mint to zero address");
        if (totalSupply() + amount > MAX_SUPPLY) revert SupplyCapExceeded();
        _mint(to, amount);
    }

    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        address account = msg.sender;
        _approve(account, spender, allowance(account, spender) + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        address account = msg.sender;
        uint256 current = allowance(account, spender);
        require(current >= subtractedValue, "AetheronToken: decreased allowance below zero");
        unchecked { _approve(account, spender, current - subtractedValue); }
        return true;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address account) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(account);
    }
}