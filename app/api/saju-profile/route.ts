import { NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"
import { calculateSajuProfile, type BirthInfo } from "@/lib/saju"
import type { Element } from "@/lib/saju-data"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id")
  if (!userId) {
    return NextResponse.json({ error: "user_id 필요" }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { data: user, error } = await supabase
    .from("users")
    .select("birth_year, birth_month, birth_day, birth_hour, is_lunar, gender")
    .eq("id", userId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: "사용자 없음" }, { status: 404 })
  }

  const birthInfo: BirthInfo = {
    year: user.birth_year,
    month: user.birth_month,
    day: user.birth_day,
    hour: user.birth_hour != null && user.birth_hour >= 0 ? user.birth_hour : undefined,
    isLunar: user.is_lunar ?? false,
    gender: user.gender === "male" ? "M" : "F",
  }

  const profile = calculateSajuProfile(birthInfo)

  return NextResponse.json({
    dayStem: profile.dayStem,
    dayStemDescription: profile.dayStemDescription,
    dayStemPersonality: profile.dayStemPersonality,
    elementCounts: profile.elementCounts as Record<Element, number>,
    dominantElement: profile.dominantElement,
    weakestElement: profile.weakestElement,
    usefulGod: profile.usefulGod,
    usefulGodReason: profile.usefulGodReason,
    dominantTenGods: profile.dominantTenGods,
    todayPillar: profile.todayPillar ? {
      pillar: profile.todayPillar.pillar,
      pillarHanja: profile.todayPillar.pillarHanja,
      stemElement: profile.todayPillar.stemElement,
      branchElement: profile.todayPillar.branchElement,
    } : null,
    todayInteraction: profile.todayInteraction ?? null,
    yearAnimal: profile.yearPillar.animal ?? null,
  })
}
