/**
 * 명리학 구조화 데이터
 * 천간(十天干), 지지(十二地支), 십신(十神), 오행(五行) 특성
 */

// ─── 오행 (Five Elements) ───

export type Element = "목" | "화" | "토" | "금" | "수"

export const ELEMENTS: Record<Element, { name: string; nature: string; color: string; direction: string; season: string }> = {
  목: { name: "목(木)", nature: "성장·확장", color: "청색/녹색", direction: "동", season: "봄" },
  화: { name: "화(火)", nature: "열정·발산", color: "적색", direction: "남", season: "여름" },
  토: { name: "토(土)", nature: "안정·중재", color: "황색", direction: "중앙", season: "환절기" },
  금: { name: "금(金)", nature: "결단·수렴", color: "백색", direction: "서", season: "가을" },
  수: { name: "수(水)", nature: "지혜·유동", color: "흑색", direction: "북", season: "겨울" },
}

// 상생 (生): 목→화→토→금→수→목
export const GENERATING: Record<Element, Element> = {
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
}

// 상극 (克): 목→토, 토→수, 수→화, 화→금, 금→목
export const OVERCOMING: Record<Element, Element> = {
  목: "토", 토: "수", 수: "화", 화: "금", 금: "목",
}

// 피생 (被生): 나를 생하는 오행
export const GENERATED_BY: Record<Element, Element> = {
  목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
}

// 피극 (被克): 나를 극하는 오행
export const OVERCOME_BY: Record<Element, Element> = {
  목: "금", 화: "수", 토: "목", 금: "화", 수: "토",
}

// ─── 천간 (Heavenly Stems) ───

export type YinYang = "양" | "음"

export interface StemInfo {
  hangul: string
  hanja: string
  element: Element
  yinYang: YinYang
  description: string
  personality: string
}

