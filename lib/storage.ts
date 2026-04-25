/**
 * localStorage 래퍼 — 클라이언트 사이드 상태 관리
 * Supabase 연동 전까지 로컬 스토리지를 사용
 */

import type { BirthInfo, SajuProfile } from "./saju"
import type { CoachingCard, ProfileSummary } from "./claude"
import type { CharacterType } from "./prompts"

// ─── 타입 정의 ───

export interface StoredProfile {
  birthInfo: BirthInfo
  sajuProfile: Omit<SajuProfile, "rawResult">
  summary?: ProfileSummary
  createdAt: string
}

export interface StoredConsultation {
  id: string
  characterType: CharacterType
  question: string
  card: CoachingCard
  feedback?: "helpful" | "not_helpful" | "not_tried"
  createdAt: string
}

// ─── 스토리지 키 ───

const KEYS = {
  PROFILE: "hansu_profile",
  CONSULTATIONS: "hansu_consultations",
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
  characterCounts: Record<CharacterType, number>
  feedbackCounts: { helpful: number; not_helpful: number; not_tried: number; pending: number }
} | null {
  const consultations = loadConsultations()
  if (consultations.length < 3) return null

  const characterCounts: Record<CharacterType, number> = {
    sibling: 0,
    grandma: 0,
    analyst: 0,
  }

  const feedbackCounts = {
    helpful: 0,
    not_helpful: 0,
    not_tried: 0,
    pending: 0,
  }

  for (const c of consultations) {
    characterCounts[c.characterType]++
    if (c.feedback) {
      feedbackCounts[c.feedback]++
    } else {
      feedbackCounts.pending++
    }
  }

  return {
    totalCount: consultations.length,
    characterCounts,
    feedbackCounts,
  }
}
