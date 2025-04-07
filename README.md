# NFT Smart Contract Project

이 프로젝트는 Hardhat과 OpenZeppelin을 사용하여 구현된 NFT(Non-Fungible Token) 스마트 컨트랙트입니다.

## 기능

### 기본 NFT 기능
- ERC721 표준 준수
- 토큰 민팅
- 토큰 URI 관리
- 토큰 소유권 관리

### 보안 기능
- 소유자 권한 관리 (Ownable)
- 일시 정지 기능 (Pausable)
- 토큰 소유자만 메타데이터 업데이트 가능

### 배치 민팅
- 여러 토큰을 한 번에 민팅 가능
- 최대 100개까지 한 번에 민팅 가능
- 가스 최적화된 배치 이벤트 사용

### 메타데이터 관리
- 토큰 소유자가 URI 업데이트 가능
- 메타데이터 버전 관리 시스템
- 메타데이터 업데이트 이벤트 발생

## 설치 방법

```bash
# 저장소 클론
git clone [repository-url]

# 의존성 설치
npm install
```

## 테스트 실행

```bash
npx hardhat test
```

## 주요 함수

### 민팅
```solidity
// 단일 토큰 민팅
function safeMint(address to, string memory uri) public onlyOwner whenNotPaused

// 배치 민팅
function batchMint(address to, string[] memory uris) public onlyOwner whenNotPaused
```

### 메타데이터 관리
```solidity
// URI 업데이트
function updateTokenURI(uint256 tokenId, string memory _tokenURI) public

// 메타데이터 버전 조회
function getMetadataVersion(uint256 tokenId) public view returns (uint256)
```

### 일시 정지
```solidity
// 컨트랙트 일시 정지
function pause() public onlyOwner

// 컨트랙트 정지 해제
function unpause() public onlyOwner
```

## 이벤트

### BatchMinted
배치 민팅 시 발생하는 이벤트
```solidity
event BatchMinted(
    address indexed to,
    uint256 startTokenId,
    uint256 count,
    string[] uris
)
```

### MetadataUpdated
메타데이터 업데이트 시 발생하는 이벤트
```solidity
event MetadataUpdated(
    uint256 indexed tokenId,
    string newURI,
    uint256 version
)
```

## 보안 고려사항

1. 소유자 권한
   - 민팅은 컨트랙트 소유자만 가능
   - 일시 정지는 소유자만 가능

2. 토큰 소유자 권한
   - 메타데이터 업데이트는 토큰 소유자만 가능

3. 배치 민팅 제한
   - 최대 100개까지만 한 번에 민팅 가능
   - 빈 배열로 민팅 시도 시 실패

## 가스 최적화

1. 배치 민팅
   - 단일 이벤트로 여러 토큰의 민팅 기록
   - 최적화된 토큰 ID 할당 로직

2. 메타데이터 관리
   - 효율적인 버전 관리 시스템
   - 필요한 경우에만 이벤트 발생

## 라이선스

MIT
