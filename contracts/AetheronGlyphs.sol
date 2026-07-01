// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title  AetheronGlyphs
 * @notice ERC-721 NFT for the Aetheron protocol — Glyphs are soulbound
 *         identity tokens issued to protocol participants.
 *
 * OZ v5 fix: Removed Counters.sol (removed in OZ v5).
 *            Replaced with uint256 _nextTokenId incremented manually.
 */
contract AetheronGlyphs is
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable2Step
{
    uint256 private _nextTokenId = 1;

    event GlyphMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor(address initialOwner)
        ERC721("AetheronGlyphs", "AGLYPH")
        Ownable(initialOwner)
    {}

    /**
     * @notice Mint a new Glyph NFT. Owner only.
     * @param  to  Recipient address
     * @param  uri Token metadata URI
     * @return tokenId The newly minted token ID
     */
    function mint(address to, string memory uri)
        public
        onlyOwner
        returns (uint256)
    {
        require(to != address(0), "AetheronGlyphs: mint to zero address");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit GlyphMinted(to, tokenId, uri);
        return tokenId;
    }

    // ── OZ v5 overrides ───────────────────────────────────────────────────────
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Returns total tokens minted so far.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
