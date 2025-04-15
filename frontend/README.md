# Fundit 프론트엔드

Fundit의 프론트엔드 애플리케이션입니다. Next.js와 Tailwind CSS를 사용하여 구현되었습니다.

## 기술 스택

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- RainbowKit (Web3 연결)
- Wagmi (Ethereum 인터페이스)

## 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

3. 빌드
```bash
npm run build
```

4. 프로덕션 서버 실행
```bash
npm run start
```

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

## 주요 기능

- 보험 상품 제안 생성 및 관리
- 보험사 입찰 시스템
- 계약 체결 및 관리
- 보험금 청구 처리
- 리뷰 및 평가 시스템

## 환경 변수

`.env.local` 파일을 생성하여 다음 환경 변수를 설정하세요:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # Fundit 컨트랙트 주소
NEXT_PUBLIC_TOKEN_ADDRESS=0x...     # FunditToken 컨트랙트 주소
```

## 개발 가이드

1. 새로운 기능 개발 시 `src/components`에 컴포넌트를 추가
2. 페이지는 `src/app` 디렉토리에 추가
3. 스타일은 Tailwind CSS를 사용
4. Web3 관련 기능은 `src/utils/web3.ts`에서 관리

## 테스트

```bash
npm run test
```

## 라이선스

MIT
