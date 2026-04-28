# 폴라리스 (Polaris) — AI 사주 라이프 코치

## 프로젝트 개요
뤼튼 Product Engineer 과제. "AI 사주 라이프 코치" — 사주 풀이가 아닌 **상황 기반 코칭**을 제공하는 AI 에이전트.
서비스명 유래: 북극성(Polaris) — 길을 잃었을 때 방향을 잡아주는 별.

## 기술 스택
- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **UI**: Tailwind CSS v4 + shadcn/ui (radix-nova style)
- **사주 계산**: `@fullstackfamily/manseryeok` (KASI 기반 만세력)
- **AI**: Claude Sonnet 4.6 (`@anthropic-ai/sdk`, `claude-sonnet-4-6`) — 실시간 채팅 + 추천 질문 + 일일 운세 전부 Sonnet 통일, tool_use 구조화 출력
- **RAG**: Supabase pgvector + OpenAI `text-embedding-3-large` (2000차원), 2-track 검색 (토픽 기반 + 일간 기반)
- **DB/Auth**: Supabase (pgvector + anonymous auth + PostgreSQL)
- **배포**: Vercel

## 핵심 아키텍처
```
[고민 입력] → [만세력 계산] → [RAG 2-track 검색(pgvector)] → [Claude tool_use(saju_basis)] → [코칭 응답]
```

## 주요 파일 구조

### Pages (`app/`)
- `app/page.tsx` — 랜딩 페이지
- `app/onboarding/page.tsx` — 3단계 온보딩 (생년월일 → 시간/성별 → 닉네임)
- `app/dashboard/page.tsx` — 오늘의 폴라리스 대시보드 (일일 운세 + 카테고리 카드)
- `app/chat/page.tsx` — 메인 채팅 (사이드바 + 세션 관리 + 캐릭터 전환)
- `app/bokchae/page.tsx` — 복채 충전 페이지
- `app/mypage/page.tsx` — 내 정보 (사주 정보 + 계정 삭제)
- `app/settings/page.tsx` — 설정
- `app/help/page.tsx` — 도움말
- `app/admin/page.tsx` — 관리자 페이지 (목업)
- `app/share/[token]/page.tsx` — 대화 공유 뷰

### API Routes (`app/api/`)
- `app/api/chat/route.ts` — 코칭 상담 API (RAG + Claude 통합, 스트리밍)
- `app/api/onboarding/route.ts` — 명식 계산 + 사용자 생성
- `app/api/user/route.ts` — 사용자 정보 CRUD
- `app/api/user/lookup/route.ts` — 사용자 조회
- `app/api/saju-profile/route.ts` — 사주 프로필 재계산
- `app/api/sessions/route.ts` — 세션 목록/생성/삭제
- `app/api/sessions/[id]/messages/route.ts` — 세션별 메시지 조회
- `app/api/sessions/[id]/share/route.ts` — 대화 공유 토큰 생성
- `app/api/suggestions/route.ts` — AI 추천 질문 생성
- `app/api/daily-fortune/route.ts` — 일일 운세 생성
- `app/api/bokchae/checkin/route.ts` — 일일 출석 체크인 (+1 복채)
- `app/api/bokchae/purchase/route.ts` — 복채 충전 (구매)

### Core Libs (`lib/`)
- `lib/saju.ts` — 만세력 래퍼 (사주팔자/오행/십신/용신 계산)
- `lib/saju-data.ts` — 명리학 구조화 데이터 (천간·지지·십신 특성)
- `lib/daeun.ts` — 대운 계산
- `lib/characters.ts` — 5 캐릭터 정의 (선비/무녀/장군/선녀/도깨비)
- `lib/topic-data.ts` — 대시보드 카테고리별 토픽 데이터
- `lib/prompts.ts` — 4계층 시스템 프롬프트 (명리학 지식 + 천기 + 원국 + 캐릭터별 코칭 스타일)
- `lib/claude.ts` — Claude API 클라이언트 + tool 정의 (saju_basis tool)
- `lib/rag.ts` — RAG 파이프라인 (임베딩 → 2-track 벡터 검색 → 컨텍스트 주입)
- `lib/storage.ts` — localStorage 유틸리티
- `lib/admin-mock-data.ts` — 관리자 페이지 목업 데이터
- `lib/supabase/client.ts` — Supabase 브라우저 클라이언트
- `lib/supabase/server.ts` — Supabase 서버 클라이언트
- `lib/db/queries.ts` — DB 쿼리 함수

### Components (`components/`)
- `components/chat/MessageBubble.tsx` — 메시지 버블 (코칭 카드 렌더링 포함)
- `components/chat/MessageList.tsx` — 메시지 목록
- `components/chat/MessageInput.tsx` — 입력창 + AI 추천 질문 스켈레톤
- `components/chat/SajuInfoPanel.tsx` — 사주 정보 패널 (4기둥 + 오늘의 운세)
- `components/chat/SajuSidebar.tsx` — 사이드바 (내 정보 + 대화 목록)
- `components/nav/global-header.tsx` — 글로벌 헤더 (복채 뱃지 포함)
- `components/nav/footer.tsx` — 푸터
- `components/theme-provider.tsx` — 다크 모드 테마 프로바이더
- `components/ui/` — shadcn/ui 컴포넌트 (19개)

### Data & Scripts
- `data/saju-knowledge/` — 명리학 지식 마크다운 (10개 파일, RAG용)
- `scripts/embed-knowledge.ts` — RAG 임베딩 시드 스크립트
- `__tests__/saju.test.ts` — 만세력 검증 테스트

## 컨벤션
- 한국어 주석 사용
- shadcn/ui 컴포넌트 우선 사용
- `@/*` 경로 별칭
- pnpm 패키지 매니저
- ESM (type: module)

## 핵심 비즈니스 규칙

### 5 코칭 캐릭터
| ID | 이름 | 이모지 | 톤 |
|---|---|---|---|
| `sunbi` | 선비 | 📜 | 학자풍 조언, 고전 인용 |
| `munyeo` | 무녀 | 🔮 | 영적·직관적 해석 |
| `janggun` | 장군 | ⚔️ | 직설적·행동 지향 |
| `seonnyo` | 선녀 | 🌸 | 따뜻한 공감 + 위로 |
| `dokkaebi` | 도깨비 | 👹 | 반전·유머·도발적 질문 |

### 코칭 카드
- Claude tool_use의 `saju_basis` tool로 구조화 추출
- 5필드: diagnosis, action, timing, avoid, basis
- "조심하세요" 등 점쟁이식 모호한 표현 금지
- action은 반드시 실행 가능한 구체적 행동

### 복채 시스템
- 상담 1회 = 복채 1개 소모
- 매일 3개 무료 충전 (일일 출석 체크인으로 +1 추가 가능)
- 복채 부족 시 차단된 토픽을 기억하고, 충전 후 자동 전송
- 복채 구매 페이지에서 충전 가능

### 세션 관리
- 세션별 대화 분리 (character_id 연결)
- 세션 제목 자동 생성
- 세션 삭제/전체 삭제
- 대화 공유 (share token 기반 읽기 전용 뷰)

### 대시보드 (오늘의 폴라리스)
- 일일 운세 (lucky_number, lucky_color, coaching, warning, energy)
- 카테고리별 추천 토픽 카드 → 클릭 시 채팅방으로 이동
