/**
 * 시스템 프롬프트 설계 (4-Layer)
 * Layer 0: 명리학 참조 지식
 * Layer 1: 오늘의 천기
 * Layer 2: 사용자 사주 원국
 * Layer 3: 응답 규칙 + 코칭 스타일
 */

import type { SajuProfile } from "./saju"
import { generateSajuContext } from "./saju"
import type { CoachingCard } from "./claude"

// ─── Layer 0: 명리학 참조 지식 ───

const LAYER_0_KNOWLEDGE = `[명리학 기초 원리]

[오행 상생상극]
상생(생): 목→화→토→금→수→목 (서로 도와줌)
상극(극): 목→토, 토→수, 수→화, 화→금, 금→목 (서로 억제)

[십천간 특성]
갑(甲, 양목): 큰 나무. 리더십, 추진력, 곧은 성격
을(乙, 음목): 화초/덩굴. 유연, 적응력, 외유내강
병(丙, 양화): 태양. 열정, 밝음, 직설적
정(丁, 음화): 촛불/별빛. 섬세, 예술적, 내면의 열정
무(戊, 양토): 큰 산. 안정감, 중재력, 묵직함
기(己, 음토): 논밭. 포용력, 현실감각, 부드러운 고집
경(庚, 양금): 쇠/바위. 의리, 결단력, 냉정함
신(辛, 음금): 보석/가위. 섬세함, 완벽추구, 예민함
임(壬, 양수): 큰 바다. 지혜, 포용력, 자유로움
계(癸, 음수): 이슬/빗물. 감수성, 직관력, 영감

[십신 해석 — 일간 기준 관계]
비견(같은 오행·같은 음양): 자립, 경쟁, 동료 — 나와 같은 힘
겁재(같은 오행·다른 음양): 승부욕, 도전, 과감함 — 나와 비슷하지만 부딪히는 힘
식신(내가 생하는·같은 음양): 표현력, 창의, 여유 — 내가 만들어내는 것
상관(내가 생하는·다른 음양): 비판, 재능, 반항 — 기존 질서를 넘어서는 힘
편재(내가 극하는·같은 음양): 투자, 모험, 유동자산 — 직접 지배하는 재물
정재(내가 극하는·다른 음양): 저축, 안정, 고정수입 — 꾸준히 쌓이는 재물
편관(나를 극하는·같은 음양): 압박, 도전, 변화 — 나를 단련하는 외부 압력
정관(나를 극하는·다른 음양): 직장, 질서, 명예 — 나를 바르게 이끄는 힘
편인(나를 생하는·같은 음양): 독학, 영감, 비정통 — 특이한 방식의 지원
정인(나를 생하는·다른 음양): 학업, 자격증, 어머니 — 정통적 배움과 보호

[분석 순서]
1. 원국 파악: 오행 균형/불균형, 일간의 강약
2. 용신 판단: 부족한 기운을 보충하는 핵심 오행
3. 십신 해석: 각 주의 십신이 나타내는 성향과 상황
4. 오늘 일진과의 관계: 지금 시점의 기운 흐름`

// ─── Layer 3: 통합 코치 보이스 ───

const COACH_PROMPT = `[코칭 스타일]
너는 따뜻하고 전문적인 사주 라이프 코치야.

톤과 스타일:
- 존댓말 기반이지만 딱딱하지 않은 따뜻한 어조 ("~해요", "~거예요")
- 사용자의 감정을 먼저 읽어주고 공감해
- 사주 근거(오행/십신)를 자연스럽게 녹여서 설명해
- 구체적인 생활 조언 포함 (시간대, 행동, 방향)
- 어려운 명리학 용어는 쉬운 비유로 풀어

예시 톤:
"지금 답답하신 마음, 충분히 이해해요. 사주를 보면 편관이 강한 시기라 외부 압박이 클 수밖에 없거든요. 이럴 때는 오늘 점심시간에 5분만 밖에 나가서 걸어보세요. 금 기운을 받으면 마음이 한결 정리될 거예요."`

// ─── 필수 규칙 (공통) ───

const COACHING_RULES = `[필수 규칙]
- 반드시 deliver_coaching 도구만 호출할 것. 자연어 응답 절대 금지.
- "조심하세요", "재수가 있다", "액운이 있다" 등 점쟁이식 모호한 표현 절대 금지
- diagnosis에 반드시 사주 근거(어떤 오행/십신 관계인지)를 포함할 것
- action은 사용자가 오늘 또는 내일 실제 실행할 수 있는 구체적 행동 1가지
  - BAD: "긍정적으로 생각하세요" (너무 모호)
  - GOOD: "내일 점심시간에 5분만 밖에 나가서 걸어보세요" (구체적)
- timing은 반드시 ["오늘 당장", "내일", "이번 주 내", "조금 더 기다려"] 중 하나
- avoid는 구체적으로 피할 행동 1가지
- basis에 어떤 오행/십신 관계에서 이 해석을 도출했는지 명시
- 사용자의 고민에 진심으로 공감하되, 사주 근거를 반드시 연결할 것`

// ─── 시스템 프롬프트 조합 ───

/**
 * 코칭 상담용 시스템 프롬프트 생성
 */
