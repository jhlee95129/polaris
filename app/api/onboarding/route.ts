import { NextRequest, NextResponse } from "next/server"
import { calculateSajuProfile, generateSajuContext, lunarToSolarDate, type BirthInfo } from "@/lib/saju"
import { STEM_MAP } from "@/lib/saju-data"
import { generateText } from "@/lib/claude"
import { createUser, getUserByDisplayName } from "@/lib/db/queries"
import { getCurrentDaeunPillar } from "@/lib/daeun"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      display_name,
      birth_year,
      birth_month,
      birth_day,
      birth_hour,
      is_lunar,
      is_leap_month,
      gender,
    } = body as {
      display_name?: string
      birth_year: number
      birth_month: number
      birth_day: number
      birth_hour?: number
      is_lunar?: boolean
      is_leap_month?: boolean
      gender: "male" | "female"
    }

    // 닉네임 필수 + 중복 체크
    if (!display_name || display_name.trim().length === 0) {
      return NextResponse.json(
        { error: "닉네임은 필수입니다" },
        { status: 400 }
      )
    }
    const existing = await getUserByDisplayName(display_name.trim())
    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임이에요. 다른 닉네임을 선택해주세요." },
        { status: 409 }
      )
    }

    // 입력 검증
    if (!birth_year || !birth_month || !birth_day) {
      return NextResponse.json(
        { error: "생년월일은 필수입니다" },
        { status: 400 }
      )
    }
    if (!gender || !["male", "female"].includes(gender)) {
      return NextResponse.json(
        { error: "성별은 필수입니다 (male/female)" },
        { status: 400 }
      )
    }
    if (birth_year < 1900 || birth_year > 2050) {
      return NextResponse.json(
        { error: "1900~2050년 사이의 생년을 입력해주세요" },
        { status: 400 }
      )
    }

    // 사주 계산
    const birthInfo: BirthInfo = {
      year: birth_year,
      month: birth_month,
      day: birth_day,
      hour: birth_hour ?? undefined,
      isLunar: is_lunar ?? false,
      isLeapMonth: is_leap_month ?? false,
      gender: gender === "male" ? "M" : "F",
    }
    const profile = calculateSajuProfile(birthInfo)

    // 일간 한글명 조합 (예: "병화")
    const stemInfo = STEM_MAP[profile.dayStem]
    const ilganName = `${profile.dayStem}${stemInfo.element}`

    // 4기둥 문자열
    const yeonPillar = profile.yearPillar.pillar
    const wolPillar = profile.monthPillar.pillar
    const ilPillar = profile.dayPillar.pillar
    const siPillar = profile.hourPillar?.pillar ?? null

    // Claude로 사주 한 줄 요약 생성
    let sajuSummary = ""
    try {
      sajuSummary = await generateText(
        "사주 명식을 20자 이내의 한 줄로 요약해주세요. 형식: '{일간} 일간 · {특성 키워드} · {인상적 비유}'. 예시: '병화 일간 · 식상이 강한 봄날의 태양'",
        generateSajuContext(profile)
      )
    } catch {
      sajuSummary = `${ilganName} 일간`
    }

    // 대운 계산 (절기 기반이므로 양력 날짜 필요)
    let daeunCurrent: string | null = null
    try {
      let solarY = birth_year, solarM = birth_month, solarD = birth_day
      if (is_lunar) {
        const converted = lunarToSolarDate(birth_year, birth_month, birth_day, is_leap_month)
        solarY = converted.solar.year
        solarM = converted.solar.month
        solarD = converted.solar.day
      }
      daeunCurrent = getCurrentDaeunPillar(
        wolPillar,
        yeonPillar[0], // 연주 천간
        gender === "male" ? "M" : "F",
        solarY, solarM, solarD
      )
    } catch (e) {
      console.error("대운 계산 실패:", e)
    }

    // DB 저장
    const user = await createUser({
      display_name: display_name || null,
      birth_year,
      birth_month,
      birth_day,
      birth_hour: birth_hour ?? null,
      is_lunar: is_lunar ?? false,
      is_leap_month: is_leap_month ?? false,
      gender,
      ilgan: ilganName,
      yeon_pillar: yeonPillar,
      wol_pillar: wolPillar,
      il_pillar: ilPillar,
      si_pillar: siPillar,
      daeun_current: daeunCurrent,
      saju_summary: sajuSummary,
    })

    return NextResponse.json({
      user_id: user.id,
      saju_summary: sajuSummary,
      ilgan: ilganName,
      pillars: { yeon: yeonPillar, wol: wolPillar, il: ilPillar, si: siPillar },
    })
  } catch (error) {
    console.error("온보딩 오류:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "온보딩 처리 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
