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

## 2. 기술 스택 (확정)

| 영역 | 선택 | 이유 |
|---|---|---|
| Frontend + Backend | Next.js 15 (App Router) | 7일 timeline, Vercel 원클릭 배포, 평가자 웹 접근성 |
| 언어 | TypeScript | 표준 |
| 스타일 | TailwindCSS + shadcn/ui | 빠른 UI |
| DB | Supabase (Postgres + pgvector) | RAG 인프라 이미 구축됨 |
| LLM | Claude Sonnet 4.5 (`claude-sonnet-4-5`) | 톤/한국어 품질 |
| 임베딩 | OpenAI `text-embedding-3-large` (2000d) | 기존 RAG 그대로 유지 |
| 만세력 | `@fullstackfamily/manseryeok` (1차 후보) | KASI(한국천문연구원) 데이터, 진태양시 자동 보정, 입춘 기준 년주, 한국 윤달 정확. LLM 계산 절대 금지. |
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

## 3. 프로젝트 구조

```
/app
  /api
    /chat/route.ts         # POST: 메시지 처리 (스트리밍)
    /onboarding/route.ts   # POST: 명식 계산 + 저장
  /onboarding/page.tsx     # 명식 입력 페이지
  /chat/page.tsx           # 채팅 페이지
  /page.tsx                # 랜딩 (간단한 hero + CTA)
  /layout.tsx
/lib
  /saju
    manseryuk.ts           # 명식 계산
    types.ts               # SajuChart, Pillar 등 타입
  /rag
    embed.ts               # OpenAI 임베딩 호출
    retrieve.ts            # pgvector 검색
    seed.ts                # 1회성: 마크다운 → DB 적재 스크립트
  /claude
    client.ts              # Anthropic SDK 래퍼
    prompts.ts             # 시스템 프롬프트 + 정적 지식 임포트
  /db
    client.ts              # Supabase 클라이언트
    queries.ts             # 자주 쓰는 쿼리
/components
  Chat.tsx                 # 메인 채팅 컨테이너
  MessageList.tsx
  MessageInput.tsx
  SajuSidebar.tsx          # 명식 한 줄 요약 + 펼침
  Onboarding.tsx
/data
  /saju-knowledge
    ilgan-characteristics.md   # ← RAG에 넣음 (이것만)
    oheng-relations.md         # ← 시스템 프롬프트에 정적 포함
    sipsin-analysis.md         # ← 시스템 프롬프트에 정적 포함
    life-coaching.md           # ← 시스템 프롬프트에 정적 포함 (단, 톤 부분만)
/scripts
  seed-rag.ts              # ilgan-characteristics.md → vector DB
SPEC.md                    # 이 문서
ONEPAGER.md                # 제출용 One Pager
README.md
```

---

## 4. 데이터베이스 스키마

