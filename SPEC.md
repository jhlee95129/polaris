# 폴라리스 (Polaris) — Product Spec

> 뤼튼 Product Engineer 과제 (AI 사주/운세 도메인)
> Claude Code 핸드오프용 최종 기획서

---

## 0. TL;DR

**한 줄 정의**: 한 번 명식 입력하면, 그 다음부터는 친구한테 고민 털어놓듯 채팅으로 사주를 보는 앱.

**서비스 이름**: 폴라리스 (Polaris)
- 북극성 — 길을 잃었을 때 방향을 잡아주는 별
- 사주의 본질("내 인생의 방향을 가늠하는 도구")과 결합도 높은 은유
- 영문 브랜드 톤이 깔끔하고 모던. 한국 테크 제품의 일반적 결(예: 뤼튼, Toss, Linear)
- 의인화 자연스러움 (*"폴라리스한테 물어봐"*) → 친구 가설과 호환
- 도메인 후보: polaris.app, getpolaris.com, polaris.chat

---

## 1. 제품 컨텍스트

**과제 핵심 평가 기준 (PDF에서 발췌)**
> "기술적으로 화려한 구현보다 사용자에게 의미 있는 경험을 만드는 판단을 더 중요하게 봅니다."
> "AI 도구를 활용해 혼자서 얼마나 빠르고 효과적으로 동작하는 제품을 만들어낼 수 있는지를 봅니다."

**핵심 가설**
> 사람들이 사주에서 진짜 원하는 건 "정해진 운명 보고서"가 아니라, **내 상황을 들어주고 사주 프레임으로 해석해주는 대화 상대**다.

이 한 문장이 **모든 기능 결정의 기준**입니다. "이 기능이 위 가설을 증명하는 데 기여하는가?" → No이면 자릅니다.

**타겟 페르소나**
- 김지은, 29세, 마케터
- 친구 만나면 MBTI/사주 얘기 자연스럽게 함
- 포스텔러/점신 결제 경험 있지만 "한 번 보고 안 들어감"
- 뤼튼 플롯의 "올해 운세" 카드는 봤는데, 막상 *"오늘 팀장이랑 또 부딪혔어"* 같은 일상 상황은 어디서 물어볼지 모름
- 최근 이직 고민 + 3개월 전 이별
- ChatGPT는 일에만 사용. 고민 상담용 AI는 아직 없음
- 진짜 친구한테 매번 같은 얘기 하기는 미안함
- → unmet need: "내 상황을 알면서 들어주는, 사주 좀 아는 친구"

**기존 서비스가 못 푸는 4분면**

| | 명식 정확도 | 임의 상황 대응 | 누적 관계 | 콘텐츠 형태 |
|---|---|---|---|---|
| 포스텔러/점신 | ✅ | ❌ | ❌ | 카테고리 메뉴 dump |
| **뤼튼 플롯** | ✅ | △ (사전 설계 콘텐츠 안에서만) | ❌ (단발 리포트) | 정령 가이드 + 콘텐츠 카드 |
| ChatGPT 프롬프팅 | ❌ | ✅ | ❌ | 자유 대화 (그러나 명식 hallucination) |
| 점집 (오프라인) | ✅ | ✅ | ❌ | 1회 대면 |
| **폴라리스** | ✅ | ✅ | ✅ | 누적 자유 대화 |

플롯의 본부장은 인터뷰에서 *"운세는 절대적인 정답을 맞히는 개념이라기보다 사용자 상황과 맥락을 이해하고 방향을 제시하는 도구"*라고 밝혔다. 폴라리스는 이 철학에 동의하되, 플롯이 *"사용자가 질문을 고민하는 과정 자체를 줄이고 콘텐츠 선택만으로 충분한 해석"*을 추구하면서 의도적으로 비워둔 두 칸 — **임의 상황 대응 + 누적 관계** — 을 채우는 보완재 포지션이다.

LLM + 메모리가 등장한 이후에야 가능해진 카테고리. **AI-native 증명**.

---

## 2. 기술 스택 (확정 → 최종 구현)