export const STEMS: StemInfo[] = [
  { hangul: "갑", hanja: "甲", element: "목", yinYang: "양", description: "큰 나무", personality: "하늘을 향해 곧게 뻗는 큰 나무처럼 리더십과 추진력이 강합니다. 한번 결정하면 흔들리지 않고 밀고 나가는 우직함이 있어요. 정의감이 강하고 자존심이 높으며, 새로운 길을 개척하는 선구자적 기질을 타고났습니다. 다만 고집이 세고 융통성이 부족할 수 있어, 때로는 주변의 의견에 귀 기울이는 연습이 필요해요." },
  { hangul: "을", hanja: "乙", element: "목", yinYang: "음", description: "화초·덩굴", personality: "덩굴이 담장을 타고 오르듯 유연하게 환경에 적응하는 능력이 뛰어납니다. 겉으로는 부드럽지만 속으로는 강한 외유내강형이에요. 끈질기게 목표를 향해 나아가며, 사람들과의 관계에서 조화를 중시합니다. 감성이 풍부하고 눈치가 빨라 분위기를 잘 읽지만, 우유부단해 보일 수 있어 결단의 순간에는 과감해질 필요가 있어요." },
  { hangul: "병", hanja: "丙", element: "화", yinYang: "양", description: "태양", personality: "태양처럼 밝고 따뜻한 에너지로 주변을 환하게 밝히는 사람입니다. 열정적이고 직설적이며, 어디서든 자연스럽게 주목받는 존재감을 가지고 있어요. 낙천적이고 활동적이라 사람들이 자연스럽게 모여들고, 리더 역할을 맡는 경우가 많습니다. 다만 성격이 급하고 화끈한 면이 있어, 감정 조절과 인내심을 기르면 더 큰 빛을 발할 수 있어요." },
  { hangul: "정", hanja: "丁", element: "화", yinYang: "음", description: "촛불·별빛", personality: "촛불처럼 조용하지만 깊은 빛을 발하는 섬세한 사람입니다. 예술적 감각과 내면의 열정이 조화를 이루며, 한 가지에 몰두하면 놀라운 집중력을 보여줍니다. 직관력이 뛰어나고 사려 깊어서 상대방의 마음을 잘 헤아려요. 완벽주의 성향이 있고 감정 기복이 있을 수 있지만, 그만큼 깊이 있는 사고와 표현력으로 독보적인 매력을 가지고 있습니다." },
  { hangul: "무", hanja: "戊", element: "토", yinYang: "양", description: "큰 산", personality: "큰 산처럼 묵직하고 안정감 있는 존재입니다. 어떤 상황에서도 흔들리지 않는 듬직함으로 주변 사람들에게 신뢰를 줍니다. 중재력이 뛰어나 갈등 상황에서 중심을 잡아주는 역할을 잘 해요. 책임감이 강하고 약속을 중시하지만, 변화에 느리고 새로운 시도를 꺼리는 면이 있어 때로는 과감한 변화를 받아들이는 유연함이 필요합니다." },
  { hangul: "기", hanja: "己", element: "토", yinYang: "음", description: "논밭·평야", personality: "비옥한 논밭처럼 무엇이든 받아들이고 성장시키는 포용력을 가졌습니다. 현실감각이 뛰어나고 실용적이며, 부드러운 겉모습 안에 자기만의 확고한 신념을 품고 있어요. 사람들을 잘 돌보고 배려하며, 꾸준히 자기 길을 걸어갑니다. 겸손하지만 자기 가치를 과소평가하는 경향이 있을 수 있어, 자신의 성과를 인정하고 당당히 표현하는 연습이 도움이 됩니다." },
  { hangul: "경", hanja: "庚", element: "금", yinYang: "양", description: "쇠·바위", personality: "단단한 쇠와 바위처럼 의지가 강하고 결단력이 뛰어납니다. 한번 칼을 뽑으면 끝을 보는 성격으로, 의리를 중시하고 불의를 참지 못해요. 행동력이 뛰어나고 승부욕이 강해 목표한 것은 반드시 이루어냅니다. 냉정하고 이성적인 판단력이 장점이지만, 지나치게 직설적이거나 독선적으로 보일 수 있어 부드러운 소통 방식을 익히면 좋습니다." },
  { hangul: "신", hanja: "辛", element: "금", yinYang: "음", description: "보석·가위", personality: "정교하게 세공된 보석처럼 섬세하고 날카로운 감각을 지녔습니다. 완벽을 추구하는 성향으로 높은 기준을 세우며, 미적 안목과 분석력이 탁월해요. 자존심이 높고 자기만의 세계가 뚜렷해서 독창적인 성과를 만들어냅니다. 예민하고 까다로운 면이 있지만, 그 섬세함이 곧 남다른 전문성과 품격으로 이어집니다." },
  { hangul: "임", hanja: "壬", element: "수", yinYang: "양", description: "큰 바다·강", personality: "넓은 바다처럼 포용력이 크고 자유로운 영혼의 소유자입니다. 지혜롭고 생각이 깊으며, 어떤 상황에서든 물 흐르듯 유연하게 대처해요. 호기심이 많아 다양한 분야에 관심을 가지며, 사람을 가리지 않는 넓은 인맥을 형성합니다. 자유를 사랑하는 만큼 구속을 싫어해서, 틀에 박힌 환경보다는 자율적인 환경에서 최고의 능력을 발휘합니다." },
  { hangul: "계", hanja: "癸", element: "수", yinYang: "음", description: "이슬·빗물", personality: "아침 이슬처럼 맑고 순수한 감수성을 지닌 사람입니다. 직관력과 영감이 뛰어나며, 조용히 스며드는 힘으로 주변에 변화를 만들어냅니다. 관찰력이 날카롭고 상상력이 풍부해 창의적인 분야에서 빛을 발해요. 내성적이고 감정이 깊어 혼자만의 시간이 필요하지만, 마음을 열면 누구보다 깊고 진실한 관계를 맺을 수 있습니다." },
]

export const STEM_MAP = Object.fromEntries(STEMS.map(s => [s.hangul, s])) as Record<string, StemInfo>

// ─── 지지 (Earthly Branches) ───

export interface BranchInfo {
  hangul: string
  hanja: string
  element: Element
  yinYang: YinYang
  animal: string
  hiddenStems: string[]   // 지장간 (藏干)
  month: number | null     // 해당 월 (1-12)
  hour: string             // 해당 시간대
}

