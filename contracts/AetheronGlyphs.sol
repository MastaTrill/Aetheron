// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title  AetheronGlyphs
 * @notice ERC-721 NFT for the Aetheron protocol. Glyphs are identity tokens
 *         issued to protocol participants.
 *
 * OZ v5 compatible: Counters.sol was removed in OZ v5.
 * Uses plain uint256 _nextTokenId instead.
 */
contract AetheronGlyphs is
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable2Step
{
    // ── Token ID counter (starts at 1) ────────────────────────────────────────
    uint256 private _nextTokenId = 1;

    // ── Events ────────────────────────────────────────────────────────────────
    event GlyphMinted(address indexed to, uint256 indexed tokenId, string uri);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address initialOwner)
        ERC721("AetheronGlyphs", "AGLYPH")
        Ownable(initialOwner)
    {}

    // ─────────────────────────────────────────────────────────────────────────
    // Minting
    // ─────────────────────────────────────────────────────────────────────────

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
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit GlyphMinted(to, tokenId, uri);
        return tokenId;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Returns the next token ID that will be minted
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /// @notice Returns total number of tokens minted so far
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OZ v5 overrides (required by compiler)
    // ─────────────────────────────────────────────────────────────────────────

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
}
