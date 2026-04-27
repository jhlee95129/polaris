/**
 * 만세력 래퍼 — 사주팔자/오행/십신/용신 계산
 * @fullstackfamily/manseryeok 라이브러리를 감싸서 명리학 분석 데이터를 제공
 */

import {
  calculateSaju as calcSaju,
  lunarToSolar,
  solarToLunar,
  getPillarByHangul,
  type SajuResult as ManseryeokResult,
} from "@fullstackfamily/manseryeok"

import {
  type Element,
  type TenGodKey,
  STEM_MAP,
  BRANCH_MAP,
  ELEMENTS,
  calculateTenGod,
  calculateTenGodFromBranch,
  inferUsefulGod,
} from "./saju-data"

// ─── 타입 정의 ───

export interface PillarDetail {
  pillar: string          // 간지 한글 (예: "갑자")
  pillarHanja: string     // 간지 한자 (예: "甲子")
  stem: string            // 천간 (예: "갑")
  branch: string          // 지지 (예: "자")
  stemElement: Element    // 천간 오행
  branchElement: Element  // 지지 오행
  yinYang: "양" | "음"
  animal?: string         // 띠 (년주에만)
  tenGod?: TenGodKey      // 십신 (일주 제외)
}

export interface ElementCount {
  목: number
  화: number
  토: number
  금: number
  수: number
}

export interface SajuProfile {
  // 사주팔자 4주
  yearPillar: PillarDetail
  monthPillar: PillarDetail
  dayPillar: PillarDetail       // 일간 = 나 자신
  hourPillar: PillarDetail | null

  // 분석 데이터
  dayStem: string               // 일간 (예: "갑")
  dayStemDescription: string    // 일간 설명
  dayStemPersonality: string    // 일간 성격
  elementCounts: ElementCount   // 오행 분포
  dominantElement: Element      // 가장 강한 오행
  weakestElement: Element       // 가장 약한 오행
  usefulGod: Element            // 용신
  usefulGodReason: string       // 용신 이유
  dominantTenGods: TenGodKey[]  // 주요 십신 (빈도 높은 순 3개)

  // 오늘의 일진
  todayPillar?: PillarDetail
  todayInteraction?: string     // 오늘 일진과 일간의 관계

  // 원본 데이터
  rawResult: ManseryeokResult
}

export interface BirthInfo {
  year: number
  month: number
  day: number
  hour?: number          // 0-23, undefined = 모름
  isLunar?: boolean      // true면 음력
  isLeapMonth?: boolean  // 음력 윤달
  gender?: "M" | "F"
}

// ─── 핵심 계산 함수 ───

/**
 * 생년월일시로 사주 프로필 계산
 */
