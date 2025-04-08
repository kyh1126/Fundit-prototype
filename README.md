# Fundit - Web3 보험 크라우드펀딩 플랫폼

Fundit은 Web3 기반의 양방향 참여형 보험 크라우드펀딩 플랫폼입니다. 기존의 보험 시장에서는 보험사가 상품을 만들고 소비자가 선택하는 단방향 구조였지만, Fundit에서는 사용자가 직접 보험 상품을 제안하고 보험사가 이를 입찰할 수 있는 혁신적인 플랫폼입니다.

### 핵심 가치
- **사용자 중심**: 사용자가 원하는 보험 상품을 직접 제안하고 설계
- **투명성**: 블록체인 기반으로 모든 거래 내역이 공개되고 검증 가능
- **효율성**: 스마트 컨트랙트를 통한 자동화된 계약 체결 및 보험금 지급
- **보상**: 참여자들에게 토큰 보상을 통한 인센티브 제공

### 주요 기능

### 1. 보험 상품 제안
- 사용자가 원하는 보험 상품의 세부 조건을 제안
- 제안 시 필요한 정보: 제목, 설명, 보험료, 보장금액, 보험 기간
- 제안된 상품은 블록체인에 기록되어 투명하게 관리

### 2. 보험사 입찰
- 등록된 보험사만 입찰 가능
- 입찰 시 제시 정보: 보험료, 보장금액, 보장 조건
- 여러 보험사의 경쟁 입찰을 통해 최적의 조건 도출

### 3. 자동 계약 체결
- 입찰 수락 시 스마트 컨트랙트를 통한 자동 계약 체결
- 계약 조건이 블록체인에 기록되어 변경 불가
- 계약 기간 동안 자동으로 보험료 관리

### 4. 보험금 청구 및 지급
- Chainlink 오라클을 활용한 자동화된 보험금 청구 검증
- 청구 제출 후 오라클의 검증을 통한 자동 지급
- 투명하고 신뢰할 수 있는 보험금 지급 프로세스

### 5. DAO 토큰 보상
- 리뷰 작성 시 품질에 따른 토큰 보상
- 리뷰 품질 점수 시스템 (1-10점)
- 토큰 보상을 통한 플랫폼 참여 유도

### 기술 스택
- **스마트 컨트랙트**: Solidity, OpenZeppelin
- **오라클**: Chainlink
- **개발 환경**: Hardhat, TypeScript
- **테스트**: Chai, Mocha

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 컨트랙트 컴파일
npx hardhat compile

# 테스트 실행
npx hardhat test

# 로컬 네트워크 실행
npx hardhat node

# 컨트랙트 배포
npx hardhat run scripts/deploy.js --network localhost
```

### 스크립트 사용법
- **보험 제안**: `npx hardhat run scripts/proposeInsurance.js --network localhost`
- **입찰**: `npx hardhat run scripts/placeBid.js --network localhost`
- **계약 생성**: `npx hardhat run scripts/createContract.js --network localhost`
- **보험금 청구**: `npx hardhat run scripts/submitClaim.js --network localhost`
- **리뷰 작성**: `npx hardhat run scripts/submitReview.js --network localhost`

## License
This project is licensed under the MIT License.
