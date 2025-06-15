// ERC-20 Token Standard Implementation
class ERC20Token {
  constructor(name, symbol, decimals = 18, totalSupply = 0) {
    this.name = name;
    this.symbol = symbol;
    this.decimals = decimals;
    this.totalSupply = totalSupply;
    this.balances = {};
  }

  mint(address, amount) {
    this.totalSupply += amount;
    this.balances[address] = (this.balances[address] || 0) + amount;
  }

  transfer(from, to, amount) {
    if ((this.balances[from] || 0) < amount) throw new Error('Insufficient balance');
    this.balances[from] -= amount;
    this.balances[to] = (this.balances[to] || 0) + amount;
  }

  balanceOf(address) {
    return this.balances[address] || 0;
  }
}

// ERC-721 NFT Standard Implementation
class ERC721Token {
  constructor(name, symbol) {
    this.name = name;
    this.symbol = symbol;
    this.owners = {}; // tokenId => owner
    this.tokenURIs = {}; // tokenId => metadata URI
    this.nextTokenId = 1;
  }

  mint(to, tokenURI) {
    const tokenId = this.nextTokenId++;
    this.owners[tokenId] = to;
    this.tokenURIs[tokenId] = tokenURI;
    return tokenId;
  }

  transfer(from, to, tokenId) {
    if (this.owners[tokenId] !== from) throw new Error('Not the owner');
    this.owners[tokenId] = to;
  }

  ownerOf(tokenId) {
    return this.owners[tokenId];
  }

  tokenURI(tokenId) {
    return this.tokenURIs[tokenId];
  }
}

module.exports = { ERC20Token, ERC721Token };