export function calculateSajuProfile(birth: BirthInfo): SajuProfile {
  // 음력이면 양력으로 변환
  let solarYear = birth.year
  let solarMonth = birth.month
  let solarDay = birth.day

  if (birth.isLunar) {
    const converted = lunarToSolar(birth.year, birth.month, birth.day, birth.isLeapMonth)
    solarYear = converted.solar.year
    solarMonth = converted.solar.month
    solarDay = converted.solar.day
  }

  // 만세력 계산
  const raw = calcSaju(solarYear, solarMonth, solarDay, birth.hour)

  // 4주 상세 파싱
  const yearPillar = parsePillar(raw.yearPillar, raw.yearPillarHanja)
  const monthPillar = parsePillar(raw.monthPillar, raw.monthPillarHanja)
  const dayPillar = parsePillar(raw.dayPillar, raw.dayPillarHanja)
  const hourPillar = raw.hourPillar
    ? parsePillar(raw.hourPillar, raw.hourPillarHanja!)
    : null

  // 일간 정보
  const dayStem = dayPillar.stem
  const dayStemInfo = STEM_MAP[dayStem]

  // 십신 계산 (일간 기준)
  yearPillar.tenGod = calculateTenGod(dayStem, yearPillar.stem)
  monthPillar.tenGod = calculateTenGod(dayStem, monthPillar.stem)
  if (hourPillar) {
    hourPillar.tenGod = calculateTenGod(dayStem, hourPillar.stem)
  }

  // 오행 분포 계산 (천간 + 지지 모두 포함)
  const elementCounts = countElements(yearPillar, monthPillar, dayPillar, hourPillar)

  // 가장 강한/약한 오행
  const elements = Object.entries(elementCounts) as [Element, number][]
  elements.sort((a, b) => b[1] - a[1])
  const dominantElement = elements[0][0]
  const weakestElement = elements[elements.length - 1][0]

  // 용신 추론
  const { usefulGod, reason: usefulGodReason } = inferUsefulGod(elementCounts, dayStemInfo.element)

  // 주요 십신 (빈도 높은 순)
  const tenGodCounts: Record<string, number> = {}
  const allTenGods = [yearPillar.tenGod, monthPillar.tenGod, hourPillar?.tenGod].filter(Boolean) as TenGodKey[]

  // 지지의 십신도 추가
  for (const branch of [yearPillar.branch, monthPillar.branch, dayPillar.branch, hourPillar?.branch].filter(Boolean) as string[]) {
    try {
      const branchTenGod = calculateTenGodFromBranch(dayStem, branch)
      allTenGods.push(branchTenGod)
    } catch {
      // 계산 불가 시 건너뜀
    }
  }

  for (const tg of allTenGods) {
    tenGodCounts[tg] = (tenGodCounts[tg] || 0) + 1
  }
  const dominantTenGods = Object.entries(tenGodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name as TenGodKey)

  // 오늘의 일진
  const today = new Date()
  const todayResult = calcSaju(today.getFullYear(), today.getMonth() + 1, today.getDate(), today.getHours())
  const todayPillar = parsePillar(todayResult.dayPillar, todayResult.dayPillarHanja)
  const todayTenGod = calculateTenGod(dayStem, todayPillar.stem)
  const todayInteraction = describeTodayInteraction(todayTenGod, todayPillar.stemElement, dayStemInfo.element)

  // 띠 설정
  const branchInfo = BRANCH_MAP[yearPillar.branch]
  if (branchInfo) {
    yearPillar.animal = branchInfo.animal
  }

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayStem,
    dayStemDescription: dayStemInfo.description,
    dayStemPersonality: dayStemInfo.personality,
    elementCounts,
    dominantElement,
    weakestElement,
    usefulGod,
    usefulGodReason,
    dominantTenGods,
    todayPillar,
    todayInteraction,
    rawResult: raw,
  }
}

/**
 * 오늘의 일진(간지) 계산
 */
export function getTodayPillar(): PillarDetail {
  const today = new Date()
  const result = calcSaju(today.getFullYear(), today.getMonth() + 1, today.getDate(), today.getHours())
  return parsePillar(result.dayPillar, result.dayPillarHanja)
}

/**
 * 양력 → 음력 변환
 */
export function solarToLunarDate(year: number, month: number, day: number) {
  return solarToLunar(year, month, day)
}

/**
 * 음력 → 양력 변환
 */
export function lunarToSolarDate(year: number, month: number, day: number, isLeapMonth?: boolean) {
  return lunarToSolar(year, month, day, isLeapMonth)
}

// ─── 내부 유틸리티 ───

function parsePillar(hangul: string, hanja: string): PillarDetail {
  // 간지는 2글자: 천간(1글자) + 지지(1글자)
  const stem = hangul[0]
  const branch = hangul[1]

  const stemInfo = STEM_MAP[stem]
  const branchInfo = BRANCH_MAP[branch]

  // getPillarByHangul로 추가 정보 획득
  const pillarData = getPillarByHangul(hangul)

  return {
    pillar: hangul,
    pillarHanja: hanja,
    stem,
    branch,
    stemElement: stemInfo?.element ?? "토",
    branchElement: branchInfo?.element ?? "토",
    yinYang: stemInfo?.yinYang ?? "양",
  }
}

function countElements(
  year: PillarDetail,
  month: PillarDetail,
  day: PillarDetail,
  hour: PillarDetail | null
): ElementCount {
  const counts: ElementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }

  const pillars = [year, month, day, hour].filter(Boolean) as PillarDetail[]
  for (const p of pillars) {
    counts[p.stemElement]++
    counts[p.branchElement]++
  }

  return counts
}