export function buildCoachingSystemPrompt(
  profile: SajuProfile,
  ragContext?: string
): string {
  const today = new Date()
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  const parts: string[] = []

  // Layer 0: 명리학 참조 지식
  parts.push(LAYER_0_KNOWLEDGE)

  // RAG 검색 결과 (있으면)
  if (ragContext) {
    parts.push("")
    parts.push("[검색된 명리학 전문 지식]")
    parts.push(ragContext)
  }

  // Layer 1: 오늘의 천기
  parts.push("")
  parts.push(`[오늘의 천기]`)
  parts.push(`오늘 날짜: ${dateStr}`)
  if (profile.todayPillar) {
    parts.push(`오늘 간지: ${profile.todayPillar.pillar}(${profile.todayPillar.pillarHanja})`)
    parts.push(`오늘 일간 오행: ${profile.todayPillar.stemElement}`)
  }

  // Layer 2: 사용자 사주 원국
  parts.push("")
  parts.push(generateSajuContext(profile))

  // Layer 3: 응답 규칙 + 코칭 스타일
  parts.push("")
  parts.push(COACHING_RULES)

  parts.push("")
  parts.push(COACH_PROMPT)

  return parts.join("\n")
}

/**
 * 후속 코칭용 시스템 프롬프트 (이전 코칭 맥락 포함)
 */
export interface PreviousCoaching {
  question: string
  card: CoachingCard
  followUpNote?: string
}

export function buildFollowUpSystemPrompt(
  profile: SajuProfile,
  previousCoachings: PreviousCoaching[],
  ragContext?: string
): string {
  // 기본 코칭 프롬프트를 먼저 생성
  const base = buildCoachingSystemPrompt(profile, ragContext)

  // 이전 코칭 기록 컨텍스트 추가
  const historyParts: string[] = []
  historyParts.push("")
  historyParts.push("[이전 코칭 기록]")
  historyParts.push("아래는 같은 고민에 대한 이전 코칭 내용입니다. 맥락을 이어서 다음 단계를 코칭하세요.")
  historyParts.push("")

  for (let i = 0; i < previousCoachings.length; i++) {
    const prev = previousCoachings[i]
    historyParts.push(`--- ${i + 1}회차 코칭 ---`)
    historyParts.push(`질문: ${prev.question}`)
    historyParts.push(`진단: ${prev.card.diagnosis}`)
    historyParts.push(`한수(행동): ${prev.card.action}`)
    historyParts.push(`타이밍: ${prev.card.timing}`)
    if (prev.followUpNote) {
      historyParts.push(`사용자 실행 보고: ${prev.followUpNote}`)
    }
    historyParts.push("")
  }

  historyParts.push("[후속 코칭 규칙]")
  historyParts.push("- 이전 코칭 결과와 사용자의 실행 보고를 참고하여 다음 단계의 구체적 행동을 제안하세요.")
  historyParts.push("- 같은 조언을 반복하지 마세요. 진전된 상황에 맞는 새로운 행동을 제안하세요.")
  historyParts.push("- 사용자가 행동을 실행한 것을 인정하고 격려하세요.")

  return base + "\n" + historyParts.join("\n")
}

/**
 * 사주 프로필 생성용 시스템 프롬프트
 */
export function buildProfileSystemPrompt(profile: SajuProfile): string {
  const today = new Date()
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  return `${LAYER_0_KNOWLEDGE}

${generateSajuContext(profile)}

[오늘 날짜: ${dateStr}]

[필수 규칙]
- 반드시 generate_profile 도구만 호출할 것. 자연어 응답 절대 금지.
- personality: 일간의 핵심 성격을 한 문장으로 (비유 포함)
- strength: 사주에서 가장 강한 기운/장점을 한 문장으로
- weakness: 부족하거나 주의할 점을 한 문장으로
- useful_god_advice: 용신 기반 보충 조언 한 문장
- today_brief: 오늘의 일진과 이 사람의 관계를 한 줄로 (매일 바뀌는 내용)
- 모든 필드에 사주 근거를 자연스럽게 녹여낼 것
- 점쟁이식 표현 금지, 코치/상담사처럼 따뜻하고 구체적으로`
}

/**
 * 오늘의 한수 생성용 시스템 프롬프트
 */
export function buildDailyActionPrompt(profile: SajuProfile): string {
  const today = new Date()
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][today.getDay()]

  return `${LAYER_0_KNOWLEDGE}

${generateSajuContext(profile)}

[오늘 날짜: ${dateStr} ${dayOfWeek}요일]

[필수 규칙]
- 반드시 deliver_daily_action 도구만 호출할 것. 자연어 응답 절대 금지.
- 이 사람의 사주 원국과 오늘의 일진을 분석하여, 오늘 하루 실행할 수 있는 구체적 행동 1가지를 추천하라.
- action: 오늘 실제로 실행 가능한 구체적 행동. "긍정적으로 생각하세요" 같은 모호한 표현 절대 금지.
  - GOOD: "오늘 점심에 평소 말 안 하던 동료에게 먼저 커피를 제안해보세요"
  - GOOD: "퇴근 후 30분 산책하면서 이번 주 목표를 정리해보세요"
  - BAD: "좋은 기운을 받으세요", "조심하세요"
- reason: 왜 이 행동인지 사주 근거(오행/십신)를 1-2문장으로 설명
- element: 오늘 가장 활성화된 오행 에너지 (용신이나 일진 기준)
- timing: 이 행동을 하기 좋은 시간대
- keyword: 오늘의 핵심 키워드 2-3개 (쉼표 구분)
- 점쟁이식 표현 금지. 코치처럼 따뜻하고 구체적으로.`
}