export const BRANCHES: BranchInfo[] = [
  { hangul: "자", hanja: "子", element: "수", yinYang: "양", animal: "쥐", hiddenStems: ["계"], month: 11, hour: "23:00-01:00" },
  { hangul: "축", hanja: "丑", element: "토", yinYang: "음", animal: "소", hiddenStems: ["기", "계", "신"], month: 12, hour: "01:00-03:00" },
  { hangul: "인", hanja: "寅", element: "목", yinYang: "양", animal: "호랑이", hiddenStems: ["갑", "병", "무"], month: 1, hour: "03:00-05:00" },
  { hangul: "묘", hanja: "卯", element: "목", yinYang: "음", animal: "토끼", hiddenStems: ["을"], month: 2, hour: "05:00-07:00" },
  { hangul: "진", hanja: "辰", element: "토", yinYang: "양", animal: "용", hiddenStems: ["무", "을", "계"], month: 3, hour: "07:00-09:00" },
  { hangul: "사", hanja: "巳", element: "화", yinYang: "음", animal: "뱀", hiddenStems: ["병", "무", "경"], month: 4, hour: "09:00-11:00" },
  { hangul: "오", hanja: "午", element: "화", yinYang: "양", animal: "말", hiddenStems: ["정", "기"], month: 5, hour: "11:00-13:00" },
  { hangul: "미", hanja: "未", element: "토", yinYang: "음", animal: "양", hiddenStems: ["기", "정", "을"], month: 6, hour: "13:00-15:00" },
  { hangul: "신", hanja: "申", element: "금", yinYang: "양", animal: "원숭이", hiddenStems: ["경", "임", "무"], month: 7, hour: "15:00-17:00" },
  { hangul: "유", hanja: "酉", element: "금", yinYang: "음", animal: "닭", hiddenStems: ["신"], month: 8, hour: "17:00-19:00" },
  { hangul: "술", hanja: "戌", element: "토", yinYang: "양", animal: "개", hiddenStems: ["무", "신", "정"], month: 9, hour: "19:00-21:00" },
  { hangul: "해", hanja: "亥", element: "수", yinYang: "음", animal: "돼지", hiddenStems: ["임", "갑"], month: 10, hour: "21:00-23:00" },
]

export const BRANCH_MAP = Object.fromEntries(BRANCHES.map(b => [b.hangul, b])) as Record<string, BranchInfo>

/**
 * 한글 기둥(예: "갑자")을 한자 포함 형태(예: "甲子")로 변환
 */
export function pillarToHanja(hangul: string): string {
  if (!hangul || hangul.length < 2) return ""
  const stem = STEM_MAP[hangul[0]]
  const branch = BRANCH_MAP[hangul[1]]
  if (!stem || !branch) return ""
  return `${stem.hanja}${branch.hanja}`
}

/**
 * 시주(예: "정사")에서 시간대 정보(예: "사시(巳時) 09:00-11:00")를 반환
 */
export function getSiLabel(siPillar: string): string {
  if (!siPillar || siPillar.length < 2) return ""
  const branch = BRANCH_MAP[siPillar[1]]
  if (!branch) return ""
  return `${branch.hangul}시(${branch.hanja}時) ${branch.hour}`
}

// ─── 십신 (Ten Gods) ───

export type TenGodKey =
  | "비견" | "겁재"
  | "식신" | "상관"
  | "편재" | "정재"
  | "편관" | "정관"
  | "편인" | "정인"

export interface TenGodInfo {
  name: TenGodKey
  hanja: string
  relation: string          // 오행 관계 설명
  keywords: string[]        // 핵심 키워드
  positive: string          // 긍정적 측면
  negative: string          // 부정적 측면
  lifeArea: string          // 영향 분야
}