```sql
-- 사용자 (익명, localStorage UUID로 식별)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  display_name TEXT,                          -- 닉네임 (optional)
  birth_year INT NOT NULL,
  birth_month INT NOT NULL,
  birth_day INT NOT NULL,
  birth_hour INT,                             -- nullable: 시간 모름
  is_lunar BOOLEAN DEFAULT FALSE,
  gender TEXT NOT NULL CHECK (gender IN ('male','female')),
  -- 계산된 명식 (캐시)
  ilgan TEXT NOT NULL,                        -- e.g. "병화"
  yeon_pillar TEXT NOT NULL,                  -- e.g. "갑자"
  wol_pillar TEXT NOT NULL,
  il_pillar TEXT NOT NULL,
  si_pillar TEXT,                             -- nullable
  daeun_current TEXT,                         -- 현재 대운 e.g. "신금"
  saju_summary TEXT                           -- LLM이 만든 한 줄 요약 (캐시)
);

-- 채팅 메시지
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX messages_user_time_idx ON messages(user_id, created_at DESC);

-- RAG 지식 (이미 구축되어 있음 — 단순화만 적용)
CREATE TABLE saju_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,                  -- 'ilgan-characteristics'만 채우기
  content TEXT NOT NULL,
  embedding vector(2000),
  metadata JSONB                              -- {ilgan: "병화", source: "OOO 입문서 3장 / 위키 천간 항목"} 같은 추적 메타
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

### 5-2. 채팅 (`/chat`)

**레이아웃**
- 데스크탑: 좌 사이드바(280px) + 메인 채팅
- 모바일: 상단 collapsible "내 명식" + 풀스크린 채팅

**사이드바 (`SajuSidebar`)**
- 1줄 요약 (`saju_summary`)
- 클릭 시 4기둥 펼침 (년주/월주/일주/시주 + 현재 대운)
- "기억을 지우고 새로 시작" 버튼 (localStorage clear)

**채팅 시작 시 (첫 진입)**
- 폴라리스가 먼저 인사 (LLM 호출 1회):
  - 닉네임 부르며 + 명식 한 줄 언급 + 가벼운 첫 질문
  - 예: *"지은아, 너 병화 일간이라 사람한테 솔직한 편일 텐데, 요즘 어떻게 지내?"*

**메시지 처리 (`/api/chat`)**
1. body: `{ user_id, message }`
2. 서버에서:
   ```
   user      ← users 조회
   recent    ← messages 최근 10턴
   ilganDoc  ← RAG 검색 (Top-1)
   stream    ← Claude streaming 호출 (아래 6번 프롬프트)
   ```
3. 스트리밍 응답을 클라이언트에 전달
4. 스트림 완료 시 `messages` 테이블에 user/assistant 양쪽 모두 저장

**스트리밍 필수**: UX 차이 큼. Anthropic SDK의 `stream: true` 사용.

### 5-3. RAG (단순화 최종 명세)

**범위**: `ilgan-characteristics.md` 만
**목적**: LLM이 일간 해석에서 hallucinate하는 것 방지 (grounding 전용)

**시드 (1회성, `scripts/seed-rag.ts`)**
1. `ilgan-characteristics.md` 읽기
2. `##` 헤더 기준 분할 → 일간별 chunk (10개 예상)
3. 각 chunk에서 `[출처]` 라인 파싱하여 메타데이터로 분리 추출
4. 각 chunk 임베딩 (OpenAI `text-embedding-3-large`, 2000d)
5. `saju_knowledge`에 insert (`source_file='ilgan-characteristics'`, `metadata={ilgan: "병화", source: "..."}` 등)

**데이터 작성 워크플로우 (마크다운 4개 파일 만드는 법)**
RAG 데이터는 LLM 단독 생성 금지. 외부 출처 발췌 → AI 재구성 → 본인 검수 3단계.
1. **출처 수집**: 명리학 입문서 1권 + 한국어 위키백과 명리학 항목(천간/지지/오행/십신) 발췌
2. **AI 재구성**: 발췌 텍스트를 직접 주고 *"chunk-friendly한 형태로 재구성, 원문에 없는 내용 추가 금지"* 프롬프트로 정리. AI는 포매팅 도구로만 사용
3. **본인 검수**: 학파 통일(자평명리 기준 권장), 출처 누락 체크, chunk당 30초 훑기
4. 각 일간 섹션 끝에 `[출처] 발췌처` 한 줄 필수

**검색 (`lib/rag/retrieve.ts`)**
- query string: `${ilgan} 일간 특성` (예: `"병화 일간 특성"`)
- query embedding 후 코사인 유사도 검색
- `WHERE source_file = 'ilgan-characteristics'` 필터
- Top-1 반환

**나머지 3개 마크다운**: RAG에 넣지 **않음**. `lib/claude/prompts.ts`에서 build 시 fs로 읽어 시스템 프롬프트에 정적 문자열로 포함.

---

## 6. 시스템 프롬프트 (초안)

`lib/claude/prompts.ts`:

```typescript
import oheng from '@/data/saju-knowledge/oheng-relations.md';
import sipsin from '@/data/saju-knowledge/sipsin-analysis.md';
import coaching from '@/data/saju-knowledge/life-coaching.md';

export function buildSystemPrompt() {
  return `당신은 "폴라리스"입니다. 명리학에 능통하지만 친구처럼 편하게 대화하는 AI입니다.
