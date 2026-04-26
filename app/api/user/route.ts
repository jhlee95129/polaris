import { NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("id")
  if (!userId) {
    return NextResponse.json({ error: "id 필요" }, { status: 400 })
  }

  const supabase = getServerSupabase()

  // 사용자 데이터
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, display_name, saju_summary, yeon_pillar, wol_pillar, il_pillar, si_pillar")
    .eq("id", userId)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: "사용자 없음" }, { status: 404 })
  }

  // 메시지 로드
  const { data: msgData } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(50)

  return NextResponse.json({ user: userData, messages: msgData ?? [] })
}