export const TEN_GODS: TenGodInfo[] = [
  {
    name: "비견", hanja: "比肩",
    relation: "같은 오행·같은 음양",
    keywords: ["경쟁", "자존심", "독립", "동료"],
    positive: "자립심이 강하고 동료와 협력하는 힘",
    negative: "고집이 세고 양보를 어려워함",
    lifeArea: "형제, 동료, 경쟁 관계",
  },
  {
    name: "겁재", hanja: "劫財",
    relation: "같은 오행·다른 음양",
    keywords: ["승부욕", "도전", "과감함", "변동"],
    positive: "강한 추진력과 도전정신",
    negative: "충동적 결정, 재물 변동",
    lifeArea: "재물 경쟁, 사업 파트너",
  },
  {
    name: "식신", hanja: "食神",
    relation: "내가 생하는·같은 음양",
    keywords: ["표현력", "창의", "여유", "재능"],
    positive: "풍부한 표현력과 창의적 사고",
    negative: "게으름, 현실감 부족",
    lifeArea: "재능 발휘, 먹거리, 건강",
  },
  {
    name: "상관", hanja: "傷官",
    relation: "내가 생하는·다른 음양",
    keywords: ["비판", "재능", "반항", "자유"],
    positive: "뛰어난 재능과 혁신적 사고",
    negative: "권위에 대한 반발, 대인관계 마찰",
    lifeArea: "자기표현, 기술, 예술",
  },
  {
    name: "편재", hanja: "偏財",
    relation: "내가 극하는·같은 음양",
    keywords: ["투자", "모험", "유동자산", "사업"],
    positive: "사업 감각과 활발한 사교성",
    negative: "투기적 성향, 불안정한 재물",
    lifeArea: "유동 재산, 투자, 아버지",
  },
  {
    name: "정재", hanja: "正財",
    relation: "내가 극하는·다른 음양",
    keywords: ["저축", "안정", "고정수입", "성실"],
    positive: "꾸준한 재물 축적과 성실함",
    negative: "보수적, 변화 두려움",
    lifeArea: "고정 수입, 저축, 배우자(남)",
  },
  {
    name: "편관", hanja: "偏官",
    relation: "나를 극하는·같은 음양",
    keywords: ["압박", "도전", "변화", "권위"],
    positive: "강한 추진력과 리더십",
    negative: "스트레스, 갈등, 예상치 못한 변화",
    lifeArea: "직장 상사, 압박, 시험",
  },
  {
    name: "정관", hanja: "正官",
    relation: "나를 극하는·다른 음양",
    keywords: ["직장", "질서", "명예", "책임"],
    positive: "안정적 직장과 사회적 인정",
    negative: "과도한 규율, 자유 제한",
    lifeArea: "직장, 명예, 배우자(여)",
  },
  {
    name: "편인", hanja: "偏印",
    relation: "나를 생하는·같은 음양",
    keywords: ["독학", "영감", "비정통", "고독"],
    positive: "독창적 사고와 영적 감수성",
    negative: "불안정, 시작만 하고 마무리 부족",
    lifeArea: "비정통 학문, 종교, 예술",
  },
  {
    name: "정인", hanja: "正印",
    relation: "나를 생하는·다른 음양",
    keywords: ["학업", "자격증", "어머니", "배움"],
    positive: "학습능력과 안정적 지원",
    negative: "의존성, 수동적 태도",
    lifeArea: "학업, 자격증, 어머니",
  },
]

export const TEN_GOD_MAP = Object.fromEntries(TEN_GODS.map(g => [g.name, g])) as Record<TenGodKey, TenGodInfo>

// ─── 십신 계산 함수 ───

/**
 * 일간(day stem)과 대상 천간의 관계로 십신을 계산
 * @param dayStem 일간 (예: "갑")
 * @param targetStem 대상 천간 (예: "병")
 * @returns 십신 이름 (예: "식신")
 */
export function calculateTenGod(dayStem: string, targetStem: string): TenGodKey {
  const day = STEM_MAP[dayStem]
  const target = STEM_MAP[targetStem]
  if (!day || !target) throw new Error(`Invalid stem: ${dayStem} or ${targetStem}`)

  const dayEl = day.element
  const targetEl = target.element
  const sameYinYang = day.yinYang === target.yinYang

  // 같은 오행
  if (dayEl === targetEl) {
    return sameYinYang ? "비견" : "겁재"
  }
  // 내가 생하는 오행 (설기)
  if (GENERATING[dayEl] === targetEl) {
    return sameYinYang ? "식신" : "상관"
  }
  // 내가 극하는 오행 (극출)
  if (OVERCOMING[dayEl] === targetEl) {
    return sameYinYang ? "편재" : "정재"
  }
  // 나를 극하는 오행 (극입)
  if (OVERCOME_BY[dayEl] === targetEl) {
    return sameYinYang ? "편관" : "정관"
  }
  // 나를 생하는 오행 (생입)
  if (GENERATED_BY[dayEl] === targetEl) {
    return sameYinYang ? "편인" : "정인"
  }

  throw new Error(`Cannot determine ten god for ${dayStem} → ${targetStem}`)
}