이름의 유래는 북극성(Polaris) — 길을 잃었을 때 방향을 잡아주는 별. 다만 사용자에게 이 설명을
먼저 늘어놓지는 마세요. 톤과 태도로 그 의미를 전합니다.

[톤 원칙 — 절대 어기지 말 것]
- 보고서가 아니라 짧은 대화로 응답하세요. 3-5 문장이 기본입니다.
- 사용자의 감정을 먼저 받아주고, 그 다음에 사주 해석을 얹으세요.
- 단정하지 마세요. "이런 시기에는 이런 흐름이 있을 수 있어" 같은 가능성으로 제시.
- 명식 근거를 한 줄 자연스럽게 녹이세요. 장황한 설명 금지.
- 답변 끝에 가벼운 되묻기 1개를 자주 넣으세요.
- 반말/존댓말은 사용자 톤을 따라가세요.
- 이모지 절제. 한 응답에 0-1개.

[금기]
- 점쟁이 톤 ("그대의 운명은…") 절대 금지
- 결정론적 표현 ("당신은 평생 …할 것입니다") 금지
- 장문의 카테고리별 운세 보고서 금지
- 의료/법률/투자 단정 금지

[명리 지식 베이스]
## 오행 관계
${oheng}

## 십신 분석
${sipsin}

## 코칭 원칙
${coaching}
`;
}

export function buildUserContextBlock(args: {
  user: User;
  ilganChunk: string;
  recentMessages: Message[];
}) {
  return `
[사용자 명식]
이름: ${args.user.display_name || '(미입력)'}
일간: ${args.user.ilgan}
사주 4기둥: ${args.user.yeon_pillar} / ${args.user.wol_pillar} / ${args.user.il_pillar} / ${args.user.si_pillar ?? '(시주 없음)'}
현재 대운: ${args.user.daeun_current}

[일간 특성 참고 — 이 정보를 근거로 해석하되 그대로 인용하지 말 것]
${args.ilganChunk}
`;
}
```

Claude API 호출 시:
- `system`: `buildSystemPrompt()`
- `messages`: `[{ role: 'user', content: buildUserContextBlock(...) + '\n[현재 메시지]\n' + 사용자 메시지 }]`
  - 또는 더 깔끔하게: 사용자 컨텍스트는 첫 user message에 한 번 넣고, 그 뒤로는 `recentMessages` + 현재 메시지

> 구현 결정: 사용자 컨텍스트가 매 호출마다 들어가야 하므로 `system` 안에 `[USER_CONTEXT]` placeholder를 두고 매번 치환하는 방식이 가장 깔끔. Claude Code가 판단해서 결정.

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

## 8. Non-Goals (절대 만들지 마세요)

이 리스트는 **scope creep 방지용 신성불가침 영역**입니다.

- ❌ 회원가입/소셜 로그인 (익명 + localStorage UUID)
- ❌ 결제/구독/RevenueCat 통합
- ❌ 운세 카테고리 분리 탭 (재물/연애/건강 따로 보기 X)
- ❌ **콘텐츠 카드 선택 모드 (플롯과 동일한 형태) — 의식적으로 제거**. 폴라리스의 차별화 포인트가 정확히 *"콘텐츠 선택 없이 임의의 상황을 던지면 된다"*이므로, 사전 정의된 운세 카드를 추가하면 가설 자체가 무너짐.
- ❌ 일일 운세 푸시 알림
- ❌ 화려한 명식 시각화 (인포그래픽, 차트, 동그라미 그래프 X — 텍스트로 충분)
- ❌ 다국어 (한국어만)
- ❌ 모바일 네이티브 앱 (web만)
- ❌ 사주 정통 해설 모드 (학술적 모드)
- ❌ 궁합 (두 명식 비교)
- ❌ 음성 입력
- ❌ 결과 이미지 공유 카드
- ❌ 광고
- ❌ 관리자 페이지
- ❌ 이메일 발송
- ❌ 분석 도구 통합 (GA4, Mixpanel) — 시간 낭비