| 영역 | 선택 | 이유 |
|---|---|---|
| Frontend + Backend | Next.js 16 (App Router) + React 19 | Vercel 원클릭 배포, 평가자 웹 접근성 |
| 언어 | TypeScript | 표준 |
| 스타일 | Tailwind CSS v4 + shadcn/ui (radix-nova) | 빠른 UI, 다크 모드 |
| DB | Supabase (Postgres + pgvector) | RAG 인프라 + 익명 인증 |
| LLM | Claude Sonnet 4.6 (`claude-sonnet-4-6`) | 톤/한국어 품질, tool_use 구조화 출력 |
| 임베딩 | OpenAI `text-embedding-3-large` (2000d) | RAG 벡터 검색 |
| 만세력 | `@fullstackfamily/manseryeok` (검증 완료, 채택) | KASI 데이터, 진태양시 자동 보정, 입춘 기준 년주, 한국 윤달 정확 |
| 배포 | Vercel | 무료, 도메인 자동 |

> ⚠️ **만세력 검증 프로토콜 (반드시 채택 전에 실행)**
>
> `@fullstackfamily/manseryeok`은 신생 라이브러리(npm dependents 0, v1.0.4~1.0.7에서 사주 계산 버그 수정 이력)이므로 채택 전 아래 5개 케이스를 반드시 단위 테스트로 검증.
>
> 1. **본인 생일** — 익숙한 명식으로 1차 sanity check
> 2. **입춘 직전** (예: 2024-02-03 12:00, 남) — 년주가 전년도 간지로 나와야 함
> 3. **입춘 직후** (예: 2024-02-05 12:00, 남) — 년주가 당년 간지로 변경되어야 함
> 4. **음력 윤달 생일** (예: 2020년 윤4월 1일) — 한국 음력 기준 윤달 위치 정확한지
> 5. **자시 경계** (예: 23:30 vs 00:30) — 야자시(夜子時) 처리가 올바른지
>
> **5개 모두 통과** → `@fullstackfamily/manseryeok` 채택
> **1개라도 어긋남** → fallback 후보로 이동:
> - Fallback 1: `manseryeok` (yhj1024) — 한국 사주 특화 TS 라이브러리
> - Fallback 2: `lunar-javascript` (6tail) + 한국식 어댑터 직접 구현 (윤달/시간대/입춘 처리)

**환경변수**
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 3. 프로젝트 구조 (최종 구현)

