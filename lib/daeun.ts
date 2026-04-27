/**
 * 대운(大運) 계산 모듈
 * 정통 절기 기반 — 월주에서 순행/역행으로 10년 단위 대운 시퀀스 생성
 */

import {
  getSolarTermsByYear,
  SIXTY_PILLARS,
  getPillarByHangul,
  type SolarTermWithDate,
} from "@fullstackfamily/manseryeok"

import { STEM_MAP } from "./saju-data"

// ─── 타입 ───

export interface DaeunInfo {
  index: number       // 0-based
  pillar: string      // 간지 한글 (예: "병오")
  pillarHanja: string // 간지 한자 (예: "丙午")
  startAge: number    // 대운 시작 나이 (만 나이)
  endAge: number      // 대운 끝 나이
}

export interface DaeunResult {
  sequence: DaeunInfo[]    // 8개 대운
  startAge: number         // 첫 대운 시작 나이
  isForward: boolean       // 순행 여부
  current: DaeunInfo | null // 현재 대운
}

// ─── 순행/역행 결정 ───

/**
 * 연주 천간의 음양과 성별로 순행/역행 결정
 * - 양남음녀 → 순행 (다음 절기 방향)
 * - 음남양녀 → 역행 (이전 절기 방향)
 */
function isForward(yearStem: string, gender: "M" | "F"): boolean {
  const stemInfo = STEM_MAP[yearStem]
  if (!stemInfo) return true
  const isYang = stemInfo.yinYang === "양"
  const isMale = gender === "M"
  return (isYang && isMale) || (!isYang && !isMale)
}

// ─── 절기 기반 대운 시작 나이 계산 ───

/**
 * 생일에서 가장 가까운 절입일(節入日)까지 일수로 대운 시작 나이 계산
 * 일수 ÷ 3 = 대운 시작 나이 (반올림)
 */
function calculateStartAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  forward: boolean
): number {
  // 절기(節)만 사용 — 절입일 기준
  const jeolgiTerms = getJeolgiTerms(birthYear)

  const birthDate = new Date(birthYear, birthMonth - 1, birthDay)

  if (forward) {
    // 순행: 생일 이후 가장 가까운 절입일
    const nextTerm = findNextJeolgi(jeolgiTerms, birthDate, birthYear)
    if (!nextTerm) return 3 // fallback
    const days = daysBetween(birthDate, termToDate(nextTerm))
    return Math.max(1, Math.round(days / 3))
  } else {
    // 역행: 생일 이전 가장 가까운 절입일
    const prevTerm = findPrevJeolgi(jeolgiTerms, birthDate, birthYear)
    if (!prevTerm) return 3 // fallback
    const days = daysBetween(termToDate(prevTerm), birthDate)
    return Math.max(1, Math.round(days / 3))
  }
}

// ─── 대운 기둥 시퀀스 생성 ───

/**
 * 월주에서 순행/역행으로 60갑자를 따라 대운 기둥 8개 생성
 */
function buildDaeunSequence(
  monthPillar: string,
  forward: boolean,
  startAge: number
): DaeunInfo[] {
  const pillarData = getPillarByHangul(monthPillar)
  if (!pillarData) return []

  const baseIndex = pillarData.id
  const sequence: DaeunInfo[] = []

  for (let i = 1; i <= 8; i++) {
    const offset = forward ? i : -i
    // 60갑자 순환 (0~59)
    const idx = ((baseIndex + offset) % 60 + 60) % 60
    const pillar = SIXTY_PILLARS[idx]

    sequence.push({
      index: i - 1,
      pillar: pillar.combined.hangul,
      pillarHanja: pillar.combined.hanja,
      startAge: startAge + (i - 1) * 10,
      endAge: startAge + i * 10 - 1,
    })
  }

  return sequence
}

// ─── 공개 API ───

/**
 * 대운 전체 계산
 * @param monthPillar 월주 한글 (예: "병인")
 * @param yearStem 연주 천간 (예: "갑")
 * @param gender 성별
 * @param birthYear 출생 양력 연도
 * @param birthMonth 출생 양력 월
 * @param birthDay 출생 양력 일
 */
export function calculateDaeun(
  monthPillar: string,
  yearStem: string,
  gender: "M" | "F",
  birthYear: number,
  birthMonth: number,
  birthDay: number
): DaeunResult {
  const forward = isForward(yearStem, gender)
  const startAge = calculateStartAge(birthYear, birthMonth, birthDay, forward)
  const sequence = buildDaeunSequence(monthPillar, forward, startAge)

  // 현재 만 나이 기준으로 현재 대운 찾기
  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear
  const current = sequence.find(d => age >= d.startAge && age <= d.endAge) ?? null

  return { sequence, startAge, isForward: forward, current }
}

/**
 * 현재 대운의 간지 문자열 반환 (DB 저장용)
 * 예: "병오" — 없으면 null
 */
export function getCurrentDaeunPillar(
  monthPillar: string,
  yearStem: string,
  gender: "M" | "F",
  birthYear: number,
  birthMonth: number,
  birthDay: number
): string | null {
  const result = calculateDaeun(monthPillar, yearStem, gender, birthYear, birthMonth, birthDay)
  return result.current?.pillar ?? null
}

// ─── 내부 유틸리티 ───

function getJeolgiTerms(birthYear: number): SolarTermWithDate[] {
  const allTerms: SolarTermWithDate[] = []

  // 출생 연도 ± 1년 범위의 절기 수집 (경계 처리)
  for (const year of [birthYear - 1, birthYear, birthYear + 1]) {
    try {
      const terms = getSolarTermsByYear(year)
      allTerms.push(...terms.filter(t => t.type === "jeolgi"))
    } catch {
      // 지원 범위 밖의 연도는 무시
    }
  }

  return allTerms.sort((a, b) => termToDate(a).getTime() - termToDate(b).getTime())
}

function findNextJeolgi(terms: SolarTermWithDate[], birthDate: Date, _birthYear: number): SolarTermWithDate | null {
  for (const term of terms) {
    const termDate = termToDate(term)
    if (termDate > birthDate) return term
  }
  return null
}

function findPrevJeolgi(terms: SolarTermWithDate[], birthDate: Date, _birthYear: number): SolarTermWithDate | null {
  let prev: SolarTermWithDate | null = null
  for (const term of terms) {
    const termDate = termToDate(term)
    if (termDate >= birthDate) break
    prev = term
  }
  return prev
}

function termToDate(term: SolarTermWithDate): Date {
  return new Date(term.year, term.month - 1, term.day)
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)))
}