만들고 싶은 충동이 들면 **이 리스트 다시 읽고 자르세요.**

---

## 9. 7일 일정 (남은 시간 기준 가이드)

| Day | 작업 | 산출물 |
|---|---|---|
| 1 (반일) | 마크다운 정리, RAG 단순화, seed-rag 재실행 | `saju_knowledge` 깨끗한 상태 |
| 2 | 만세력 lib 검증, `/api/onboarding`, 온보딩 UI | 명식 입력 → DB 저장 동작 |
| 3 | `/api/chat` + 스트리밍 + 채팅 UI 기본 | 첫 응답까지 동작 |
| 4 | 사이드바, 첫 인사 LLM, 톤 다듬기 | "친구 톤" 완성 |
| 5 | 두 번째 세션 follow-up, 메모리 확인, 버그 | "기억하는 폴라리스" 완성 |
| 6 | UX hygiene, 에러 처리, 모바일 반응형, 데모 영상 | 평가자가 써볼 만한 상태 |
| 7 | README, ONEPAGER.md, Vercel 배포, 데모 GIF | 제출 준비 완료 |

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
Next.js 15 / TypeScript / TailwindCSS / Supabase pgvector / Claude Sonnet 4.5 / OpenAI Embeddings / Vercel

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
- **Claude Sonnet 4.5 (런타임)**: 메인 LLM. 한국어 톤이 가장 자연스러워 채택.
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

배포 직전 이 체크리스트로 검증:

**기능**
- [ ] 첫 방문 → 온보딩 → 명식 계산 → 채팅 진입 흐름이 끊김 없음
- [ ] "시간 모름" 옵션 동작
- [ ] 음력 입력 정확히 양력 변환
- [ ] 채팅 응답 스트리밍 동작
- [ ] 새로고침 후 대화 이력 유지 (localStorage UUID 기반)
- [ ] 두 번째 세션 진입 시 follow-up 인사

**톤**
- [ ] 첫 응답이 5문장 이하 + 되묻기 포함
- [ ] 보고서 톤 ("그대의 운명은") 0건
- [ ] 명식 근거가 자연스러운 한 줄로 녹아있음
- [ ] 단정 표현 ("반드시", "평생") 0건

**기술**
- [ ] Vercel 배포 URL 정상 접속
- [ ] 환경변수 누락 없음
- [ ] RAG retrieval Top-1 정확도 100% (일간으로 일간 chunk 매칭)
- [ ] 모바일 viewport (375px) 깨지지 않음

**문서**
- [ ] README 의사결정 기록 섹션 채워짐
- [ ] AI 도구 활용 섹션 솔직하게 작성됨
- [ ] ONEPAGER.md 4개 항목 모두 채워짐
- [ ] 데모 GIF README 상단 노출

---

## 13. Claude Code 작업 시작 시 첫 5단계

이 SPEC을 기반으로 Claude Code에게 시킬 첫 작업 순서:

1. `pnpm create next-app` (TypeScript, Tailwind, App Router)
2. Supabase 마이그레이션 SQL 작성 (위 4번 스키마 그대로)
3. `lib/saju/manseryuk.ts` — `@fullstackfamily/manseryeok` 설치 후 SPEC 2번의 5개 검증 케이스로 단위 테스트. 5개 모두 통과 시 채택, 실패 시 fallback 후보로 이동.
4. `scripts/seed-rag.ts` — `ilgan-characteristics.md`만 임베딩
5. `/api/onboarding` + `/onboarding` 페이지 → 명식 입력 동작까지

여기까지 1.5일이면 채팅 토대 위에 올릴 준비 끝. 그 후 채팅 + 톤 작업이 진짜 본 게임.

---

**끝.** 막히면 SPEC 11번(README 의사결정)부터 다시 읽으세요. *"왜 만드는지"*가 흐려질 때마다 가설 한 문장으로 돌아가면 됩니다:

> 사람들이 사주에서 진짜 원하는 건 정해진 운명 보고서가 아니라, 내 상황을 들어주고 사주 프레임으로 해석해주는 대화 상대다.
