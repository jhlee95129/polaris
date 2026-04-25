import { NextRequest, NextResponse } from "next/server"
import { calculateSajuProfile, type BirthInfo } from "@/lib/saju"
import { buildProfileSystemPrompt } from "@/lib/prompts"
import { getProfileSummary } from "@/lib/claude"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, day, hour, isLunar, isLeapMonth, gender } = body

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: "year, month, day는 필수입니다" },
        { status: 400 }
      )
    }

    const birthInfo: BirthInfo = {
      year,
      month,
      day,
      hour: hour ?? undefined,
      isLunar: isLunar ?? false,
      isLeapMonth: isLeapMonth ?? false,
      gender,
    }

    // 1. 사주팔자 계산
    const profile = calculateSajuProfile(birthInfo)

    // 2. Claude로 프로필 요약 생성
    const systemPrompt = buildProfileSystemPrompt(profile)
    const summary = await getProfileSummary(systemPrompt)

    // 3. 사주 데이터 + AI 요약 합쳐서 반환
    const { rawResult, ...profileData } = profile

    return NextResponse.json({
      success: true,
      profile: profileData,
      summary,
    })
  } catch (error) {
    console.error("프로필 생성 오류:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "프로필 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
