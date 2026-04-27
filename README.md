# 폴라리스 (Polaris)

> 한 번 명식 입력하면, 그 다음부터는 친구한테 고민 털어놓듯 사주를 보는 앱.
> 길을 잃었을 때 방향을 잡아주는 북극성에서 이름을 따왔습니다.

## 라이브 데모

https://polaris-wrtn.vercel.app

## One Pager

[ONE_PAGER.md](./ONE_PAGER.md)

---

## 실행 방법

### 1. 클론 및 설치

```bash
git clone https://github.com/jhlee95129/polaris.git
cd polaris
pnpm install
```

### 2. 환경변수

`.env.example`을 `.env.local`로 복사하고 API 키를 입력합니다.

```bash
cp .env.example .env.local
```

```
ANTHROPIC_API_KEY=           # Claude API (필수)
OPENAI_API_KEY=              # RAG 임베딩용 (필수)
NEXT_PUBLIC_SUPABASE_URL=    # Supabase 프로젝트 URL (필수)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Supabase 공개 키 (필수)
SUPABASE_SECRET_KEY=         # Supabase 서비스 키 (필수)
```

### 3. 데이터베이스 설정

Supabase 프로젝트에서 pgvector 확장을 활성화하고, `supabase/migrations/` 폴더의 마이그레이션을 순서대로 실행합니다.

