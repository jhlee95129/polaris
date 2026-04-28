/**
 * 클라이언트 스토리지 래퍼
 *
 * localStorage  — 영속 (user_id)
 * sessionStorage — 1회성 페이지 간 전달 (pending topic, pending session)
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
}

// ─── 페이지 간 1회성 전달 (sessionStorage) ───

const PENDING_TOPIC_KEY = "polaris_pending_topic"
const PENDING_SESSION_KEY = "polaris_pending_session"

/** 대시보드 카드 → 채팅: 주제 전달 */
export function setPendingTopic(message: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(PENDING_TOPIC_KEY, message)
}

/** 1회 소비 — 읽으면 삭제 */
export function getPendingTopic(): string | null {
  if (typeof window === "undefined") return null
  const topic = sessionStorage.getItem(PENDING_TOPIC_KEY)
  if (topic) sessionStorage.removeItem(PENDING_TOPIC_KEY)
  return topic
}

/** 대시보드 최근 대화 → 채팅: 세션 ID 전달 */
export function setPendingSession(sessionId: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(PENDING_SESSION_KEY, sessionId)
}

/** 1회 소비 — 읽으면 삭제 */
export function getPendingSession(): string | null {
  if (typeof window === "undefined") return null
  const id = sessionStorage.getItem(PENDING_SESSION_KEY)
  if (id) sessionStorage.removeItem(PENDING_SESSION_KEY)
  return id
}
