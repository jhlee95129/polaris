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
}
