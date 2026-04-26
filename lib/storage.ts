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
  localStorage.removeItem(POLARIS_ENERGY_KEY)
}

// ─── 복채 시스템 ───

const POLARIS_ENERGY_KEY = "polaris_energy"
const MAX_ENERGY = 3

interface EnergyState {
  count: number
  lastResetDate: string
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getEnergy(): EnergyState {
  if (typeof window === "undefined") return { count: MAX_ENERGY, lastResetDate: getTodayString() }
  const raw = localStorage.getItem(POLARIS_ENERGY_KEY)
  if (!raw) {
    const initial: EnergyState = { count: MAX_ENERGY, lastResetDate: getTodayString() }
    localStorage.setItem(POLARIS_ENERGY_KEY, JSON.stringify(initial))
    return initial
  }
  const state: EnergyState = JSON.parse(raw)
  if (state.lastResetDate !== getTodayString()) {
    const reset: EnergyState = { count: MAX_ENERGY, lastResetDate: getTodayString() }
    localStorage.setItem(POLARIS_ENERGY_KEY, JSON.stringify(reset))
    return reset
  }
  return state
}

export function useEnergy(): boolean {
  const state = getEnergy()
  if (state.count <= 0) return false
  const updated: EnergyState = { ...state, count: state.count - 1 }
  localStorage.setItem(POLARIS_ENERGY_KEY, JSON.stringify(updated))
  return true
}

export { MAX_ENERGY }
