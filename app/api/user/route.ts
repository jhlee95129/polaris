import { NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"
import { updateUser, getUserSessions, deleteUser } from "@/lib/db/queries"
import { calculateSajuProfile, generateSajuContext, type BirthInfo } from "@/lib/saju"
import { STEM_MAP } from "@/lib/saju-data"
import { generateText } from "@/lib/claude"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("id")
  if (!userId) {
    return NextResponse.json({ error: "id 필요" }, { status: 400 })
  }

  const supabase = getServerSupabase()

  // 사용자 데이터
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, display_name, saju_summary, yeon_pillar, wol_pillar, il_pillar, si_pillar, birth_year, birth_month, birth_day, birth_hour, is_lunar, gender, ilgan, daeun_current, created_at, bokchae_count, last_checkin_date")
    .eq("id", userId)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: "사용자 없음" }, { status: 404 })
  }

  // 세션 목록 로드
  const sessions = await getUserSessions(userId)

  return NextResponse.json({ user: userData, sessions })
}

export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("id")
  if (!userId) {
    return NextResponse.json({ error: "id 필요" }, { status: 400 })
  }
  try {
    await deleteUser(userId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("계정 삭제 오류:", error)
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      display_name,
      birth_year,
      birth_month,
      birth_day,
      birth_hour,
      is_lunar,
      gender,
    } = body as {
      id: string
      display_name?: string
      birth_year: number
      birth_month: number
      birth_day: number
      birth_hour?: number
      is_lunar?: boolean
      gender: "male" | "female"
    }

    if (!id) {
      return NextResponse.json({ error: "id 필요" }, { status: 400 })
    }
    if (!birth_year || !birth_month || !birth_day) {
      return NextResponse.json({ error: "생년월일은 필수입니다" }, { status: 400 })
    }
    if (!gender || !["male", "female"].includes(gender)) {
      return NextResponse.json({ error: "성별은 필수입니다" }, { status: 400 })
    }

    // 사주 재계산
    const birthInfo: BirthInfo = {
      year: birth_year,
      month: birth_month,
      day: birth_day,
      hour: birth_hour ?? undefined,
      isLunar: is_lunar ?? false,
      gender: gender === "male" ? "M" : "F",
    }
    const profile = calculateSajuProfile(birthInfo)

    const stemInfo = STEM_MAP[profile.dayStem]
    const ilganName = `${profile.dayStem}${stemInfo.element}`

    const yeonPillar = profile.yearPillar.pillar
    const wolPillar = profile.monthPillar.pillar
    const ilPillar = profile.dayPillar.pillar
    const siPillar = profile.hourPillar?.pillar ?? null

    // 사주 한 줄 요약 재생성
    let sajuSummary = ""
    try {
      sajuSummary = await generateText(
        "사주 명식을 20자 이내의 한 줄로 요약해주세요. 형식: '{일간} 일간 · {특성 키워드} · {인상적 비유}'. 예시: '병화 일간 · 식상이 강한 봄날의 태양'",
        generateSajuContext(profile)
      )
    } catch {
      sajuSummary = `${ilganName} 일간`
    }

    const user = await updateUser(id, {
      display_name: display_name || null,
      birth_year,
      birth_month,
      birth_day,
      birth_hour: birth_hour ?? null,
      is_lunar: is_lunar ?? false,
      gender,
      ilgan: ilganName,
      yeon_pillar: yeonPillar,
      wol_pillar: wolPillar,
      il_pillar: ilPillar,
      si_pillar: siPillar,
      saju_summary: sajuSummary,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("사용자 수정 오류:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "수정 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
