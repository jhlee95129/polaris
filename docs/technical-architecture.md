# 한 수 — 기술 아키텍처

## 전체 아키텍처

```
[사용자: 고민 입력]
       ↓
[1] 만세력 계산 (@fullstackfamily/manseryeok)
    → 사주팔자(4주), 오행 분포, 십신, 용신
       ↓
[2] RAG 검색 (Supabase pgvector + OpenAI Embeddings)
    → 질문 + 사주 키워드 임베딩 → 명리학 지식 Top-5 검색
       ↓
[3] Claude API (tool_use)
    → System: 사주 원국 + RAG 결과 + 캐릭터 톤 + 코칭 규칙
    → User: 고민 텍스트
    → Tool: deliver_coaching (5필드 구조화 출력)
       ↓
[코칭 카드 렌더링]
```

---

## 1. 사주 계산 엔진

### 라이브러리 선택: `@fullstackfamily/manseryeok`

비교 검토한 라이브러리:
| 라이브러리 | 언어 | 사주 계산 | 한국 특화 | 선택 이유 |
|---|---|---|---|---|
| `lunar-javascript` | JS | X (음양력 변환만) | X (중국 기준) | 사주 계산 불가 |
| `korean-lunar-calendar` | JS | X (변환만) | O | 사주 계산 불가 |
| **`@fullstackfamily/manseryeok`** | TS | **O** | **O (KASI 기반)** | **사주팔자 직접 계산, 한국 표준시 보정** |

### 핵심 결정: LLM이 아닌 전용 라이브러리로 사주 계산

LLM(ChatGPT, Claude)이 직접 사주를 계산하면 **확률적으로만 맞다**. 입춘 경계, 절기 기반 월주, 자시 경계 등을 정확히 처리하려면 전용 만세력 데이터가 필수.

이 분리가 핵심 차별점:
- **계산**: 만세력 라이브러리 (결정적, 100% 정확)
- **해석**: Claude AI (확률적이지만 맥락 이해 가능)

### 직접 구현한 로직

만세력 라이브러리가 제공하지 않는 부분:
- **십신(十神) 계산**: 일간 기준 다른 천간/지지와의 오행·음양 관계로 계산 (`lib/saju-data.ts`)
- **용신(用神) 추론**: 오행 균형 + 일간 강약 기반 간이 추론 (`inferUsefulGod`)
- **오늘의 일진 해석**: 오늘 간지와 사용자 일간의 십신 관계 → 일상 언어 변환

---

## 2. RAG 파이프라인

### 왜 RAG인가?

시스템 프롬프트에 모든 명리학 지식을 넣으면:
- 토큰 비용 증가 (매 요청마다 전체 지식 전송)
- 컨텍스트 노이즈 (관련 없는 정보가 답변 품질 저하)

RAG를 사용하면:
- **질문에 관련된 지식만 선별**하여 프롬프트에 주입
- 지식 확장이 용이 (새 텍스트 추가 → 임베딩 → 저장)
- 면접에서 기술적 깊이를 증명할 수 있는 포인트

### 벡터DB 선택: Supabase pgvector

| 옵션 | 비용 | 설정 복잡도 | 선택 이유 |
|---|---|---|---|
| Pinecone | 유료 | 별도 서비스 | 프리티어 제한, 별도 관리 |
| Chroma | 무료 | 셀프 호스팅 | 배포 인프라 필요 |
| **Supabase pgvector** | **무료 (프리티어)** | **이미 Supabase 사용** | **DB + Auth + 벡터를 하나의 서비스로** |

### 청킹 전략

```
소스 텍스트 (Markdown)
  ↓ ## 헤더 기준 섹션 분리
  ↓ 섹션 > 1000자면 문단 단위 분할 (100자 오버랩)
  ↓
청크 (category, title, content)
  ↓ OpenAI text-embedding-3-small (1536차원)
  ↓
pgvector HNSW 인덱스 (코사인 유사도)
```

- **청크 크기**: ~1000자 (한국어 500토큰 상당)
- **오버랩**: 100자 (문맥 연속성 보장)
- **분할 기준**: 마크다운 ## 헤더 → 문단 → 글자 수
- **임베딩 모델**: `text-embedding-3-small` (비용 효율적, 한국어 지원)

### 검색 흐름