```
/app
  /page.tsx                          # 랜딩 페이지
  /layout.tsx                        # 루트 레이아웃
  /onboarding/page.tsx               # 3단계 온보딩 (생년월일 → 시간/성별 → 닉네임)
  /dashboard/page.tsx                # 오늘의 폴라리스 대시보드 (일일 운세 + 카테고리 카드)
  /chat/page.tsx                     # 메인 채팅 (사이드바 + 세션 관리 + 캐릭터 전환)
  /bokchae/page.tsx                  # 복채 충전 페이지
  /mypage/page.tsx                   # 내 정보 (사주 정보 + 계정 삭제)
  /settings/page.tsx                 # 설정
  /help/page.tsx                     # 도움말
  /admin/page.tsx                    # 관리자 페이지 (목업)
  /share/[token]/page.tsx            # 대화 공유 뷰 (읽기 전용)
  /share/[token]/SharedChatView.tsx
  /api
    /chat/route.ts                   # POST: 코칭 상담 (RAG + Claude 스트리밍)
    /onboarding/route.ts             # POST: 명식 계산 + 사용자 생성
    /user/route.ts                   # 사용자 정보 CRUD
    /user/lookup/route.ts            # 사용자 조회
    /saju-profile/route.ts           # 사주 프로필 재계산
    /sessions/route.ts               # 세션 목록/생성/삭제
    /sessions/[id]/messages/route.ts # 세션별 메시지 조회
    /sessions/[id]/share/route.ts    # 대화 공유 토큰 생성
    /suggestions/route.ts            # AI 추천 질문 생성
    /daily-fortune/route.ts          # 일일 운세 생성
    /bokchae/checkin/route.ts        # 일일 출석 체크인 (+1 복채)
    /bokchae/purchase/route.ts       # 복채 충전 (구매)
/lib
  saju.ts              # 만세력 래퍼 (사주팔자/오행/십신/용신)
  saju-data.ts         # 명리학 구조화 데이터 (천간·지지·십신)
  daeun.ts             # 대운 계산
  characters.ts        # 5 코칭 캐릭터 정의
  topic-data.ts        # 대시보드 카테고리별 토픽
  prompts.ts           # 4계층 시스템 프롬프트 (캐릭터별 보이스)
  claude.ts            # Claude API 클라이언트 + saju_basis tool
  rag.ts               # RAG 파이프라인 (2-track 벡터 검색)
  storage.ts           # localStorage 유틸리티
  admin-mock-data.ts   # 관리자 목업 데이터
  /supabase
    client.ts          # Supabase 브라우저 클라이언트
    server.ts          # Supabase 서버 클라이언트
  /db
    queries.ts         # DB 쿼리 함수
/components
  /chat
    MessageBubble.tsx  # 메시지 버블 (코칭 카드 렌더링)
    MessageList.tsx    # 메시지 목록
    MessageInput.tsx   # 입력창 + AI 추천 질문
    SajuInfoPanel.tsx  # 사주 정보 패널 (4기둥 + 오늘의 운세)
    SajuSidebar.tsx    # 사이드바 (내 정보 + 대화 목록)
  /nav
    global-header.tsx  # 글로벌 헤더 (복채 뱃지)
    footer.tsx         # 푸터
  /ui                  # shadcn/ui 컴포넌트 (19개)
  theme-provider.tsx   # 다크 모드 테마
/data
  /saju-knowledge      # 명리학 지식 마크다운 (10개 파일)
    ilgan-characteristics.md    # RAG 벡터 DB
    ilgan-situational.md        # RAG 벡터 DB
    oheng-relations.md          # RAG 벡터 DB + 시스템 프롬프트
    oheng-coaching.md           # RAG 벡터 DB
    sipsin-analysis.md          # RAG 벡터 DB + 시스템 프롬프트
    life-coaching.md            # 시스템 프롬프트
    branch-interactions.md      # RAG 벡터 DB
    chart-patterns.md           # RAG 벡터 DB
    daeun-interpretation.md     # RAG 벡터 DB
    palace-system.md            # RAG 벡터 DB
/scripts
  embed-knowledge.ts   # RAG 임베딩 시드 스크립트
/__tests__
  saju.test.ts         # 만세력 검증 테스트
/supabase
  /migrations          # DB 마이그레이션 (10개)
SPEC.md                # 이 문서
ONE_PAGER.md           # 제출용 One Pager
README.md
CLAUDE.md              # Claude Code 지침서
```

---

## 4. 데이터베이스 스키마 (최종 구현)

```sql
-- 사용자 (익명, Supabase anonymous auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  display_name TEXT,                          -- 닉네임 (optional)
  birth_year INT NOT NULL,
  birth_month INT NOT NULL,
  birth_day INT NOT NULL,
  birth_hour INT,                             -- nullable: 시간 모름
  is_lunar BOOLEAN DEFAULT FALSE,
  is_leap_month BOOLEAN DEFAULT FALSE,        -- 윤달 여부
  gender TEXT NOT NULL CHECK (gender IN ('male','female')),
  -- 계산된 명식 (캐시)
  ilgan TEXT NOT NULL,                        -- e.g. "병화"
  yeon_pillar TEXT NOT NULL,                  -- e.g. "갑자"
  wol_pillar TEXT NOT NULL,
  il_pillar TEXT NOT NULL,
  si_pillar TEXT,                             -- nullable
  daeun_current TEXT,                         -- 현재 대운 e.g. "신금"
  saju_summary TEXT,                          -- LLM이 만든 한 줄 요약 (캐시)
  character_id TEXT DEFAULT 'sunbi',          -- 선호 캐릭터
  -- 복채 시스템
  bokchae_count INT DEFAULT 3,               -- 현재 복채 잔여량
  bokchae_last_free TIMESTAMPTZ,             -- 마지막 무료 충전 시각
  bokchae_checkin_date DATE                   -- 마지막 출석 체크인 날짜
);

-- 세션 (대화 단위 관리)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '새 대화',
  character_id TEXT DEFAULT 'sunbi',          -- 세션별 캐릭터
  share_token TEXT UNIQUE,                    -- 대화 공유 토큰
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅 메시지
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  metadata JSONB,                             -- character_id, tool results 등
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX messages_user_time_idx ON messages(user_id, created_at DESC);
CREATE INDEX messages_session_idx ON messages(session_id, created_at ASC);

-- RAG 지식 (10개 명리학 마크다운 파일 임베딩)
CREATE TABLE saju_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(2000),
  metadata JSONB                              -- {ilgan, topic, source} 추적 메타
);
CREATE INDEX saju_knowledge_embedding_idx
  ON saju_knowledge USING hnsw (embedding vector_cosine_ops);
```

