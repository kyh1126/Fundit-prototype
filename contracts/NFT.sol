// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

contract NFT is Ownable, ERC721URIStorage, Pausable {
    uint256 private _nextTokenId = 1;
    uint256 public constant MAX_BATCH_SIZE = 100;

    constructor() ERC721("DataToken", "DTT") Ownable() {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, string memory uri) public onlyOwner whenNotPaused {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function batchMint(address to, string[] memory uris) public onlyOwner whenNotPaused {
        require(uris.length <= MAX_BATCH_SIZE, "Batch size too large");
        require(uris.length > 0, "Empty batch");

        for (uint256 i = 0; i < uris.length; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize)
        internal
        virtual
        override
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
}
