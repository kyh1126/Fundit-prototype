# Fundit 프론트엔드

## 소개
Fundit 블록체인 보험 플랫폼의 프론트엔드 애플리케이션입니다. Next.js와 TypeScript를 기반으로 구축되었으며, Web3 기능을 통합하여 블록체인과 상호작용합니다.

## 주요 기능
- **지갑 연결**: MetaMask를 통한 이더리움 지갑 연결
- **보험 제안**: 새로운 보험 상품 제안 및 목록 조회
- **입찰 관리**: 보험사의 입찰 제출 및 조회
- **계약 관리**: 보험 계약 체결 및 상태 관리
- **보험금 청구**: 보험금 청구 및 Oracle 검증 프로세스

## 기술 스택
- Next.js 14.0.4: 프론트엔드 프레임워크
- TypeScript 5.3.3: 타입 안정성
- Tailwind CSS ^3.4.1: UI 스타일링
- Zustand ^4.4.7: 상태 관리
- wagmi ^1.4.13: Web3 통합
- viem ^2.0.0: 이더리움 상호작용

## 설치 및 실행

### 사전 요구사항
- Node.js v18 이상
- MetaMask 지갑
- 로컬 블록체인 노드 실행 중 (또는 Base Goerli 테스트넷 연결)

### 환경 변수 설정
1. `.env.local` 파일을 생성하고 다음 값들을 설정:
```bash
# WalletConnect 프로젝트 ID (https://cloud.walletconnect.com/에서 생성)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# 배포된 Fundit 컨트랙트 주소
NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS=deployed_contract_address
```

### 설치
```bash
npm install
```

### 개발 서버 실행
1. 로컬 개발 서버 실행:
```bash
npm run dev
```

2. 브라우저에서 접속:
- 기본 URL: http://localhost:3000

### MetaMask 설정
1. 로컬 네트워크 사용 시:
   - 네트워크 추가: 
     - 네트워크 이름: Hardhat Local
     - RPC URL: http://127.0.0.1:8545
     - 체인 ID: 31337
     - 통화 기호: ETH

2. Base Goerli 테스트넷 사용 시:
   - 네트워크 추가:
     - 네트워크 이름: Base Goerli
     - RPC URL: https://goerli.base.org
     - 체인 ID: 84531
     - 통화 기호: ETH
     - 블록 탐색기: https://goerli.basescan.org

### 개발 모드 특이사항
1. 자동 새로고침:
   - 코드 변경 시 자동으로 페이지가 새로고침됩니다.
   - `next.config.js`에서 설정 변경 가능

2. 디버깅:
   - 브라우저 개발자 도구의 콘솔에서 로그 확인
   - React Developer Tools로 컴포넌트 상태 확인

3. 환경별 설정:
   - 개발: `.env.development`
   - 프로덕션: `.env.production`
   - 로컬 오버라이드: `.env.local`

4. 주의사항:
   - MetaMask가 연결되어 있는지 확인
   - 올바른 네트워크가 선택되어 있는지 확인
   - 컨트랙트 주소가 환경 변수에 올바르게 설정되어 있는지 확인

## 페이지 구조
- `/`: 메인 페이지
- `/proposals`: 보험 제안 목록
- `/proposals/new`: 새 보험 제안 생성
- `/contracts`: 계약 목록
- `/claims`: 보험금 청구 관리

## 컴포넌트 구조
- `components/`: 재사용 가능한 UI 컴포넌트
- `contracts/`: 스마트 컨트랙트 ABI 및 설정
- `store/`: Zustand 상태 관리
- `hooks/`: 커스텀 React 훅
- `utils/`: 유틸리티 함수

## 참고사항
- 개발 모드에서는 로컬 블록체인 네트워크(localhost:8545)를 사용
- MetaMask에서 로컬 네트워크 연결 필요
- 컨트랙트 배포 후 주소를 `.env.local`에 업데이트해야 함

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/              # Next.js 13+ App Router
│   ├── components/       # 재사용 가능한 컴포넌트
│   ├── styles/          # 스타일 관련 파일
│   └── utils/           # 유틸리티 함수
├── public/              # 정적 파일
└── package.json         # 프로젝트 설정 및 의존성
```

## 테스트

```