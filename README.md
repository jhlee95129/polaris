# 한 수 (Hansu) — AI 사주 라이프 코치

> "내 사주는 알아. 근데 **지금 이걸 어떻게 해야 하지?**"에 답하는 AI 사주 에이전트

기존 사주 앱이 "해석 리포트 자판기"에 머물러 있는 반면, 한 수는 **사주를 자기 이해의 렌즈**로 활용하여 사용자의 구체적 상황에 맞는 **실행 가능한 코칭**을 제공합니다.

## 실행 방법

### 1. 환경 설정

```bash
git clone https://github.com/jhlee95129/hansu.git
cd hansu
pnpm install
```

### 2. 환경변수

`.env.local.example`을 `.env.local`로 복사하고 API 키를 입력합니다.

```bash
cp .env.local.example .env.local
```

**필수**: `ANTHROPIC_API_KEY` (Claude API)
**선택**: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` (RAG 기능)

> RAG 환경변수가 없으면 RAG 없이 동작합니다 (시스템 프롬프트 내 명리학 지식만 사용).

### 3. 실행

```bash
pnpm dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

### 4. (선택) RAG 임베딩

Supabase 프로젝트에서 pgvector를 활성화하고 마이그레이션을 실행한 후:

```bash
npx tsx scripts/embed-knowledge.ts
```

## 기술 스택

| 영역 | 기술 | 선택 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) + TypeScript | SSR/SSG 최적화, 평가자 실행 마찰 최소화 |
| UI | Tailwind CSS v4 + shadcn/ui | 일관된 디자인 시스템, 빠른 개발 |
| 사주 계산 | `@fullstackfamily/manseryeok` | KASI 기반, 한국 특화 만세력. LLM의 확률적 계산 대신 정확한 라이브러리 사용 |
| AI | Claude Opus 4 (`@anthropic-ai/sdk`) | tool_use로 구조화 출력 강제. 코칭 카드 5필드 일관성 보장 |
| RAG | Supabase pgvector + OpenAI Embeddings | 명리학 고전을 벡터 검색. 별도 벡터DB 불요 |
| 데이터 | localStorage (MVP) → Supabase PostgreSQL | 점진적 마이그레이션 가능한 설계 |

## 사용한 AI 도구와 활용 방식

### Claude Code (개발 전 과정)
- **기획**: 시장 분석, 경쟁사 리서치, 서비스 컨셉 설계를 Claude Code와 대화형으로 진행
- **설계**: 시스템 아키텍처, DB 스키마, API 설계를 코드 컨텍스트 기반으로 결정
- **구현**: 전체 코드베이스를 Claude Code가 프로젝트 구조를 이해한 상태에서 작성
- **검증**: 타입 체크, 빌드 검증, 사주 계산 정확도 테스트를 자동화

### Claude API (제품 핵심 기능)
- **tool_use**: `deliver_coaching` 도구로 코칭 카드 5필드(진단/행동/타이밍/피할 것/근거)를 구조화 출력
- **4계층 시스템 프롬프트**: 명리학 지식(L0) → 오늘 천기(L1) → 사주 원국(L2) → 캐릭터 톤(L3)
- **캐릭터 프레임 분기**: 같은 사주 데이터를 다른 해석 렌즈(감정/오행/십신)로 읽는 3개 시스템 프롬프트

### 프롬프트 엔지니어링
- 명시적 부정 지시("조심하세요" 류 모호한 표현 금지)로 체감 정확도 향상
- action 필드에 "실행 가능한 구체적 행동"을 강제하는 규칙 설계
- 캐릭터별 해석 프레임(감정/관계, 오행 상생상극, 십신/용신)을 시스템 프롬프트에서 분기

### RAG (Retrieval-Augmented Generation)
- 명리학 소스 텍스트(오행 관계, 십신 분석, 일간 특성, 라이프 코칭) → 청킹 → OpenAI 임베딩 → pgvector 저장
- 사용자 질문 + 사주 키워드로 관련 명리학 구절 검색 → Claude 시스템 프롬프트에 주입
- "AI가 지어낸 해석"이 아닌 "명리학 근거에 기반한 코칭" 제공

## 프로젝트 구조

```
hansu/
├── app/
│   ├── page.tsx                 # 온보딩 (생년월일시 입력)
│   ├── (main)/
│   │   ├── profile/page.tsx     # 사주 프로필 + 오늘의 일진
│   │   ├── ask/page.tsx         # 코칭 상담 (고민 입력 → 코칭 카드)
│   │   └── journal/page.tsx     # 상담 일지 + 피드백
│   └── api/
│       ├── saju/route.ts        # 사주 계산 API
│       ├── profile/route.ts     # AI 프로필 생성
│       └── advice/route.ts      # 코칭 상담 API (RAG + Claude)
├── lib/
│   ├── saju.ts                  # 만세력 래퍼 (사주/오행/십신/용신)
│   ├── saju-data.ts             # 명리학 구조화 데이터
│   ├── prompts.ts               # 4계층 시스템 프롬프트
│   ├── claude.ts                # Claude API + tool_use
│   ├── rag.ts                   # RAG 파이프라인
│   └── storage.ts               # localStorage 래퍼
├── data/saju-knowledge/         # 명리학 소스 텍스트 (RAG 코퍼스)
├── scripts/embed-knowledge.ts   # 임베딩 파이프라인
└── supabase/migrations/         # DB 스키마
```

## 데모 시나리오

1. **생년월일 입력**: 1990년 5월 15일 오후 2시 (양력)
2. **프로필 확인**: 일간 경금, 오행 금 과다/목 부족, 용신 목
3. **상담 질문 예시**:
   - "이직을 고민하고 있는데, 지금이 적절한 타이밍일까요?"
   - "요즘 상사와 자꾸 부딪히는데 어떻게 해야 할까요?"
   - "소개팅이 잡혔는데 어떤 준비를 하면 좋을까요?"
4. **캐릭터 전환**: 같은 질문을 다른 캐릭터로 물어보면 해석 프레임이 달라지는 것을 확인
