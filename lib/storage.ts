/**
 * localStorage 래퍼 — 클라이언트 사이드 상태 관리
 * Supabase 연동 전까지 로컬 스토리지를 사용
 */

import type { BirthInfo, SajuProfile } from "./saju"
import type { CoachingCard, ProfileSummary, DailyAction } from "./claude"

// ─── 타입 정의 ───

export interface StoredProfile {
  birthInfo: BirthInfo
  sajuProfile: Omit<SajuProfile, "rawResult">
  summary?: ProfileSummary
  createdAt: string
}

export interface StoredConsultation {
  id: string
  threadId: string
  question: string
  card: CoachingCard
  followUpNote?: string
  feedback?: "helpful" | "not_helpful" | "not_tried"
  characterType?: string  // 하위 호환
  createdAt: string
}

export interface DailyActionCache {
  date: string
  action: DailyAction
}

// ─── 스토리지 키 ───

export interface EnergyState {
  balance: number
  lastRechargeDate: string
}

const DAILY_FREE_ENERGY = 3
const MAX_ENERGY = 99

const KEYS = {
  PROFILE: "hansu_profile",
  CONSULTATIONS: "hansu_consultations",
  DAILY_ACTION: "hansu_daily_action",
  ENERGY: "hansu_energy",
} as const

// ─── 프로필 관리 ───

export function saveProfile(profile: StoredProfile): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile))
}

export function loadProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem(KEYS.PROFILE)
  if (!data) return null
  try {
    return JSON.parse(data) as StoredProfile
  } catch {
    return null
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEYS.PROFILE)
}

// ─── 상담 히스토리 관리 ───

export function saveConsultation(consultation: StoredConsultation): void {
  if (typeof window === "undefined") return
  const consultations = loadConsultations()
  consultations.unshift(consultation) // 최신순
  // 최대 50개까지 보관
  if (consultations.length > 50) {
    consultations.length = 50
  }
  localStorage.setItem(KEYS.CONSULTATIONS, JSON.stringify(consultations))
}

export function loadConsultations(): StoredConsultation[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(KEYS.CONSULTATIONS)
  if (!data) return []
  try {
    return JSON.parse(data) as StoredConsultation[]
  } catch {
    return []
  }
}

export function updateFeedback(
  consultationId: string,
  feedback: "helpful" | "not_helpful" | "not_tried"
): void {
  if (typeof window === "undefined") return
  const consultations = loadConsultations()
  const target = consultations.find(c => c.id === consultationId)
  if (target) {
    target.feedback = feedback
    localStorage.setItem(KEYS.CONSULTATIONS, JSON.stringify(consultations))
  }
}

export function clearConsultations(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEYS.CONSULTATIONS)
}

// ─── 오늘의 한수 캐시 ───

function getTodayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function saveDailyAction(action: DailyAction): void {
  if (typeof window === "undefined") return
  const cache: DailyActionCache = {
    date: getTodayDateString(),
    action,
  }
  localStorage.setItem(KEYS.DAILY_ACTION, JSON.stringify(cache))
}

export function loadDailyAction(): DailyAction | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem(KEYS.DAILY_ACTION)
  if (!data) return null
  try {
    const cache = JSON.parse(data) as DailyActionCache
    // 오늘 날짜가 아니면 캐시 무효
    if (cache.date !== getTodayDateString()) return null
    return cache.action
  } catch {
    return null
  }
}

// ─── 유틸리티 ───

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 피드백이 없는 상담 중 가장 오래된 것 반환 (리마인더용)
 */
export function getPendingFeedback(): StoredConsultation | null {
  const consultations = loadConsultations()
  // 24시간 이상 지난 상담 중 피드백이 없는 것
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  return consultations.find(
    c => !c.feedback && new Date(c.createdAt).getTime() < oneDayAgo
  ) ?? null
}

/**
 * 고민 패턴 분석 (3회 이상 상담 시)
 */
export function getConsultationStats(): {
  totalCount: number
  feedbackCounts: { helpful: number; not_helpful: number; not_tried: number; pending: number }
} | null {
  const consultations = loadConsultations()
  if (consultations.length < 3) return null

  const feedbackCounts = {
    helpful: 0,
    not_helpful: 0,
    not_tried: 0,
    pending: 0,
  }

  for (const c of consultations) {
    if (c.feedback) {
      feedbackCounts[c.feedback]++
    } else {
      feedbackCounts.pending++
    }
  }

  return {
    totalCount: consultations.length,
    feedbackCounts,
  }
}

// ─── Thread 관리 ───

export function generateThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function getThread(threadId: string): StoredConsultation[] {
  const all = loadConsultations()
  return all.filter(c => c.threadId === threadId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

// ─── 기운(에너지) 시스템 ───

export function loadEnergy(): EnergyState {
  if (typeof window === "undefined") return { balance: DAILY_FREE_ENERGY, lastRechargeDate: getTodayDateString() }

  const data = localStorage.getItem(KEYS.ENERGY)
  let state: EnergyState

  if (!data) {
    // 첫 사용: 무료 기운 지급
    state = { balance: DAILY_FREE_ENERGY, lastRechargeDate: getTodayDateString() }
    localStorage.setItem(KEYS.ENERGY, JSON.stringify(state))
    return state
  }

  try {
    state = JSON.parse(data) as EnergyState
  } catch {
    state = { balance: DAILY_FREE_ENERGY, lastRechargeDate: getTodayDateString() }
  }

  // 일일 충전 체크
  const today = getTodayDateString()
  if (state.lastRechargeDate !== today) {
    state.balance = Math.min(state.balance + DAILY_FREE_ENERGY, MAX_ENERGY)
    state.lastRechargeDate = today
    localStorage.setItem(KEYS.ENERGY, JSON.stringify(state))
  }

  return state
}

export function useEnergy(): boolean {
  if (typeof window === "undefined") return false
  const state = loadEnergy()
  if (state.balance <= 0) return false
  state.balance--
  localStorage.setItem(KEYS.ENERGY, JSON.stringify(state))
  return true
}

export function addEnergy(amount: number): void {
  if (typeof window === "undefined") return
  const state = loadEnergy()
  state.balance = Math.min(state.balance + amount, MAX_ENERGY)
  localStorage.setItem(KEYS.ENERGY, JSON.stringify(state))
}

export function getEnergyBalance(): number {
  return loadEnergy().balance
}