---

## 5. 핵심 기능

### 5-1. 온보딩 (`/onboarding`)

**입력 필드**
1. 닉네임 (optional, default = "")
2. 생년월일 (양력/음력 토글, 기본 양력)
3. 태어난 시간 (드롭다운 12지시 + "모름" 옵션)
4. 성별 (남/여) — 대운 계산에 필수

**처리 (`/api/onboarding`)**
1. 입력 검증
2. `lib/saju/manseryuk.ts`로 명식 계산 → 4기둥 + 일간 + 현재 대운
3. Claude API로 한 줄 요약 1회 생성 (예: `"병화 일간 · 식상이 강한 봄날의 태양 · 현재 신금 대운"`) — `saju_summary`에 캐시
4. `users` row 생성, id 반환
5. 클라이언트가 localStorage에 `polaris_user_id` 저장
6. `/chat`으로 redirect

**UX 디테일 (신뢰감 직결)**
- "시간 모름" 옵션을 눈에 띄게. 시주 빠지면 일부 해석 제한된다고 한 줄 안내
- 음력 토글 분명히 (헷갈려 하는 사용자 많음)
- 입력 단계가 너무 폼처럼 보이지 않도록 폴라리스가 자기소개 받는 톤의 카피 사용
  - 예: *"안녕, 나는 폴라리스야. 너 얘기 좀 들려줘 🙂"*

### 5-2. 채팅 (`/chat`) — 최종 구현

**레이아웃**
- 데스크탑: 좌 사이드바(280px, ResizablePanel) + 메인 채팅
- 모바일: 상단 Sheet "내 명식" + 풀스크린 채팅

**사이드바 (`SajuSidebar`)**
- 사주 정보 패널 (4기둥 + 오늘의 운세)
- 대화 목록 (세션 단위, 스크롤 가능)
- 새 대화 / 전체 삭제

**글로벌 헤더**
- 복채 뱃지 (클릭 시 복채 충전 페이지 이동)
- 캐릭터 변경 버튼
- 대화 공유 버튼

**세션 관리**
- 세션별 대화 분리 (session_id)
- 세션별 캐릭터 연결 (character_id)
- 세션 제목 자동 생성 (첫 메시지 기반)
- 세션 삭제 / 전체 삭제 (AlertDialog 확인)

**메시지 처리 (`/api/chat`)**
1. body: `{ user_id, session_id, character_id, message }`
2. 서버에서:
   ```
   user      ← users 조회
   recent    ← messages 최근 N턴 (session_id 기반)
   ragDocs   ← RAG 2-track 검색 (토픽 Top-3 + 일간 Top-1)
   stream    ← Claude streaming + tool_use (saju_basis)
   ```
3. 스트리밍 응답을 클라이언트에 전달
4. 완료 시 messages + session.updated_at 저장
5. 추천 질문 비동기 생성 (`/api/suggestions`)

**복채 시스템**
- 메시지 전송 시 복채 1개 차감
- 복채 부족 시: 차단된 토픽 기억 → 충전 후 자동 전송
- 인라인 체크인/충전 UI

**스트리밍 필수**: Anthropic SDK의 `stream: true` 사용.

### 5-3. RAG (최종 구현)

**범위**: 10개 명리학 마크다운 파일 전체 (초기 계획의 1개에서 확장)
**목적**: LLM 명리학 hallucination 방지 (grounding) + 상황별 코칭 품질 향상

