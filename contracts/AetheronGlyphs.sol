// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AetheronGlyphs is ERC721, ERC721URIStorage, ERC721Burnable, Ownable2Step {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    event GlyphMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor(address initialOwner) ERC721("AetheronGlyphs", "AGLYPH") Ownable(initialOwner) {
        _tokenIdCounter.increment();
    }

    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        require(to != address(0), "AetheronGlyphs: mint to zero address");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit GlyphMinted(to, tokenId, uri);
        return tokenId;
    }

    function nextTokenId() external view returns (uint256) { return _tokenIdCounter.current(); }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        return super._update(to, tokenId, auth);
    }
}