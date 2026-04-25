/**
 * 선택형 상담 플로우 데이터
 * 카테고리 → 세부 상황 → 긴급도 단계별 선택지 정의
 */

export interface ConsultCategory {
  key: string
  label: string
  emoji: string
  description: string
  situations: ConsultSituation[]
}

export interface ConsultSituation {
  label: string
  emoji: string
  /** Claude에 전달할 상세 맥락 */
  context: string
}

export interface UrgencyOption {
  label: string
  emoji: string
  value: string
  /** Claude에 전달할 시급도 맥락 */
  context: string
}

// ─── 카테고리 + 세부 상황 ───

export const CONSULT_CATEGORIES: ConsultCategory[] = [
  {
    key: "직장",
    label: "직장·커리어",
    emoji: "💼",
    description: "이직, 갈등, 스트레스, 성장",
    situations: [
      { label: "이직 고민", emoji: "🚪", context: "현재 직장을 떠나 이직을 고민하고 있음" },
      { label: "상사/동료 갈등", emoji: "😤", context: "직장 내 상사나 동료와의 인간관계 갈등" },
      { label: "업무 스트레스", emoji: "😵", context: "업무량, 번아웃, 직무 스트레스" },
      { label: "승진/평가", emoji: "📊", context: "승진 기회, 인사 평가, 커리어 성장" },
    ],
  },
  {
    key: "관계",
    label: "관계·연애",
    emoji: "💕",
    description: "만남, 갈등, 이별, 가족",
    situations: [
      { label: "새로운 만남", emoji: "💘", context: "새로운 연인이나 인연을 만나고 싶음" },
      { label: "연인과의 갈등", emoji: "💔", context: "현재 연인과의 관계 갈등, 소통 문제" },
      { label: "이별/감정 정리", emoji: "🥀", context: "이별 후 감정 정리, 관계 정리" },
      { label: "가족 관계", emoji: "👨‍👩‍👧", context: "부모, 형제, 가족 간의 관계 고민" },
    ],
  },
  {
    key: "재물",
    label: "재물·투자",
    emoji: "💰",
    description: "저축, 투자, 사업, 수입",
    situations: [
      { label: "저축/재테크", emoji: "🏦", context: "저축 방법, 재테크 전략" },
      { label: "투자 결정", emoji: "📈", context: "주식, 부동산 등 투자 결정" },
      { label: "사업/창업", emoji: "🏢", context: "사업 시작, 창업 고민" },
      { label: "수입 불안", emoji: "😰", context: "수입 감소, 경제적 불안감" },
    ],
  },
  {
    key: "건강",
    label: "건강·에너지",
    emoji: "🏃",
    description: "체력, 스트레스, 의욕, 습관",
    situations: [
      { label: "체력/피로감", emoji: "😪", context: "만성 피로, 체력 저하" },
      { label: "스트레스/불안", emoji: "😥", context: "정신적 스트레스, 불안감" },
      { label: "의욕 저하", emoji: "😶", context: "의욕 상실, 우울감, 무기력" },
      { label: "생활습관 개선", emoji: "🌅", context: "수면, 운동, 식습관 등 생활습관 개선" },
    ],
  },
]

export const URGENCY_OPTIONS: UrgencyOption[] = [
  { label: "오늘 바로", emoji: "⚡", value: "urgent", context: "오늘 당장 행동이 필요한 급한 상황" },
  { label: "이번 주", emoji: "📅", value: "this_week", context: "이번 주 내로 방향을 정하고 싶은 상황" },
  { label: "이번 달", emoji: "📆", value: "this_month", context: "한 달 정도의 여유를 두고 고민 중" },
  { label: "장기적", emoji: "⏳", value: "long_term", context: "장기적 방향성에 대한 고민" },
]

// ─── 유틸리티 ───

/**
 * 선택형 플로우 결과를 Claude에 전달할 질문 문자열로 조합
 */
export function buildQuestionFromFlow(
  category: ConsultCategory,
  situation: ConsultSituation,
  urgency: UrgencyOption,
  detail?: string
): string {
  const parts = [
    `[상담 영역: ${category.label}]`,
    `[구체적 상황: ${situation.label} — ${situation.context}]`,
    `[시급도: ${urgency.label} — ${urgency.context}]`,
  ]

  if (detail?.trim()) {
    parts.push(`\n사용자가 추가로 알려준 맥락:\n${detail.trim()}`)
  }

  return parts.join("\n")
}

/**
 * 카테고리 키로 카테고리 객체 찾기
 */
export function findCategory(key: string): ConsultCategory | undefined {
  return CONSULT_CATEGORIES.find(c => c.key === key)
}