**지식 파일 (10개)**
- `ilgan-characteristics.md` — 일간별 성격·기질
- `ilgan-situational.md` — 일간별 상황 대응 패턴
- `oheng-relations.md` — 오행 상생상극 관계
- `oheng-coaching.md` — 오행별 코칭 전략
- `sipsin-analysis.md` — 십신 분석
- `life-coaching.md` — 코칭 원칙 (시스템 프롬프트에도 포함)
- `branch-interactions.md` — 지지 합충형파해
- `chart-patterns.md` — 명식 패턴 분석
- `daeun-interpretation.md` — 대운 해석
- `palace-system.md` — 궁(宮) 시스템

**시드 (`scripts/embed-knowledge.ts`)**
1. 10개 마크다운 파일 읽기
2. `##` 헤더 기준 chunk 분할
3. OpenAI `text-embedding-3-large` (2000d) 임베딩
4. `saju_knowledge` 테이블에 insert (source_file + metadata 포함)

**2-Track 검색 (`lib/rag.ts`)**
1. **토픽 기반 검색**: 사용자 고민/질문 텍스트로 코사인 유사도 검색 → Top-3
2. **일간 기반 검색**: `${ilgan} 일간 특성` 쿼리로 일간 맞춤 chunk → Top-1
3. 두 결과를 합쳐 RAG 컨텍스트로 주입

**시스템 프롬프트 정적 포함**: `oheng-relations.md`, `sipsin-analysis.md`, `life-coaching.md`는 시스템 프롬프트에도 정적 포함 (일관성 보장).

---

## 6. 시스템 프롬프트 (최종 구현)

`lib/prompts.ts`에서 4계층 구조로 구현:

1. **명리학 지식 계층**: 오행 관계, 십신 분석, 코칭 원칙 (마크다운에서 정적 포함)
2. **천기(天氣) 계층**: 오늘 날짜, 월운/일운 에너지
3. **원국(原局) 계층**: 사용자 명식 4기둥 + 일간 + 대운 + RAG 검색 결과
4. **캐릭터별 코칭 스타일 계층**: 5 캐릭터 각각의 톤·말투·태도 정의

### 5 코칭 캐릭터

| ID | 이름 | 이모지 | 톤 |
|---|---|---|---|
| `sunbi` | 선비 | 📜 | 학자풍 조언, 고전 인용, 존댓말 |
| `munyeo` | 무녀 | 🔮 | 영적·직관적 해석, 신비로운 분위기 |
| `janggun` | 장군 | ⚔️ | 직설적·행동 지향, 군대식 단호함 |
| `seonnyo` | 선녀 | 🌸 | 따뜻한 공감 + 위로, 부드러운 톤 |
| `dokkaebi` | 도깨비 | 👹 | 반전·유머·도발적 질문, 반말 |

### Claude tool_use: `saju_basis`
모든 코칭 응답 시 Claude가 `saju_basis` tool을 호출하여 사주 근거를 구조화 추출:
```json
{
  "relevant_pillars": ["일주 병오"],
  "oheng_analysis": "화기가 강한 명식...",
  "current_energy": "현재 신금 대운으로...",
  "coaching_basis": "식상이 강하니 창의적 접근이..."
}
```
이 구조화된 근거가 응답에 자연스럽게 녹아들어감.

---

### 5-4. 대시보드 (`/dashboard`) — 추가 구현

**오늘의 폴라리스**
- 일일 운세 카드 (coaching, warning, lucky_number, lucky_color, energy)
- 카테고리별 추천 토픽 (연애, 직장, 재물, 건강 등)
- 카드 클릭 → 채팅방으로 이동 + 해당 토픽 자동 전송

### 5-5. 대화 공유 (`/share/[token]`)
- 세션별 공유 토큰 생성 (1회 생성, 영구 유효)
- 읽기 전용 뷰 (SharedChatView 컴포넌트)
- 메시지 버블 동일 렌더링 (코칭 카드 포함)

### 5-6. 복채 시스템
- 상담 1회 = 복채 1개 소모
- 매일 자정 3개 자동 충전 (bokchae_last_free 기준)
- 일일 출석 체크인 +1 (bokchae_checkin_date 기준, 하루 1회)
- 복채 구매 페이지 (/bokchae)
- 복채 부족 시 차단된 토픽 기억 → 충전 후 자동 재전송

---

