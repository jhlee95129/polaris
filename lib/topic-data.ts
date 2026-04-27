/* ── 상담 토픽 카테고리 데이터 (홈 + 대시보드 공유) ── */

export interface TopicCard {
  key: string
  prompt: string
  emoji: string
  message: string
  bg: string   // 파스텔 배경
}

export interface TopicCategory {
  label: string
  emoji: string
  cards: TopicCard[]
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    label: "지금 많이 묻는 고민",
    emoji: "🔥",
    cards: [
      { key: "quit",       prompt: "이직해야 할까, 버텨야 할까?",     emoji: "💼", bg: "bg-blue-50 dark:bg-blue-950/40",    message: "요즘 이직 고민이 있어" },
      { key: "love-future",prompt: "이 사람이랑 미래가 있을까?",       emoji: "💕", bg: "bg-pink-50 dark:bg-pink-950/40",    message: "연애 고민이 있어" },
      { key: "money-big",  prompt: "이번 달 좀 크게 써도 될까?",       emoji: "💰", bg: "bg-amber-50 dark:bg-amber-950/40",  message: "재물운이 궁금해" },
      { key: "today",      prompt: "오늘 하루 어떨까?",                emoji: "✨", bg: "bg-violet-50 dark:bg-violet-950/40",message: "오늘 운세 봐줘" },
    ],
  },
  {
    label: "직장·커리어",
    emoji: "💼",
    cards: [
      { key: "boss",       prompt: "상사랑 자꾸 부딪히는데",           emoji: "😤", bg: "bg-orange-50 dark:bg-orange-950/40", message: "직장 상사랑 관계가 안 좋아" },
      { key: "promo",      prompt: "승진할 수 있을까?",                emoji: "📈", bg: "bg-emerald-50 dark:bg-emerald-950/40",message: "승진 가능성이 궁금해" },
      { key: "burnout",    prompt: "번아웃인 것 같은데...",             emoji: "🔥", bg: "bg-red-50 dark:bg-red-950/40",      message: "요즘 번아웃이 온 것 같아" },
      { key: "interview",  prompt: "면접 앞두고 있어",                 emoji: "🎯", bg: "bg-cyan-50 dark:bg-cyan-950/40",    message: "면접이 곧인데 조언해줘" },
    ],
  },
  {
    label: "연애·관계",
    emoji: "❤️",
    cards: [
      { key: "crush",      prompt: "고백해도 될까?",                   emoji: "💗", bg: "bg-rose-50 dark:bg-rose-950/40",    message: "좋아하는 사람한테 고백할까 고민이야" },
      { key: "fight",      prompt: "연인이랑 싸웠어",                  emoji: "💔", bg: "bg-pink-50 dark:bg-pink-950/40",    message: "연인이랑 크게 싸웠어" },
      { key: "ex",         prompt: "전 애인이 자꾸 생각나",             emoji: "🌧️", bg: "bg-slate-50 dark:bg-slate-950/40",  message: "헤어진 사람이 자꾸 생각나" },
      { key: "family",     prompt: "부모님이랑 갈등이 있어",            emoji: "🏠", bg: "bg-teal-50 dark:bg-teal-950/40",    message: "가족 관계 고민이 있어" },
    ],
  },
  {
    label: "나를 찾는 시간",
    emoji: "🧭",
    cards: [
      { key: "direction",  prompt: "뭘 해야 할지 모르겠어",            emoji: "🧭", bg: "bg-indigo-50 dark:bg-indigo-950/40",message: "요즘 방향을 못 잡겠어" },
      { key: "talent",     prompt: "내 적성이 뭘까?",                  emoji: "💡", bg: "bg-yellow-50 dark:bg-yellow-950/40",message: "내 적성이 궁금해" },
      { key: "anxiety",    prompt: "불안해서 잠이 안 와",               emoji: "😰", bg: "bg-purple-50 dark:bg-purple-950/40",message: "요즘 불안감이 심해" },
      { key: "free",       prompt: "다른 고민이 있어...",               emoji: "💬", bg: "bg-gray-50 dark:bg-gray-900/40",   message: "" },
    ],
  },
]