```typescript
// 검색 쿼리 = 사용자 질문 + 사주 키워드
const searchText = `${question} ${dayStem} ${dominantElement} ${usefulGod} ${dominantTenGods.join(" ")}`

// 임베딩 → 코사인 유사도 검색 → Top-5 반환
const results = await supabase.rpc("match_saju_knowledge", {
  query_embedding: embedding,
  match_threshold: 0.3,
  match_count: 5,
})
```

### Graceful Degradation

환경변수(OPENAI_API_KEY, SUPABASE_*)가 없으면 RAG 없이 동작. 시스템 프롬프트의 Layer 0(명리학 기초 지식)이 폴백으로 작동.

---

## 3. 시스템 프롬프트 설계 (4계층)

```
Layer 0: 명리학 참조 지식 (기초 원리 — 항상 포함)
  + RAG 검색 결과 (관련 전문 지식 — 동적)
Layer 1: 오늘의 천기 (날짜, 간지, 오행 — 매일 변경)
Layer 2: 사용자 사주 원국 (사주팔자, 오행, 십신, 용신 — 사용자별 고정)
Layer 3: 응답 규칙 + 캐릭터 톤 (캐릭터별 분기)
```

### 왜 4계층인가?

- **L0**: Claude가 명리학 기본 원리를 알아야 올바른 해석 가능
- **L1**: 오늘의 기운과 사용자 사주의 관계가 코칭의 핵심
- **L2**: 사용자별 개인화. 같은 질문이라도 다른 사주면 다른 답
- **L3**: 같은 데이터를 다른 렌즈로 읽어 캐릭터 차별화

---

## 4. Claude tool_use 구조화 출력

### deliver_coaching 도구

```typescript
{
  name: "deliver_coaching",
  input_schema: {
    properties: {
      diagnosis: "왜 지금 어려운가 (사주 근거 포함, 2줄)",
      action: "구체적 행동 한 수 (실행 가능, 1줄)",
      timing: ["오늘 당장", "내일", "이번 주 내", "조금 더 기다려"],
      avoid: "피할 행동 (1줄)",
      basis: "명리학적 근거 (1-2줄)"
    }
  }
}
```

### 왜 tool_use인가?

자연어 응답 대신 tool_use를 강제하는 이유:
1. **UX 일관성**: 모든 코칭 카드가 동일한 5필드 구조 → UI 렌더링 안정
2. **품질 관리**: 필드별 제약(timing enum, 길이 제한)으로 출력 품질 보장
3. **측정 가능**: 구조화된 데이터로 코칭 품질 분석 가능

### tool_choice 강제

```typescript
tool_choice: { type: "tool", name: "deliver_coaching" }
```

Claude가 자연어로 우회하지 않도록 도구 호출을 강제.

---

## 5. 성능 최적화

### 예상 레이턴시 (RAG 포함)
| 단계 | 시간 |
|---|---|
| 사주 계산 (만세력) | < 1ms |
| RAG 임베딩 (OpenAI) | 100-300ms |
| RAG 벡터 검색 (pgvector) | 10-50ms |
| Claude API (tool_use) | 500-2000ms |
| **총** | **~1-2.5초** |

### RAG 없이 (환경변수 미설정)
| 단계 | 시간 |
|---|---|
| 사주 계산 | < 1ms |
| Claude API | 500-2000ms |
| **총** | **~0.5-2초** |

### 최적화 포인트
- 만세력 계산: 순수 연산, 외부 의존 없음 (< 0.1ms)
- pgvector HNSW 인덱스: 근사 최근접 이웃 검색으로 정확한 검색 대비 10x 빠름
- localStorage 캐싱: 사주 프로필을 클라이언트에 캐싱하여 재계산 방지

---

## 6. 데이터 설계

### MVP: localStorage
```typescript
interface StoredProfile {
  birthInfo: BirthInfo
  sajuProfile: SajuProfile  // 사주 데이터 캐싱
  summary?: ProfileSummary   // AI 프로필 요약 캐싱
}

interface StoredConsultation {
  id: string
  characterType: "sibling" | "grandma" | "analyst"
  question: string
  card: CoachingCard         // 5필드 구조
  feedback?: "helpful" | "not_helpful" | "not_tried"
}
```

### Production: Supabase PostgreSQL
```sql
-- 벡터 검색 테이블
CREATE TABLE saju_knowledge (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  -- HNSW 인덱스로 빠른 코사인 유사도 검색
);
```

점진적 마이그레이션: localStorage → Supabase Auth + PostgreSQL. 스키마 구조가 동일하므로 마이그레이션 비용 최소.
