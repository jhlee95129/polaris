# 한수 (Hansu) — AI 사주 라이프 코치

## 프로젝트 개요
뤼튼 Product Engineer 과제. "AI 사주 라이프 코치" — 사주 풀이가 아닌 **상황 기반 코칭**을 제공하는 AI 에이전트.

## 기술 스택
- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **UI**: Tailwind CSS v4 + shadcn/ui (radix-nova style)
- **사주 계산**: `@fullstackfamily/manseryeok` (KASI 기반 만세력)
- **AI**: Claude Sonnet 4 (`@anthropic-ai/sdk`) — tool_use 구조화 출력
- **RAG**: Supabase pgvector + OpenAI `text-embedding-3-small`
- **DB/Auth**: Supabase (pgvector + anonymous auth + PostgreSQL)
- **배포**: Vercel

## 핵심 아키텍처
```
[고민 입력] → [만세력 계산] → [RAG 검색(pgvector)] → [Claude tool_use] → [코칭 카드]
```

## 주요 파일 구조
- `lib/saju.ts` — 만세력 래퍼 (사주팔자/오행/십신/용신 계산)
- `lib/saju-data.ts` — 명리학 구조화 데이터 (천간·지지·십신 특성)
- `lib/prompts.ts` — 4계층 시스템 프롬프트 (명리학 지식 + 천기 + 원국 + 코칭 스타일)
- `lib/claude.ts` — Claude API 클라이언트 + tool 정의
- `lib/rag.ts` — RAG 파이프라인 (임베딩 → 벡터 검색 → 컨텍스트 주입)
- `app/api/advice/route.ts` — 코칭 상담 API (RAG + Claude 통합)
- `app/api/saju/route.ts` — 사주 계산 API

## 컨벤션
- 한국어 주석 사용
- shadcn/ui 컴포넌트 우선 사용
- `@/*` 경로 별칭
- pnpm 패키지 매니저
- ESM (type: module)

## 핵심 비즈니스 규칙
- 코칭 카드 5필드: diagnosis, action, timing, avoid, basis
- "조심하세요" 등 점쟁이식 모호한 표현 금지
- action은 반드시 실행 가능한 구체적 행동
- 단일 "따뜻한 코치" 보이스 (존댓말 기반, 공감 + 사주 근거 + 구체적 행동)
- 반복 코칭 사이클: 코칭 → 실행 → 보고 → 후속 코칭 (thread 기반)
- 기운 시스템: 상담 1회 = 기운 1개, 매일 3개 무료 충전