function describeTodayInteraction(
  todayTenGod: TenGodKey,
  todayElement: Element,
  dayElement: Element
): string {
  const descriptions: Record<TenGodKey, string> = {
    비견: "오늘은 나와 같은 기운이 흐르는 날이에요. 자신감과 독립심이 높아지면서 '나답게 해보자'는 마음이 강해집니다. 주체적으로 결정하고 행동하기 좋은 시기지만, 고집이 세지거나 남의 말이 잘 안 들릴 수 있으니 협업이 필요한 일에서는 한 발 물러나 상대의 의견도 들어보세요. 혼자 집중해서 하는 작업이나 운동에 특히 좋은 하루입니다.",
    겁재: "오늘은 경쟁과 도전의 기운이 강하게 흐르는 날입니다. 승부욕이 올라오고 적극적으로 움직이고 싶은 충동이 생겨요. 새로운 도전이나 경쟁 상황에서 좋은 결과를 낼 수 있지만, 무리한 투자나 충동적인 지출은 삼가는 게 좋습니다. 에너지를 운동이나 생산적인 활동에 집중시키면 오늘 하루가 알차게 마무리될 거예요.",
    식신: "오늘은 창의력과 표현력이 빛나는 날이에요. 머릿속에 떠오르는 아이디어들이 평소보다 풍성하고, 그것을 말이나 글로 풀어내는 능력도 좋아집니다. 맛있는 음식을 즐기거나 취미 활동을 하면 기분 전환이 잘 되는 날이기도 해요. 회의나 브레인스토밍, 콘텐츠 작업 같은 창작 활동에 특히 좋으니 미뤄둔 기획이 있다면 오늘 꺼내보세요.",
    상관: "오늘은 자유롭고 파격적인 에너지가 강한 날입니다. 기존의 틀이나 관습에서 벗어나 새로운 방식을 시도해보고 싶은 마음이 커져요. 독창적인 아이디어가 통하기 좋은 시기이지만, 윗사람이나 규칙과 충돌할 수 있으니 표현 방식에는 신경 쓰세요. 창의적인 프로젝트나 예술 활동에 몰두하면 놀라운 결과를 만들어낼 수 있는 하루입니다.",
    편재: "오늘은 재물 운이 움직이는 날이에요. 새로운 사업 기회나 수익 창출의 아이디어가 떠오를 수 있고, 사교 활동에서 뜻밖의 인연을 만날 수도 있습니다. 활동적으로 움직이며 사람을 만나는 것이 유리한 날이지만, 큰 금액의 투자나 도박성 결정은 피하는 게 좋아요. 적극적으로 네트워킹하되, 지갑은 신중하게 관리하세요.",
    정재: "오늘은 꾸준함과 성실함이 빛을 발하는 날입니다. 화려한 한 방보다 착실하게 쌓아온 것들이 결실을 맺기 좋은 시기예요. 계획표대로 차근차근 일을 처리하면 기대 이상의 성과를 얻을 수 있습니다. 재정 관리, 저축 계획 세우기, 서류 정리 같은 실무적인 일에 특히 좋으니 미뤄둔 정리 작업이 있다면 오늘 해보세요.",
    편관: "오늘은 외부에서 압박이나 긴장감이 찾아올 수 있는 날이에요. 예상치 못한 일이 생기거나 책임감이 무겁게 느껴질 수 있지만, 이런 상황을 유연하게 받아들이면 오히려 크게 성장하는 계기가 됩니다. 도전적인 과제에 정면으로 맞서보세요. 위기를 기회로 바꾸는 힘이 오늘의 기운 속에 있으니, 피하지 말고 부딪혀보는 것을 추천합니다.",
    정관: "오늘은 질서와 책임의 기운이 흐르는 날입니다. 맡은 역할에 충실하고 규칙을 지키면 주변의 인정과 신뢰를 얻을 수 있어요. 상사나 어른과의 관계에서 좋은 인상을 남기기 좋은 날이기도 합니다. 승진, 계약, 공식적인 자리에서 유리한 기운이니, 중요한 미팅이나 발표가 있다면 자신 있게 임해보세요.",
    편인: "오늘은 직관과 영감이 평소보다 살아나는 날이에요. 갑자기 번뜩이는 생각이 떠오르거나, 평소 관심 없던 분야에 호기심이 생길 수 있습니다. 새로운 책이나 강의를 접하면 의미 있는 깨달음을 얻기 좋은 시기예요. 다만 생각이 많아져 결정을 미루거나 현실과 동떨어진 공상에 빠질 수 있으니, 영감을 메모해두고 실행은 차분히 계획하세요.",
    정인: "오늘은 배움과 안정의 기운이 감싸는 따뜻한 날입니다. 누군가의 도움이나 진심 어린 조언이 큰 힘이 되고, 학습이나 자기계발에 집중하면 흡수력이 좋아요. 어머니나 스승 같은 존재와의 인연이 강한 날이기도 합니다. 마음이 편안해지는 활동 — 독서, 명상, 따뜻한 차 한 잔 — 으로 내면의 에너지를 충전하기 좋은 하루예요.",
  }

  return descriptions[todayTenGod] || "오늘의 기운을 살펴보고 있어요"
}

