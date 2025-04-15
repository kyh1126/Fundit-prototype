# Fundit - 블록체인 기반 보험 플랫폼

## 소개
Fundit은 블록체인 기술을 활용한 탈중앙화 보험 플랫폼입니다. 사용자가 원하는 보험 상품을 제안하고, 보험사가 이에 대해 입찰하는 방식으로 운영됩니다.

## 주요 기능
- **보험 상품 제안**: 사용자가 원하는 보험 상품을 제안할 수 있습니다.
- **보험사 입찰**: 등록된 보험사가 제안된 상품에 대해 입찰할 수 있습니다.
- **계약 체결**: 제안자가 원하는 입찰을 선택하여 계약을 체결합니다.
- **보험금 청구**: Oracle 시스템을 통해 청구의 정당성을 검증합니다.
- **리뷰 및 보상**: 계약 완료 후 리뷰를 작성하고 토큰 보상을 받을 수 있습니다.

## 기술 스택
- Solidity ^0.8.20
- Hardhat ^2.19.4
- OpenZeppelin Contracts ^5.0.1
- Chainlink Oracle ^0.8.0
- Node.js v18.18.2
- npm v9.8.1 또는 yarn v1.22.19

## 설치 및 실행 방법

### 사전 요구사항
- Node.js v18.18.2
- npm v9.8.1 또는 yarn v1.22.19
- Git

### 설치
1. 저장소 클론
```bash
git clone https://github.com/kyh1126/Fundit-prototype.git
```

2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 필요한 값들을 설정
```

### 로컬 개발 환경 실행

1. 로컬 블록체인 노드 실행
```bash
npx hardhat node
```

2. 스마트 컨트랙트 배포
```bash
npx hardhat run scripts/deploy.js --network localhost
```

## 테스트 방법

### 스마트 컨트랙트 테스트
```bash
npx hardhat test
```

### 주요 테스트 시나리오

1. 보험 상품 제안 테스트
```bash
npx hardhat test test/Fundit.test.ts --grep "제안"
```

2. 입찰 테스트
```bash
npx hardhat test test/Fundit.test.ts --grep "입찰"
```

3. 계약 체결 테스트
```bash
npx hardhat test test/Fundit.test.ts --grep "계약"
```

4. 보험금 청구 테스트
```bash
npx hardhat test test/Fundit.test.ts --grep "청구"
```

5. 리뷰 및 보상 테스트
```bash
npx hardhat test test/Fundit.test.ts --grep "리뷰"
```

### 테스트용 계정 정보
로컬 개발 환경에서 사용할 수 있는 테스트 계정입니다:

1. 소유자 계정
- 주소: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- 역할: 컨트랙트 소유자, 관리자

2. 보험사 계정
- 주소: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
- 역할: 보험 상품 입찰

3. Oracle 계정
- 주소: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
- 역할: 보험금 청구 검증

**주의**: 이 계정들은 로컬 개발 환경에서만 사용하세요. 실제 네트워크에서는 절대 이 계정들을 사용하지 마세요.

## 라이선스
이 프로젝트는 MIT 라이선스를 따릅니다.