## 7. Demo Moments (시간을 가장 많이 쏟을 두 지점)

평가자가 5분 안에 "어 이 앱 다르네"라고 느껴야 합니다. 그 결정적 순간 두 가지:

### Moment 1: 첫 응답 — "보고서가 아니라 친구 톤"
- 포스텔러: 5000자 dump
- 폴라리스: 3-5 문장 + 명식 근거 한 줄 + 되묻기
- **검증 방법**: 평가자처럼 처음 가입해보고 첫 응답이 보고서 같으면 톤 프롬프트 다시.

### Moment 2: 두 번째 세션 — "기억하고 있네"
- 사용자가 첫날 이직 얘기 → 다음날 다시 들어옴 → 폴라리스가 *"지난번 말한 이직 건은 어떻게 됐어?"* 같은 follow-up
- 구현: 새 세션 시작 시 최근 메시지 N턴을 시스템 호출로 1회 더 줘서 "오늘 첫 인사"를 생성. (별도 LLM 호출 1회)
- **검증 방법**: 직접 두 번째 세션 들어가서 follow-up이 나오는지.

이 둘이 매끄러우면 평가 합격선 위. 둘 중 하나라도 어설프면 합격선 아래.

---

## 8. Non-Goals vs 실제 구현

원래 scope creep 방지용으로 설정했던 Non-Goals 중 일부는 제품 가설 검증에 필요하다고 판단하여 구현했습니다.

### 원래 Non-Goal이었으나 구현한 것
- ✅ **캐릭터 페르소나**: 5개 코칭 캐릭터 (선비/무녀/장군/선녀/도깨비) — 단일 보이스보다 재방문 동기 강화
- ✅ **대시보드 + 카테고리 카드**: "오늘의 폴라리스" — 자유 대화 진입 장벽을 낮추는 보조 동선
- ✅ **일일 운세**: 대시보드의 일일 코칭 — 매일 방문 동기
- ✅ **관리자 페이지**: 목업 수준 — 서비스 운영 비전 제시
- ✅ **대화 공유**: share token 기반 읽기 전용 뷰 — 바이럴 루프
- ✅ **복채 시스템**: 가상 화폐 기반 사용량 관리 — 수익화 가설 검증

### 여전히 Non-Goal
- ❌ 회원가입/소셜 로그인 (익명 + Supabase anonymous auth)
- ❌ 실 결제/구독 (복채는 가상 시스템)
- ❌ 화려한 명식 시각화 (텍스트 기반 유지)
- ❌ 다국어 (한국어만)
- ❌ 모바일 네이티브 앱 (web only)
- ❌ 궁합 (두 명식 비교)
- ❌ 음성 입력
- ❌ 이메일 발송 / 푸시 알림
- ❌ 분석 도구 통합 (GA4, Mixpanel)

---

## 9. 구현 일정 (실제 진행)

| 단계 | 작업 | 산출물 |
|---|---|---|
| 1 | 프로젝트 셋업, 만세력 검증, RAG 시드 | 기반 인프라 완성 |
| 2 | 온보딩 3단계, 사주 계산 API | 명식 입력 → DB 동작 |
| 3 | 채팅 API (스트리밍) + 기본 UI | 첫 응답까지 동작 |
| 4 | 5캐릭터 시스템, 세션 관리, 사이드바 | 캐릭터별 보이스 완성 |
| 5 | 대시보드, 일일 운세, 추천 질문 | "오늘의 폴라리스" 완성 |
| 6 | 복채 시스템, 대화 공유, 내 정보 | 부가 기능 완성 |
| 7 | UI 폴리시, 문서화, 배포 | 제출 준비 완료 |

---

## 10. ONEPAGER.md (별도 파일로 작성 — 아래 골격)

