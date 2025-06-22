# Fundit - 블록체인 기반 보험 플랫폼

Fundit은 사용자가 보험 상품을 제안하고 보험사가 입찰하여 계약을 체결하는 탈중앙화 보험 플랫폼입니다.

## 주요 기능

### 🏛️ 제안 시스템
- **보험 상품 제안**: 사용자가 원하는 보험 상품을 제안할 수 있습니다
- **제안 수정**: 제안자가 제안 내용을 수정할 수 있습니다
- **제안 취소**: 제안자가 제안을 취소할 수 있습니다
- **상태 관리**: 제안의 활성화/완료 상태를 관리합니다
- **시간 추적**: 제안의 생성일과 수정일을 추적합니다

### 💼 입찰 시스템
- **보험사 등록**: 보험사가 플랫폼에 등록할 수 있습니다
- **입찰 제출**: 등록된 보험사가 제안에 입찰할 수 있습니다
- **입찰 수정**: 입찰자가 입찰 내용을 수정할 수 있습니다
- **입찰 취소**: 입찰자가 입찰을 취소할 수 있습니다
- **입찰 기간 관리**: 입찰의 마감 기간을 설정하고 관리합니다
- **입찰 조회**: 제안별, 보험사별 입찰 목록을 조회할 수 있습니다

### 📋 계약 시스템
- **계약 체결**: 제안자가 입찰을 수락하여 계약을 체결합니다
- **계약 수정**: 계약 당사자가 계약 조건을 수정할 수 있습니다
- **계약 취소**: 계약 당사자가 계약을 취소할 수 있습니다
- **상태 관리**: 계약의 활성/검토/완료/취소 상태를 관리합니다

### 🔮 Oracle 시스템
- **다중 Oracle 검증**: 여러 Oracle이 보험금 청구를 검증합니다
- **신뢰도 평가**: Oracle의 신뢰도 점수를 관리합니다
- **보상 시스템**: Oracle에게 검증 보상을 지급합니다
- **통계 추적**: Oracle의 검증 횟수와 성공률을 추적합니다
- **계약별 할당**: 계약에 특정 Oracle들을 할당합니다

### ⭐ 리뷰 및 보상 시스템
- **리뷰 작성**: 계약 완료 후 리뷰를 작성할 수 있습니다
- **리뷰 수정**: 리뷰 작성자가 리뷰를 수정할 수 있습니다
- **리뷰 삭제**: 리뷰 작성자가 리뷰를 삭제할 수 있습니다
- **리뷰 신고**: 부적절한 리뷰를 신고할 수 있습니다
- **품질 평가**: 리뷰의 품질을 자동으로 평가합니다
- **토큰 보상**: 품질 높은 리뷰에 토큰을 보상합니다

### 🎨 기본 사용자 인터페이스
- **제안 목록**: 제안된 보험 상품들을 조회할 수 있습니다
- **제안 상세**: 제안의 상세 정보와 입찰 현황을 확인할 수 있습니다
- **기본 필터링**: 제안 상태별 기본 필터링 기능
- **반응형 디자인**: 모바일과 데스크톱에서 최적화된 경험

## 기술 스택

### 스마트 컨트랙트
- **Solidity**: 스마트 컨트랙트 개발 언어
- **Hardhat**: 개발 환경 및 테스트 프레임워크
- **OpenZeppelin**: 보안 라이브러리
- **Chainlink**: Oracle 서비스

### 프론트엔드
- **Next.js**: React 기반 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **Wagmi**: Web3 React 훅
- **RainbowKit**: 지갑 연결 UI

### 테스트
- **Chai**: 테스트 프레임워크
- **Ethers.js**: 블록체인 상호작용
- **Hardhat Network**: 로컬 테스트 네트워크

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn
- MetaMask 또는 다른 Web3 지갑

### 설치
```bash
# 저장소 클론
git clone https://github.com/your-username/hardhat-ignition-nft.git
cd hardhat-ignition-nft

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 설정을 추가
```

### 스마트 컨트랙트 배포
```bash
# 로컬 네트워크 시작
npx hardhat node

# 컨트랙트 컴파일
npx hardhat compile

# 컨트랙트 배포
npx hardhat run scripts/deploy.ts --network localhost
```

### 프론트엔드 실행
```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

## 사용법

### 1. 보험 제안하기
1. 지갑을 연결합니다
2. "보험 제안" 페이지로 이동합니다
3. 제안 폼을 작성합니다 (제목, 설명, 보험료, 보장금액, 기간)
4. 제안을 제출합니다

### 2. 입찰하기 (보험사)
1. 보험사로 등록합니다
2. 원하는 제안을 찾습니다
3. 입찰 폼을 작성합니다 (보험료, 보장금액, 조건)
4. 입찰을 제출합니다

### 3. 계약 체결
1. 제안자가 입찰을 검토합니다
2. 원하는 입찰을 선택합니다
3. 계약 기간을 설정합니다
4. 계약을 체결합니다

### 4. 보험금 청구
1. 계약 소유자가 청구를 제출합니다
2. Oracle이 청구를 검증합니다
3. 검증 결과에 따라 보험금이 지급됩니다

### 5. 리뷰 작성
1. 계약 완료 후 리뷰를 작성합니다
2. 평점과 내용을 입력합니다
3. 품질에 따라 토큰을 보상받습니다

## 테스트

### 전체 테스트 실행
```bash
npx hardhat test
```

### 특정 테스트 실행
```bash
# 입찰 시스템 테스트
npx hardhat test test/Bid.test.ts

# 계약 시스템 테스트
npx hardhat test test/Contract.test.ts

# 제안 시스템 테스트
npx hardhat test test/Proposal.test.ts

# 청구 시스템 테스트
npx hardhat test test/Claim.test.ts

# 리뷰 시스템 테스트
npx hardhat test test/Review.test.ts
```

## 보안

- **재진입 공격 방지**: ReentrancyGuard 사용
- **접근 제어**: Ownable 패턴으로 관리자 기능 보호
- **일시 정지**: Pausable 패턴으로 긴급 상황 대응
- **입력 검증**: 모든 사용자 입력에 대한 유효성 검사
- **Oracle 검증**: 다중 Oracle을 통한 신뢰성 확보
- **한글 오류 메시지**: 사용자 친화적인 한글 오류 메시지 제공

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 연락처

프로젝트 링크: [https://github.com/your-username/hardhat-ignition-nft](https://github.com/your-username/hardhat-ignition-nft)

## 업데이트 로그

### v2.0.0 (최신)
- ✅ 제안 수정 기능 추가
- ✅ 입찰 수정/취소 기능 추가
- ✅ 계약 수정/취소 기능 추가
- ✅ Oracle 다중 검증 시스템 구현
- ✅ 리뷰 수정/삭제/신고 기능 추가
- ✅ 한글 오류 메시지 적용
- ✅ 테스트 코드 완성 (46개 테스트 통과)

### v1.0.0
- ✅ 기본 제안 시스템
- ✅ 기본 입찰 시스템
- ✅ 기본 계약 시스템
- ✅ 기본 Oracle 시스템
- ✅ 기본 리뷰 시스템