// ─── 프롬프트용 요약 생성 ───

/**
 * Claude 시스템 프롬프트에 주입할 사주 원국 요약 문자열 생성
 */
export function generateSajuContext(profile: SajuProfile): string {
  const lines: string[] = []

  lines.push("=== 사용자 사주 원국 ===")
  lines.push(`사주팔자: 년주(${profile.yearPillar.pillar}/${profile.yearPillar.pillarHanja}) 월주(${profile.monthPillar.pillar}/${profile.monthPillar.pillarHanja}) 일주(${profile.dayPillar.pillar}/${profile.dayPillar.pillarHanja})${profile.hourPillar ? ` 시주(${profile.hourPillar.pillar}/${profile.hourPillar.pillarHanja})` : " 시주(미상)"}`)

  const stemInfo = STEM_MAP[profile.dayStem]
  lines.push(`일간: ${profile.dayStem}(${stemInfo.hanja}) — ${stemInfo.description}. ${stemInfo.personality}`)

  lines.push(`오행 분포: 목(${profile.elementCounts.목}) 화(${profile.elementCounts.화}) 토(${profile.elementCounts.토}) 금(${profile.elementCounts.금}) 수(${profile.elementCounts.수})`)
  lines.push(`가장 강한 오행: ${ELEMENTS[profile.dominantElement].name} / 가장 약한 오행: ${ELEMENTS[profile.weakestElement].name}`)
  lines.push(`용신: ${ELEMENTS[profile.usefulGod].name} — ${profile.usefulGodReason}`)
  lines.push(`주요 십신: ${profile.dominantTenGods.join(", ")}`)

  if (profile.yearPillar.animal) {
    lines.push(`띠: ${profile.yearPillar.animal}띠`)
  }

  if (profile.todayPillar && profile.todayInteraction) {
    lines.push("")
    lines.push("=== 오늘의 일진 ===")
    lines.push(`오늘 간지: ${profile.todayPillar.pillar}(${profile.todayPillar.pillarHanja})`)
    lines.push(`오늘 일진과의 관계: ${profile.todayInteraction}`)
  }

  // 십신 상세
  lines.push("")
  lines.push("=== 각 주의 십신 ===")
  lines.push(`년주 ${profile.yearPillar.pillar}: ${profile.yearPillar.tenGod || "-"} (사회적 환경)`)
  lines.push(`월주 ${profile.monthPillar.pillar}: ${profile.monthPillar.tenGod || "-"} (직업·사회생활)`)
  lines.push(`일주 ${profile.dayPillar.pillar}: 본인 (일간 ${profile.dayStem})`)
  if (profile.hourPillar) {
    lines.push(`시주 ${profile.hourPillar.pillar}: ${profile.hourPillar.tenGod || "-"} (말년·자녀)`)
  }

  return lines.join("\n")
}