```markdown
# 폴라리스 — One Pager

> *"운세는 절대적인 정답을 맞히는 개념이라기보다 사용자 상황과 맥락을 이해하고
> 방향을 제시하는 도구"* — 제성원 플롯 본부장 (아주경제, 2026.04)
>
> 폴라리스는 이 명제에 동의합니다. 다만 그 도구가 콘텐츠 카드의 형태가 아니라,
> 일상의 고민을 받아주는 친구의 형태일 때 더 잘 작동한다고 봅니다.

## 왜 사주 도메인인가
- 한국 사주 시장 규모 + 20-30대 성장세
- LLM 등장 후에도 UX는 10년 전과 동일 → 재정의 기회
- 뤼튼 미션("AGI Close to People")과 결의 정합성

## 타겟과 안 풀린 문제
- 페르소나: 김지은, 29세, 마케터 (위 1번에서 인용)
- 기존 서비스 4분면 비교표 (위 1번에서 인용)
- 핵심 unmet need: "내 상황을 알면서 들어주는, 사주 좀 아는 친구"

## 핵심 기능과 근거
- 단일 핵심 기능: **명식 1회 입력 + 누적 채팅**
- 왜 채팅인가: 가설("관계형 대화")과 직결
- 왜 메모리인가: 신뢰는 누적에서 발생
- 왜 RAG은 일간만인가: hallucination 방지 grounding 외에는 단순함이 신뢰

## 성공 지표
- 1차 (가설 검증): N+1일 재방문율, 세션당 대화 턴 수, 첫 응답 종료율
- 2차 (제품): D7 리텐션, 명식 입력 완료율
- 비교 기준: 포스텔러/점신 vs 폴라리스 N+1 재방문율

## 7일 안에 만든 범위와 자른 범위
- 만든 것: ...
- 자른 것: ... (자른 이유가 곧 판단)
```

---

## 11. README.md (제출 시 반드시 포함)

```markdown
# 폴라리스 (Polaris)

> 한 번 명식 입력하면, 그 다음부터는 친구한테 고민 털어놓듯 사주를 보는 앱.
> 길을 잃었을 때 방향을 잡아주는 북극성에서 이름을 따왔습니다.

[![demo](demo.gif)](https://...)

## 라이브 데모
https://polaris.vercel.app

## One Pager
→ [ONEPAGER.md](./ONEPAGER.md)

## 기술 스택
Next.js 16 / TypeScript / React 19 / Tailwind CSS v4 / shadcn/ui / Supabase pgvector / Claude Sonnet 4.6 / OpenAI Embeddings / Vercel

## 의사결정 기록 (이 섹션이 가장 중요)
### 왜 채팅 인터페이스인가
...

### 왜 메모리가 핵심인가
...

### 왜 플롯과 다른 길을 갔는가
플롯의 철학 — *"더 잘 맞히는 운세보다 더 도움이 되는 운세"*(제성원 본부장 인터뷰, 아주경제 2026.04) — 에 깊이 동의합니다.
폴라리스는 이 철학을 다른 구현 축에서 보완합니다.

플롯이 *"구조화된 콘텐츠(올해 운세, 3개월 연애운, 성향 분석) + 정령의 가이드 인터뷰"* 로
**사전 설계된 자기 이해 리포트**를 제공한다면, 폴라리스는 *"임의의 일상 상황 + 누적 메모리"* 로
**일상 상담 친구**의 자리를 채웁니다.

플롯은 본부장이 직접 밝힌 대로 *"사용자가 질문을 고민하는 과정 자체를 줄이고 콘텐츠 선택만으로
충분한 해석을 받을 수 있도록"* 의식적으로 설계되었습니다. 그 단순화는 강점이자, 동시에 플롯이
의도적으로 비워둔 두 영역을 만듭니다 — **임의 상황 대응**(콘텐츠 카테고리 밖의 일상 고민)과
**누적 관계**(단발 리포트가 아닌 follow-up 대화). 폴라리스는 이 두 칸을 정확히 겨냥했습니다.

따라서 폴라리스는 플롯의 경쟁자가 아니라, 플롯이 의도적으로 단순화한 영역을 책임지는
보완재 포지션입니다.

### 왜 RAG을 일간 특성에만 썼는가
사주 해석에서 가장 hallucination 위험이 큰 부분은 일간별 성격·기질 해석입니다.
LLM이 그럴듯하지만 명리 원전과 어긋나는 답을 만들기 쉬워, 일간 특성 지식만 별도로
vector DB(Supabase pgvector, HNSW)에 인덱싱하고, 사용자 명식의 일간을 query로
retrieval해 grounding합니다. 톤·코칭 원칙·오행 일반 지식은 retrieval하지 않고
시스템 프롬프트에 고정 — 일관성이 중요하고 분량이 작아 retrieval 이득이 없기 때문입니다.
*"무엇을 RAG으로 빼고 무엇을 프롬프트에 둘 것인가"의 판단*이 본 프로젝트의 기술적
의사결정 핵심이었습니다.

### 왜 OO은 만들지 않았는가
- 회원가입: 7일 안에 가설 증명에 무관
- 결제: 동일
- 카테고리 탭: 가설("대화형")과 정면 충돌

## AI 도구 활용 (뤼튼이 가장 보고 싶어하는 섹션)
- **Claude Code**: 전체 코드베이스 ~80%를 Claude Code로 작성. 어떤 단위로 작업을 분해해서 어떻게 시켰는지 상세히.
- **Claude Sonnet 4.6 (런타임)**: 메인 LLM. 한국어 톤이 가장 자연스러워 채택. tool_use로 사주 근거 구조화 추출.
- **OpenAI text-embedding-3-large**: RAG용.
- **만세력 라이브러리 검증**: `@fullstackfamily/manseryeok` 채택. KASI 기반 + 진태양시 자동 보정 + 한국 윤달 정확이 결정 요인. 신생 라이브러리라 5개 케이스 단위 테스트로 검증 후 도입.
- **프롬프트 엔지니어링 반복**: 보고서 톤 → 친구 톤 전환에 X번 반복.

### RAG 데이터 출처와 거버넌스
명리학 도메인 텍스트는 검증 가능한 외부 출처(명리학 도서 1권 + 한국어 위키백과의
명리학 항목)에서 발췌·재구성했습니다. AI(Claude)는 chunk-friendly한 형태로의
**재구성 도구**로만 사용했고, *"원문에 없는 해석을 추가하지 말 것"*을 프롬프트로
명시 제약했습니다. 각 chunk의 metadata에 출처 필드를 분리 저장해 추적 가능하게
했습니다.

RAG의 정당성은 *"LLM 바깥 지식의 주입"*이라는 본질에서 옵니다. Claude가 빈
페이지에서 명리학 텍스트를 생성하고 그걸 같은 Claude에게 grounding 데이터로
주입하면 circular 구조가 되어 RAG 도입 의미가 사라집니다. 따라서 데이터 생성
단계에서부터 LLM 의존을 차단하는 것을 의식적인 설계 원칙으로 삼았습니다.

## 로컬 실행
git clone ...
cp .env.example .env.local
pnpm install
pnpm tsx scripts/seed-rag.ts   # 1회만
pnpm dev
```

