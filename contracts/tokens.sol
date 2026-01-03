// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Aetheron Token Addresses (Multi-Chain)
// Local Hardhat Network:
// - AetheronToken (ERC-20): 0x5FbDB2315678afecb367f032d93F642f64180aa3
// - AetheronGlyphs (ERC-721): 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
//
// Mainnet addresses will be generated after deployment

/// @title AetheronToken
/// @notice ERC-20 token with burn and allowance management
/// @dev Optimized with immutable owner and unchecked blocks
contract AetheronToken {
    string public constant name = "Aetheron";
    string public constant symbol = "AETH";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public immutable owner; // Gas optimization: immutable

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Burn(address indexed burner, uint256 value);

    /// @notice Constructor sets deployer as owner
    /// @param initialSupply Initial token supply to mint
    constructor(uint256 initialSupply) {
        owner = msg.sender;
        _mint(msg.sender, initialSupply);
    }

    /// @dev Internal mint function
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Mint to zero address");
        totalSupply += amount;
        unchecked {
            balanceOf[to] += amount;
        }
        emit Transfer(address(0), to, amount);
    }

    /// @notice Mint new tokens (only owner)
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        _mint(to, amount);
    }

    /// @notice Burn tokens from caller's balance
    /// @param amount Amount of tokens to burn
    /// @return success True if burn succeeded
    function burn(uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        unchecked {
            balanceOf[msg.sender] -= amount;
            totalSupply -= amount;
        }
        emit Burn(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
        return true;
    }

    /// @notice Increase allowance for spender
    /// @param spender Address to increase allowance for
    /// @param addedValue Amount to increase allowance by
    /// @return success True if operation succeeded
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        require(spender != address(0), "Approve to zero address");
        unchecked {
            allowance[msg.sender][spender] += addedValue;
        }
        emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
        return true;
    }

    /// @notice Decrease allowance for spender
    /// @param spender Address to decrease allowance for
    /// @param subtractedValue Amount to decrease allowance by
    /// @return success True if operation succeeded
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        uint256 currentAllowance = allowance[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "Decreased allowance below zero");
        unchecked {
            allowance[msg.sender][spender] = currentAllowance - subtractedValue;
        }
        emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
        return true;
    }

    /// @notice Transfer tokens to address
    /// @param to Recipient address
    /// @param amount Amount to transfer
    /// @return success True if transfer succeeded
    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        unchecked {
            balanceOf[msg.sender] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /// @notice Approve spender to spend tokens
    /// @param spender Address to approve
    /// @param amount Amount to approve
    /// @return success True if approval succeeded
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "Approve to zero address");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// @notice Transfer tokens from address to address
    /// @param from Sender address
    /// @param to Recipient address
    /// @param amount Amount to transfer
    /// @return success True if transfer succeeded
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");
        unchecked {
            allowance[from][msg.sender] -= amount;
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
        return true;
    }
}

contract AetheronGlyphs {
    string public name = "AetheronGlyphs";
    string public symbol = "AGLYPH";

    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => string) public tokenURI;
    mapping(uint256 => address) public approvals;
    mapping(address => mapping(address => bool)) public operatorApprovals;

    uint256 public nextTokenId = 1;
    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor() {
        owner = msg.sender;
    }

    function mint(address to, string memory uri) public returns (uint256) {
        require(msg.sender == owner, "Only owner can mint");
        uint256 tokenId = nextTokenId++;
        ownerOf[tokenId] = to;
        tokenURI[tokenId] = uri;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function transfer(address from, address to, uint256 tokenId) public {
        require(ownerOf[tokenId] == from, "Not the owner");
        require(msg.sender == from || msg.sender == approvals[tokenId] || operatorApprovals[from][msg.sender], "Not approved");
        ownerOf[tokenId] = to;
        approvals[tokenId] = address(0);
        emit Transfer(from, to, tokenId);
    }

    function approve(address approved, uint256 tokenId) public {
        address tokenOwner = ownerOf[tokenId];
        require(msg.sender == tokenOwner, "Not the owner");
        approvals[tokenId] = approved;
        emit Approval(tokenOwner, approved, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public {
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        return approvals[tokenId];
    }

    function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
        return operatorApprovals[tokenOwner][operator];
    }
}