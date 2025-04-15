# Fundit - 블록체인 기반 보험 플랫폼

## 소개
Fundit은 블록체인 기술을 활용한 탈중앙화 보험 플랫폼입니다. 사용자가 원하는 보험 상품을 제안하고, 보험사가 이에 대해 입찰하며, Oracle 시스템을 통해 보험금 청구를 검증하는 투명한 보험 생태계를 구축합니다.

## 주요 기능
- **보험 상품 제안**: 사용자가 원하는 보험 상품을 제안
- **보험사 입찰**: 등록된 보험사가 제안된 상품에 대해 입찰
- **계약 체결**: 제안자가 원하는 입찰을 선택하여 계약 체결
- **보험금 청구**: Oracle 시스템을 통한 투명한 보험금 청구 검증
- **리뷰 및 보상**: 계약 완료 후 리뷰 작성 및 토큰 보상

## 기술 스택
### 스마트 컨트랙트 & 백엔드
- Solidity ^0.8.20: 스마트 컨트랙트 개발
- Hardhat ^2.19.4: 이더리움 개발 환경
- TypeScript 5.3.3: 타입 안정성

프론트엔드 기술 스택은 [frontend/README.md](frontend/README.md)를 참고해주세요.

## 설치 및 실행

### 사전 요구사항
- Node.js v18 이상
- npm 또는 yarn

### 설치
```bash
# 의존성 설치
npm install

# 프론트엔드 의존성 설치
cd frontend
npm install
```

### 실행
1. 로컬 블록체인 노드 실행
```bash
npx hardhat node
```

2. 스마트 컨트랙트 배포
```bash
# 로컬 네트워크에 배포
npx hardhat run scripts/deploy.ts --network localhost

# Base Goerli 테스트넷에 배포
npx hardhat run scripts/deploy.ts --network baseGoerli
```

3. 프론트엔드 실행
프론트엔드 실행 방법은 [frontend/README.md](frontend/README.md)를 참고해주세요.

> **참고**: Base Goerli 테스트넷에 배포하기 전에 테스트넷 ETH가 필요합니다. [Base Goerli Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)에서 테스트넷 ETH를 받을 수 있습니다.

## 테스트

### 스마트 컨트랙트 테스트 실행
```bash
# 전체 테스트 실행
npx hardhat test

# 특정 테스트 파일 실행
npx hardhat test test/Fundit.test.ts

# 특정 테스트 케이스만 실행
npx hardhat test test/Fundit.test.ts --grep "보험 제안"
npx hardhat test test/Fundit.test.ts --grep "계약 체결"
npx hardhat test test/Fundit.test.ts --grep "보험금 청구"
```

### 주요 테스트 시나리오
1. 배포
   - 컨트랙트 소유자 설정 검증
   - FunditToken 컨트랙트 연동 검증

2. 보험 제안
   - 보험 상품 제안 생성
   - 컨트랙트 일시 중지 권한 검증

3. 입찰
   - 등록된 보험사의 입찰 제출
   - 미등록 보험사의 입찰 제한 검증

4. 계약
   - 입찰 수락을 통한 계약 생성
   - 제안자 권한 검증

5. 보험금 청구
   - 청구 제출 및 처리 검증

6. 리뷰 및 보상
   - 리뷰 제출 기능 검증
   - 리뷰 작성 시 토큰 보상 검증

### 테스트 계정 정보
- 소유자: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- 보험사: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
- Oracle: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

## 라이선스
MIT License