```bash
# RAG 지식 임베딩 (1회만)
npx tsx scripts/embed-knowledge.ts
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

### 5. 테스트

```bash
npx vitest run
```

만세력 5개 엣지케이스 + 대운 계산 검증 총 22개 테스트가 실행됩니다.

---

## 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js (App Router) | 16.1 | 풀스택 프레임워크. SSR + API Routes + Vercel 원클릭 배포 |
| React | 19.2 | UI 렌더링 |
| TypeScript | 5.9 | 타입 안전성 |
| Tailwind CSS | v4 | 유틸리티 기반 스타일링 |
| shadcn/ui (radix-nova) | — | Radix UI 기반 접근성 내장 컴포넌트 |
| next-themes | 0.4 | 다크 모드 (시스템/수동 전환) |

### AI / LLM

| 기술 | 모델 | 용도 |
|------|------|------|
| Anthropic SDK (`@anthropic-ai/sdk`) | `claude-opus-4-7` | 채팅 응답 생성, tool_use로 사주 근거 구조화 추출, 사주 요약 생성 |
| OpenAI SDK (`openai`) | `text-embedding-3-large` (2000d) | RAG 임베딩 생성 (지식 시딩 + 쿼리 임베딩) |

- **Claude**: 스트리밍 응답(`stream: true`) + `saju_basis` tool로 매 응답마다 참조 기둥/핵심 오행/명리학 추론/코칭을 구조화 추출
- **OpenAI**: 임베딩 전용. 명리학 소스 텍스트를 2000차원 벡터로 변환하여 pgvector에 저장하고, 사용자 질문도 같은 모델로 임베딩하여 코사인 유사도 검색

### RAG 파이프라인

```
[명리학 소스 텍스트] → [## 헤더 기준 청킹] → [OpenAI 임베딩 (2000d)]
                                                    ↓
                                          [Supabase pgvector 저장]
                                                    ↓
[사용자 일간 + 메시지] → [OpenAI 임베딩] → [코사인 유사도 검색 (Top-1)]
                                                    ↓
                                    [Claude 시스템 프롬프트에 주입 (grounding)]
```

- **시딩**: `data/saju-knowledge/ilgan-characteristics.md` → `##` 헤더 기준 10개 청크 분할 → 각 청크 임베딩 → `saju_knowledge` 테이블 저장
- **검색**: 사용자의 일간(日干)으로 `match_saju_knowledge()` RPC 호출 → 유사도 > 0.25인 Top-1 반환
- **주입**: 검색된 일간 특성을 Claude 시스템 프롬프트 Layer 3에 삽입하여 hallucination 방지

### 사주 계산

| 기술 | 용도 |
|------|------|
| `@fullstackfamily/manseryeok` | KASI(한국천문연구원) 기반 만세력. 진태양시 보정, 입춘 기준 연주, 한국 윤달 정확 |
| `lib/saju.ts` (자체 구현) | 만세력 래퍼 — 4기둥 + 오행 분포 + 십신 + 용신 계산 |
| `lib/daeun.ts` (자체 구현) | 대운 계산 — 정통 절기 기반 순행/역행, `getSolarTermsByYear()` + `SIXTY_PILLARS` 활용 |

### 데이터베이스

| 기술 | 용도 |
|------|------|
| Supabase (PostgreSQL) | 사용자, 세션, 메시지 CRUD |
| pgvector 확장 | RAG 벡터 저장/검색 (HNSW 인덱스, 코사인 유사도) |
| `match_saju_knowledge()` RPC | 벡터 유사도 검색 함수 (threshold + count 파라미터) |

### 테스트 / 배포

| 기술 | 용도 |
|------|------|
| Vitest | 만세력 5개 엣지케이스 + 대운 7개 = 22개 단위 테스트 |
| Vercel | 프로덕션 배포. Next.js 최적화, 자동 도메인 |

---

## 의사결정 기록

### 왜 채팅 인터페이스인가

핵심 가설이 **"명리학에 능통하지만 친구처럼 편한 대화 상대"**입니다. 친구에게 고민을 털어놓는 가장 자연스러운 인터페이스는 채팅입니다. 구조화된 콘텐츠 카드(플롯 방식)는 사전 설계된 범위 안에서만 작동하지만, 채팅은 "오늘 팀장이랑 또 부딪혔어" 같은 **임의의 일상 상황**에 대응할 수 있습니다.

### 왜 메모리가 핵심인가

신뢰는 누적에서 발생합니다. 1회성 리포트로는 "친구" 관계를 만들 수 없습니다. 멀티 세션 + 이전 대화 맥락 기반 follow-up 인사로, 재방문할 때마다 **"기억하고 있는 폴라리스"**를 경험합니다. 이것이 기존 사주 앱의 "설치 → 1회 사용 → 이탈" 패턴을 깨는 핵심 메커니즘입니다.

### 왜 플롯과 다른 길을 갔는가

플롯의 철학 — *"더 잘 맞히는 운세보다 더 도움이 되는 운세"* — 에 깊이 동의합니다. 폴라리스는 이 철학을 다른 구현 축에서 보완합니다.

플롯이 **"구조화된 콘텐츠(올해 운세, 3개월 연애운, 성향 분석) + 정령의 가이드 인터뷰"**로 사전 설계된 자기 이해 리포트를 제공한다면, 폴라리스는 **"임의의 일상 상황 + 누적 메모리"**로 일상 상담 친구의 자리를 채웁니다.

플롯이 의도적으로 비워둔 두 영역 — **임의 상황 대응**(콘텐츠 카테고리 밖의 일상 고민)과 **누적 관계**(단발 리포트가 아닌 follow-up 대화) — 을 폴라리스가 채우는 보완재 포지션입니다.

### 왜 RAG을 일간 특성에만 썼는가

사주 해석에서 가장 hallucination 위험이 큰 부분은 일간별 성격/기질 해석입니다. LLM이 그럴듯하지만 명리 원전과 어긋나는 답을 만들기 쉬워, 일간 특성 지식만 pgvector에 인덱싱하고 사용자 명식의 일간을 query로 retrieval해 grounding합니다.

톤/코칭 원칙/오행 일반 지식은 시스템 프롬프트에 고정 — 일관성이 중요하고 분량이 작아 retrieval 이득이 없기 때문입니다.

*"무엇을 RAG으로 빼고 무엇을 프롬프트에 둘 것인가"의 판단*이 본 프로젝트의 기술적 의사결정 핵심이었습니다.

### 왜 대운(大運)을 직접 구현했는가

사용 중인 만세력 라이브러리(`@fullstackfamily/manseryeok`)에 대운 계산 기능이 없었습니다. 하지만 대운은 사주 상담의 핵심 축(현재 10년 운의 흐름)이므로, 라이브러리가 제공하는 `getSolarTermsByYear()`(절기 데이터)와 `SIXTY_PILLARS`(60갑자 배열)를 기반으로 정통 절기 기반 대운 계산 모듈을 직접 구현했습니다.

순행/역행 결정(양남음녀=순행), 절입일까지 일수 기반 대운 시작 나이 계산, 60갑자 순환 시퀀스 생성을 포함합니다.

### 왜 만들지 않았는가

| 기능 | 이유 |
|------|------|
| 회원가입/소셜 로그인 | 닉네임 기반 간편 접근이 가설 검증에 충분 |
| 결제 시스템 | 복채(기운) 시스템으로 구조만 설계. 실결제는 7일 범위 밖 |
| 카테고리 탭 | "자유 대화"라는 가설과 정면 충돌 |
| 캐릭터 페르소나 | 프롬프트 충돌/불안정 리스크. 단일 보이스가 일관된 브랜드 경험 제공 |
| 푸시 알림 | 비핵심. 매일 체크인 보상(무료 복채)으로 재방문 유도 |

---

## 사용한 AI 도구와 활용 방식

### Claude Code (개발 도구)

전체 개발 과정에서 Claude Code를 활용했습니다.

- **기획 단계**: 시장 분석, 경쟁사 리서치(점신 MAU 95만, 포스텔러 매출 100억), 페르소나 설계, 기능 우선순위 결정
- **설계 단계**: 시스템 아키텍처, API 설계, DB 스키마 설계를 코드 컨텍스트 기반으로 진행
- **구현 단계**: 전체 코드베이스 작성. SPEC.md(상세 기획서)를 Claude Code에 핸드오프하여 구조화된 단위로 작업 분해 후 구현
- **피봇 단계**: 초기 "선택형 플로우" → "자유 채팅"으로 컨셉 전환, 캐릭터 시스템 도입 검토 → 단일 보이스 결정 등 제품 판단을 코드 레벨에서 빠르게 실행
- **검증 단계**: 만세력 엣지케이스 5개 + 대운 계산 7개 = 22개 단위 테스트 작성/실행, 빌드 검증

### Claude API (런타임 AI)

- **모델**: Claude Opus 4 (한국어 톤 품질이 가장 자연스러움)
- **스트리밍**: Anthropic SDK의 `stream: true`로 실시간 응답
- **tool_use**: `saju_basis` 도구로 매 응답의 사주 근거(참조 기둥, 핵심 오행, 명리학 추론, 코칭)를 구조화 추출
- **4계층 시스템 프롬프트**:
  - Layer 0: 톤 원칙 (친구 톤, 3-5문장, 점쟁이 표현 금지)
  - Layer 1: 명리학 정적 지식 (오행 관계, 십신 분석, 코칭 원칙)
  - Layer 2: 사용자 원국 (4기둥, 일간, 현재 대운)
  - Layer 3: RAG 검색 결과 (일간 특성 Top-1)

### OpenAI Embeddings (RAG)

- **모델**: `text-embedding-3-large` (2000 dimensions)
- **용도**: 명리학 소스 텍스트 → 벡터화 → pgvector 저장/검색
- **검색 쿼리**: `"${일간} 일간 특성"` → 코사인 유사도 Top-1 retrieval

### RAG 데이터 출처와 거버넌스

명리학 도메인 텍스트는 검증 가능한 외부 출처(명리학 도서 + 한국어 위키백과 명리학 항목)에서 발췌/재구성했습니다. AI(Claude)는 chunk-friendly한 형태로의 **재구성 도구**로만 사용했고, *"원문에 없는 해석을 추가하지 말 것"*을 명시 제약했습니다. 각 chunk의 metadata에 출처 필드를 분리 저장해 추적 가능합니다.

RAG의 정당성은 *"LLM 바깥 지식의 주입"*이라는 본질에서 옵니다. Claude가 빈 페이지에서 명리학 텍스트를 생성하고 그걸 같은 Claude에게 grounding 데이터로 주입하면 circular 구조가 되어 RAG 의미가 사라집니다. 따라서 데이터 생성 단계에서부터 LLM 의존을 차단하는 것을 의식적인 설계 원칙으로 삼았습니다.

### 만세력 라이브러리 검증

`@fullstackfamily/manseryeok`은 신생 라이브러리이므로 채택 전 5개 엣지케이스를 단위 테스트로 검증했습니다:

1. **입춘 전후** — 2000년 2월 3일(입춘 전) vs 2월 5일(입춘 후)의 연주가 다른지
2. **윤달 처리** — 2023년 윤2월 15일의 양력 변환 및 사주 계산 정확도
3. **야자시** — 23시 vs 0시의 일주 경계 처리
4. **시주 없음** — 출생 시간 미입력 시 시주 null 처리
5. **경계값** — 1900년, 1924년, 2050년 등 만세력 범위 경계

5개 모두 통과하여 채택했습니다.

---

## 프로젝트 구조

```
polaris/
├── app/                            # Next.js App Router
│   ├── page.tsx                    # 랜딩 (닉네임 로그인)
│   ├── onboarding/page.tsx         # 3단계 온보딩 (이름→생년월일→성별)
│   ├── dashboard/page.tsx          # 홈 (세션 목록 + 복채 + 오늘의 운)
│   ├── chat/page.tsx               # 채팅 (사이드바 + 메시지 + 입력)
│   ├── mypage/page.tsx             # 사주 프로필 + 대운표 + 오행 밸런스
│   ├── bokchae/page.tsx            # 복채 충전 상점
│   ├── share/[token]/page.tsx      # 공유 대화 보기 (읽기 전용)
│   └── api/                        # API 라우트 (15개)
│       ├── onboarding/route.ts     # 사주 계산 + 사용자 생성
│       ├── chat/route.ts           # 스트리밍 채팅 (RAG + Claude + tool_use)
│       ├── sessions/               # 세션 CRUD
│       ├── user/                   # 사용자 프로필
│       ├── saju-profile/route.ts   # 전체 사주 프로필 + 대운 시퀀스
│       ├── daily-fortune/route.ts  # 오늘의 운세
│       ├── bokchae/                # 체크인 + 구매
│       └── suggestions/route.ts   # AI 추천 질문
├── components/
│   ├── chat/                       # MessageList, MessageBubble, MessageInput, SajuSidebar
│   ├── nav/                        # GlobalHeader, Footer
│   └── ui/                         # shadcn/ui 컴포넌트
├── lib/
│   ├── saju.ts                     # 만세력 래퍼 (4기둥 + 오행 + 십신 + 용신)
│   ├── saju-data.ts                # 천간/지지/오행/십신 구조화 데이터
│   ├── daeun.ts                    # 대운 계산 (정통 절기 기반)
│   ├── claude.ts                   # Claude API 클라이언트 + tool 정의
│   ├── rag.ts                      # RAG 파이프라인 (임베딩 → 검색 → 주입)
│   ├── prompts.ts                  # 4계층 시스템 프롬프트
│   └── db/queries.ts              # Supabase CRUD
├── data/saju-knowledge/            # RAG 코퍼스 (명리학 소스 6개)
├── scripts/embed-knowledge.ts      # 임베딩 파이프라인
├── __tests__/saju.test.ts          # 만세력 + 대운 검증 테스트 (22개)
└── supabase/migrations/            # DB 마이그레이션 (8개)
```

---

## 주요 기능 목록

| 기능 | 상태 | 설명 |
|------|------|------|
| 온보딩 (3단계) | 구현 완료 | 이름 → 생년월일(양력/음력/윤달) → 시간(모름 가능) → 성별 |
| 사주 계산 | 구현 완료 | 4기둥 + 오행 분포 + 십신 + 용신 + 대운 |
| 스트리밍 채팅 | 구현 완료 | SSE 기반 실시간 응답 + tool_use 근거 추출 |
| RAG grounding | 구현 완료 | 일간 특성 벡터 검색 → 프롬프트 주입 |
| 세션 관리 | 구현 완료 | 멀티 세션 생성/삭제, 주제별 분리 |
| Follow-up 인사 | 구현 완료 | 재방문 시 이전 대화 맥락 기반 인사 생성 |
| 대운 계산 | 구현 완료 | 정통 절기 기반 순행/역행, 10년 주기 시퀀스 |
| 대운표 | 구현 완료 | 마이페이지에 8개 대운 시각화, 현재 대운 하이라이트 |
| 사주 프로필 | 구현 완료 | 4기둥 + 오행 밸런스 그래프 + 십신 + 용신 |
| 복채 시스템 | 구현 완료 | 상담 1회 = 1개 소모, 매일 1개 무료 체크인 |
| 대화 공유 | 구현 완료 | 공유 토큰 생성, 읽기 전용 공개 링크 |
| 닉네임 로그인 | 구현 완료 | 닉네임 입력만으로 로그인/회원가입 분기 |
| 다크 모드 | 구현 완료 | next-themes 기반 시스템/수동 전환 |
| 모바일 반응형 | 구현 완료 | 375px~데스크탑 전 범위 대응 |
| 스켈레톤 로딩 | 구현 완료 | 대시보드/채팅/마이페이지 구조화된 로딩 상태 |
| 계정 삭제 | 구현 완료 | CASCADE 삭제 (사용자 + 세션 + 메시지) |
