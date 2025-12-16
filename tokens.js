
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AetheronToken {
    string public name = "Aetheron";
    string public symbol = "AETH";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        owner = 0x8a3ad49656bd07981c9cfc7ad826a808847c3452;
        mint(owner, initialSupply);
    }

    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
        owner = 0x8a3ad49656bd07981c9cfc7ad826a808847c3452;
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