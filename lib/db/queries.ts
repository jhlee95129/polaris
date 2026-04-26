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
  role: "user" | "assistant"
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
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

// ─── Messages ───

/**
 * 최근 메시지 조회 (오래된 순 — Claude messages 배열에 바로 사용)
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
  // DB에서 최신순으로 가져온 것을 오래된 순으로 뒤집기
  return ((data as MessageRow[]) ?? []).reverse()
}

export async function saveMessage(
  userId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  const supabase = getServerSupabase()
  const { error } = await supabase
    .from("messages")
    .insert({ user_id: userId, role, content, metadata: metadata ?? null })

  if (error) {
    console.error("메시지 저장 실패:", error.message)
  }
}

export async function deleteUserMessages(userId: string): Promise<void> {
  const supabase = getServerSupabase()
  await supabase.from("messages").delete().eq("user_id", userId)
}