---

## 12. Acceptance Checklist (완료 기준)

**핵심 기능**
- [x] 첫 방문 → 온보딩 3단계 → 명식 계산 → 대시보드 진입
- [x] "시간 모름" 옵션 + 음력/윤달 지원
- [x] 채팅 응답 스트리밍 + tool_use (saju_basis)
- [x] 5 캐릭터 전환 (세션별 캐릭터 연결)
- [x] 세션 관리 (생성/삭제/전환/전체삭제)
- [x] 대시보드 일일 운세 + 카테고리 카드
- [x] 복채 시스템 (소모/충전/체크인/구매)
- [x] 대화 공유 (share token)
- [x] AI 추천 질문

**톤**
- [x] 캐릭터별 개성 있는 보이스
- [x] 명식 근거가 자연스럽게 녹아있음
- [x] 점쟁이 톤 / 결정론적 표현 배제

**기술**
- [x] Vercel 배포 URL 정상 접속
- [x] RAG 2-track 검색 동작
- [x] 모바일 반응형 (375px~)
- [x] 다크 모드 지원

**문서**
- [x] README 의사결정 기록
- [x] AI 도구 활용 섹션
- [x] ONE_PAGER.md 완성
- [x] SPEC.md 최종 업데이트

---

## 13. 핵심 가설 (이 문서의 나침반)

> 사람들이 사주에서 진짜 원하는 건 정해진 운명 보고서가 아니라, 내 상황을 들어주고 사주 프레임으로 해석해주는 대화 상대다.

모든 기능 결정은 이 한 문장으로 돌아갑니다.
