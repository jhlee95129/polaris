/**
 * Supabase DB 쿼리 헬퍼 — users + messages CRUD
 */

import { getServerSupabase } from "@/lib/supabase/server"

// ─── 타입 ───

export interface UserRow {
  id: string
  created_at: string
  display_name: string | null
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null
  is_lunar: boolean
  gender: string
  ilgan: string
  yeon_pillar: string
  wol_pillar: string
  il_pillar: string
  si_pillar: string | null
  daeun_current: string | null
  saju_summary: string | null
}

export interface MessageRow {
  id: string
  user_id: string
  session_id: string
  role: "user" | "assistant"
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface SessionRow {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

// ─── Users ───

export async function createUser(
  data: Omit<UserRow, "id" | "created_at">
): Promise<UserRow> {
  const supabase = getServerSupabase()
  const { data: user, error } = await supabase
    .from("users")
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`사용자 생성 실패: ${error.message}`)
  return user as UserRow
}

export async function updateUser(
  id: string,
  data: Partial<Omit<UserRow, "id" | "created_at">>
): Promise<UserRow> {
  const supabase = getServerSupabase()
  const { data: user, error } = await supabase
    .from("users")
    .update(data)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(`사용자 수정 실패: ${error.message}`)
  return user as UserRow
}

export async function getUser(id: string): Promise<UserRow | null> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return data as UserRow
}

// ─── Sessions ───

export async function createSession(
  userId: string,
  title: string = "새 대화"
): Promise<SessionRow> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: userId, title })
    .select()
    .single()

  if (error) throw new Error(`세션 생성 실패: ${error.message}`)
  return data as SessionRow
}

export async function getUserSessions(
  userId: string,
  limit: number = 30
): Promise<SessionRow[]> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as SessionRow[]) ?? []
}

export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  const supabase = getServerSupabase()
  await supabase.from("sessions").update({ title }).eq("id", sessionId)
}

async function touchSession(sessionId: string): Promise<void> {
  const supabase = getServerSupabase()
  await supabase
    .from("sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId)
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = getServerSupabase()
  await supabase.from("sessions").delete().eq("id", sessionId)
}

// ─── Messages ───

/**
 * 세션별 메시지 조회 (오래된 순)
 */
export async function getSessionMessages(
  sessionId: string,
  limit: number = 50
): Promise<MessageRow[]> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return ((data as MessageRow[]) ?? []).reverse()
}

/**
 * 유저의 최근 메시지 조회 (세션 무관, 인사 맥락용)
 */
export async function getRecentMessages(
  userId: string,
  limit: number = 20
): Promise<MessageRow[]> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return ((data as MessageRow[]) ?? []).reverse()
}

export async function saveMessage(
  userId: string,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  const supabase = getServerSupabase()
  const { error } = await supabase
    .from("messages")
    .insert({
      user_id: userId,
      session_id: sessionId,
      role,
      content,
      metadata: metadata ?? null,
    })

  if (error) {
    console.error("메시지 저장 실패:", error.message)
  }
  await touchSession(sessionId)
}

export async function deleteUserMessages(userId: string): Promise<void> {
  const supabase = getServerSupabase()
  await supabase.from("messages").delete().eq("user_id", userId)
}