/**
 * 일간과 대상 지지의 관계로 십신을 계산 (지장간의 본기 사용)
 * @param dayStem 일간 (예: "갑")
 * @param targetBranch 대상 지지 (예: "오")
 * @returns 십신 이름
 */
export function calculateTenGodFromBranch(dayStem: string, targetBranch: string): TenGodKey {
  const branch = BRANCH_MAP[targetBranch]
  if (!branch) throw new Error(`Invalid branch: ${targetBranch}`)
  // 본기 (첫 번째 지장간)를 기준으로 계산
  const mainHiddenStem = branch.hiddenStems[0]
  return calculateTenGod(dayStem, mainHiddenStem)
}

// ─── 용신 추론 (간이) ───

/**
 * 오행 분포에서 가장 부족한 오행을 보충하는 용신 추론 (간이 버전)
 * 실제 명리학에서는 훨씬 복잡하지만, MVP 수준의 근사치
 */
// ─── 오행 색상 유틸 ───

export const ELEMENT_COLORS: Record<Element, string> = {
  목: "text-green-600 dark:text-green-400",
  화: "text-red-500 dark:text-red-400",
  토: "text-amber-600 dark:text-amber-400",
  금: "text-slate-500 dark:text-slate-300",
  수: "text-blue-500 dark:text-blue-400",
}

export const ELEMENT_BG: Record<Element, string> = {
  목: "bg-green-500/10",
  화: "bg-red-500/10",
  토: "bg-amber-500/10",
  금: "bg-slate-500/10",
  수: "bg-blue-500/10",
}

export const ELEMENT_EMOJI: Record<Element, string> = {
  목: "🌳",
  화: "🔥",
  토: "⛰️",
  금: "💎",
  수: "💧",
}

export const PILLAR_EMOJI: Record<string, string> = {
  년주: "⛰️",
  월주: "🌙",
  일주: "☀️",
  시주: "⏰",
  대운: "🌊",
}

/**
 * 일간 한글(예: "갑") → 오행 Element 반환
 */
export function getIlganElement(ilgan: string): Element | null {
  const char = ilgan?.[0]
  if (!char) return null
  const stem = STEM_MAP[char]
  return stem?.element ?? null
}

export function inferUsefulGod(
  elementCounts: Record<Element, number>,
  dayStemElement: Element
): { usefulGod: Element; reason: string } {
  const total = Object.values(elementCounts).reduce((a, b) => a + b, 0)

  // 일간의 강약 판단 (간이)
  const selfCount = elementCounts[dayStemElement] + elementCounts[GENERATED_BY[dayStemElement]]
  const otherCount = total - selfCount
  const isStrong = selfCount > otherCount

  if (isStrong) {
    // 신강: 설기(식상)·재성·관성이 용신
    // 내가 생하는 오행 또는 내가 극하는 오행 중 부족한 것
    const candidates: Element[] = [GENERATING[dayStemElement], OVERCOMING[dayStemElement]]
    const weakest = candidates.reduce((a, b) =>
      elementCounts[a] <= elementCounts[b] ? a : b
    )
    return {
      usefulGod: weakest,
      reason: `일간이 강하므로(신강) 기운을 빼주는 ${ELEMENTS[weakest].name} 오행이 필요합니다`,
    }
  } else {
    // 신약: 인성·비겁이 용신
    // 나를 생하는 오행 또는 같은 오행 중 부족한 것
    const candidates: Element[] = [GENERATED_BY[dayStemElement], dayStemElement]
    const weakest = candidates.reduce((a, b) =>
      elementCounts[a] <= elementCounts[b] ? a : b
    )
    return {
      usefulGod: weakest,
      reason: `일간이 약하므로(신약) 힘을 보태주는 ${ELEMENTS[weakest].name} 오행이 필요합니다`,
    }
  }
}
