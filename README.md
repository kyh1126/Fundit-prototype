# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

- npm install --save-dev chai @types/chai @types/mocha hardhat @nomicfoundation/hardhat-toolbox-viem @nomicfoundation/hardhat-ethers
- npm install --save-dev @openzeppelin/contracts@4.9.3
- 테스트 실행: npx hardhat test

### 프로젝트 기능
1. 기본 NFT 기능
  - 토큰 민팅
  - 토큰 URI 설정
  - 토큰 소유권 관리
2. 보안 기능
  - 소유자 권한 관리 (Ownable)
  - 일시 정지 기능 (Pausable)
  - 접근 제어
3. 배치 민팅
  - 여러 토큰 한 번에 민팅
  - 배치 크기 제한 (최대 100개)
  - 빈 배치 방지
4. 테스트 커버리지
  - 배포 테스트
  - 민팅 테스트
  - 일시 정지 테스트
  - 배치 민팅 테스트

### TO-DO
1. 메타데이터 관리
  - 토큰 메타데이터 업데이트 기능
  - 메타데이터 버전 관리
2. 가스 최적화
  - 배치 민팅 시 가스 사용량 최적화
  - 스토리지 변수 최적화
3. 프론트엔드 통합
  - Web3.js 또는 ethers.js를 사용한 프론트엔드 개발
  - NFT 조회 및 상호작용 기능
4. 컨트랙트 업그레이드
  - 업그레이드 가능한 컨트랙트 패턴 적용
  - OpenZeppelin의 업그레이드 플러그인 사용
