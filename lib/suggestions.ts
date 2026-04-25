/**
 * 사주 프로필 기반 질문 제안 로직
 * API 호출 없이 클라이언트에서 순수 로직으로 생성
 */

import type { SajuProfile } from "./saju"

// StoredProfile에서 rawResult가 제거된 형태도 호환 가능하도록
type SajuProfileLike = Omit<SajuProfile, "rawResult"> & { rawResult?: unknown }
import type { TenGodKey, Element } from "./saju-data"

export interface SuggestedQuestion {
  text: string
  emoji: string
  category: string
}

// 십신 기반 질문 매핑
const TEN_GOD_QUESTIONS: Record<string, SuggestedQuestion> = {
  편관: { text: "직장에서 스트레스 받고 있는데 어떻게 해야 할까요?", emoji: "😤", category: "직장" },
  정관: { text: "승진이나 커리어 성장, 어떻게 준비하면 좋을까요?", emoji: "📈", category: "직장" },
  식신: { text: "새로운 취미나 사이드 프로젝트를 시작하고 싶어요", emoji: "🎨", category: "건강" },
  상관: { text: "지금 하는 일이 맞는 건지 모르겠어요", emoji: "🤔", category: "직장" },
  편재: { text: "투자나 부업, 지금 시작해도 될까요?", emoji: "💰", category: "재물" },
  정재: { text: "저축과 재테크, 어떻게 시작하면 좋을까요?", emoji: "🏦", category: "재물" },
  비견: { text: "주변 사람들과의 관계가 요즘 어렵게 느껴져요", emoji: "👥", category: "관계" },
  겁재: { text: "경쟁 상황에서 어떻게 해야 이길 수 있을까요?", emoji: "🏆", category: "직장" },
  편인: { text: "공부나 자기계발, 어떤 방향이 좋을까요?", emoji: "📚", category: "건강" },
  정인: { text: "멘토나 도움을 줄 사람을 어떻게 찾을 수 있을까요?", emoji: "🤝", category: "관계" },
}

// 부족 오행 기반 질문 매핑
const WEAK_ELEMENT_QUESTIONS: Record<Element, SuggestedQuestion> = {
  목: { text: "새로운 도전을 하고 싶은데 용기가 안 나요", emoji: "🌱", category: "건강" },
  화: { text: "요즘 의욕이 없고 에너지가 부족해요", emoji: "🔥", category: "건강" },
  토: { text: "마음이 불안하고 안정감이 없어요", emoji: "🏔️", category: "건강" },
  금: { text: "결정을 못 내리고 자꾸 미루게 돼요", emoji: "⚔️", category: "직장" },
  수: { text: "생각이 정리가 안 되고 혼란스러워요", emoji: "🌊", category: "건강" },
}

// 오늘 일진 기반 질문
const TODAY_QUESTIONS = {
  상극: { text: "오늘 하루가 힘들 것 같은데 어떻게 보내면 좋을까요?", emoji: "💪", category: "건강" },
  상생: { text: "오늘 특별히 잘 풀릴 일이 있을까요?", emoji: "✨", category: "직장" },
}

/**
 * 사주 프로필 기반 맞춤 질문 제안 (최대 4개)
 */
export function getSuggestedQuestions(profile: SajuProfileLike): SuggestedQuestion[] {
  const questions: SuggestedQuestion[] = []
  const seen = new Set<string>()

  function add(q: SuggestedQuestion) {
    if (!seen.has(q.text) && questions.length < 4) {
      seen.add(q.text)
      questions.push(q)
    }
  }

  // 1. 오늘 일진 기반 (가장 시의성 높음)
  if (profile.todayInteraction) {
    if (profile.todayInteraction.includes("압박") || profile.todayInteraction.includes("억제")) {
      add(TODAY_QUESTIONS.상극)
    } else if (profile.todayInteraction.includes("좋은") || profile.todayInteraction.includes("빛나는")) {
      add(TODAY_QUESTIONS.상생)
    }
  }

  // 2. 주요 십신 기반
  for (const tg of profile.dominantTenGods) {
    const q = TEN_GOD_QUESTIONS[tg]
    if (q) add(q)
  }

  // 3. 부족 오행 기반
  const weakQ = WEAK_ELEMENT_QUESTIONS[profile.weakestElement]
  if (weakQ) add(weakQ)

  // 4. 카테고리 다양성 보장 — 중복 카테고리가 많으면 다른 것 추가
  if (questions.length < 4) {
    const usedCategories = new Set(questions.map(q => q.category))
    const fallbacks: SuggestedQuestion[] = [
      { text: "연애운이 궁금해요", emoji: "💕", category: "관계" },
      { text: "건강 관리는 어떻게 하면 좋을까요?", emoji: "🏃", category: "건강" },
      { text: "이번 달 재물운은 어떤가요?", emoji: "💰", category: "재물" },
      { text: "요즘 전반적으로 운세가 어떤가요?", emoji: "🔮", category: "직장" },
    ]
    for (const fb of fallbacks) {
      if (!usedCategories.has(fb.category)) {
        add(fb)
      }
    }
  }

  return questions.slice(0, 4)
}
