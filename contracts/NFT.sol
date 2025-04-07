// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

contract NFT is Ownable, ERC721URIStorage, Pausable {
    uint256 private _nextTokenId = 1;
    uint256 public constant MAX_BATCH_SIZE = 100;

    // 메타데이터 버전 관리
    mapping(uint256 => uint256) private _metadataVersions;
    event MetadataUpdated(uint256 indexed tokenId, string newURI, uint256 version);

    // 배치 민팅 이벤트
    event BatchMinted(address indexed to, uint256 startTokenId, uint256 count, string[] uris);

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

    /**
     * @dev 여러 토큰을 한 번에 민팅합니다.
     * @param to 민팅할 주소
     * @param uris 토큰 URI 배열
     */
    function batchMint(address to, string[] memory uris) public onlyOwner whenNotPaused {
        require(uris.length > 0, "Empty batch");
        require(uris.length <= MAX_BATCH_SIZE, "Batch too large");
        
        uint256 startTokenId = _nextTokenId;
        uint256 count = uris.length;
        
        for (uint256 i = 0; i < uris.length; i++) {
            _safeMint(to, _nextTokenId);
            _setTokenURI(_nextTokenId, uris[i]);
            _nextTokenId++;
        }
        
        emit BatchMinted(to, startTokenId, count, uris);
    }

    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize)
        internal
        virtual
        override
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev 토큰의 URI를 업데이트합니다. 소유자만 호출 가능합니다.
     * @param tokenId 업데이트할 토큰 ID
     * @param _tokenURI 새로운 토큰 URI
     */
    function updateTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        _setTokenURI(tokenId, _tokenURI);
        _metadataVersions[tokenId]++;
        
        emit MetadataUpdated(tokenId, _tokenURI, _metadataVersions[tokenId]);
    }

    /**
     * @dev 토큰의 메타데이터 버전을 조회합니다.
     * @param tokenId 조회할 토큰 ID
     * @return 현재 메타데이터 버전
     */
    function getMetadataVersion(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return _metadataVersions[tokenId];
    }
}
