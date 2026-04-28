/**
 * 코칭 캐릭터 레지스트리 — 클라이언트/서버 공용
 */

export type CharacterId = "seonbi" | "mudang" | "janggun" | "sunnyeo" | "dokkaebi"

export interface CharacterConfig {
  id: CharacterId
  name: string
  identity: string
  emoji: string
  description: string
  sampleLine: string
  colorClass: {
    avatarBg: string
    nameText: string
    borderLeft: string
  }
}

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  seonbi: {
    id: "seonbi",
    name: "선비",
    identity: "조선시대 젊은 학자",
    emoji: "📜",
    description: "정중하고 격조 있는 말투로 조언하는 학자",
    sampleLine: "그대의 사주를 살펴보니, 참으로 흥미로운 기운이 흐르고 있습니다.",
    colorClass: {
      avatarBg: "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30",
      nameText: "text-amber-700 dark:text-amber-300",
      borderLeft: "border-l-amber-300/50 dark:border-l-amber-600/30",
    },
  },
  mudang: {
    id: "mudang",
    name: "무녀",
    identity: "신비로운 무속인",
    emoji: "🔮",
    description: "직감적이고 영적인 분위기의 상담사",
    sampleLine: "기운이 보여... 지금 그대 안에 큰 변화의 흐름이 있어.",
    colorClass: {
      avatarBg: "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/30",
      nameText: "text-purple-700 dark:text-purple-300",
      borderLeft: "border-l-purple-300/50 dark:border-l-purple-600/30",
    },
  },
  janggun: {
    id: "janggun",
    name: "장군",
    identity: "강직한 무장",
    emoji: "⚔️",
    description: "직설적으로 핵심만 짚어주는 무장",
    sampleLine: "핵심만 말하겠다. 지금 네 사주에서 가장 중요한 건 이거다.",
    colorClass: {
      avatarBg: "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/30",
      nameText: "text-red-700 dark:text-red-300",
      borderLeft: "border-l-red-300/50 dark:border-l-red-600/30",
    },
  },
  sunnyeo: {
    id: "sunnyeo",
    name: "선녀",
    identity: "하늘에서 내려온 존재",
    emoji: "🌸",
    description: "부드럽고 따뜻하게 위로해주는 존재",
    sampleLine: "괜찮아요, 지금 느끼는 감정은 아주 자연스러운 거예요.",
    colorClass: {
      avatarBg: "bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/40 dark:to-sky-800/30",
      nameText: "text-sky-700 dark:text-sky-300",
      borderLeft: "border-l-sky-300/50 dark:border-l-sky-600/30",
    },
  },
  dokkaebi: {
    id: "dokkaebi",
    name: "도깨비",
    identity: "장난기 넘치는 도깨비",
    emoji: "👹",
    description: "유쾌하고 위트 있게 풀어주는 장난꾸러기",
    sampleLine: "야, 이거 재밌는데? 네 사주 한번 까봤는데 말이야~ 😏",
    colorClass: {
      avatarBg: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/30",
      nameText: "text-emerald-700 dark:text-emerald-300",
      borderLeft: "border-l-emerald-300/50 dark:border-l-emerald-600/30",
    },
  },
}

export const DEFAULT_CHARACTER: CharacterId = "seonbi"
export const CHARACTER_LIST = Object.values(CHARACTERS)
