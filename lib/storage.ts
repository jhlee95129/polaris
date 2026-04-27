/**
 * localStorage 래퍼 — 폴라리스 사용자 UUID 관리
 */

const POLARIS_USER_KEY = "polaris_user_id"

export function getUserId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(POLARIS_USER_KEY)
}

export function setUserId(id: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(POLARIS_USER_KEY, id)
}

export function clearUser(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(POLARIS_USER_KEY)
  localStorage.removeItem(CURRENT_SESSION_KEY)
}

// ─── 세션 관리 ───

const CURRENT_SESSION_KEY = "polaris_current_session_id"

export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CURRENT_SESSION_KEY)
}

export function setCurrentSessionId(id: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CURRENT_SESSION_KEY, id)
}

export function clearCurrentSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CURRENT_SESSION_KEY)
}

// ─── 주제 카드 → 채팅 연결 ───

const PENDING_TOPIC_KEY = "polaris_pending_topic"

export function setPendingTopic(message: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(PENDING_TOPIC_KEY, message)
}

export function getPendingTopic(): string | null {
  if (typeof window === "undefined") return null
  const topic = sessionStorage.getItem(PENDING_TOPIC_KEY)
  if (topic) sessionStorage.removeItem(PENDING_TOPIC_KEY)
  return topic
}
