import { NextRequest, NextResponse } from "next/server"
import { calculateSajuProfile, type BirthInfo } from "@/lib/saju"
import { buildDailyActionPrompt } from "@/lib/prompts"
import { getDailyAction } from "@/lib/claude"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { birthInfo } = body as { birthInfo: BirthInfo }

    if (!birthInfo?.year || !birthInfo?.month || !birthInfo?.day) {
      return NextResponse.json(
        { error: "생년월일 정보가 필요합니다" },
        { status: 400 }
      )
    }

    // 1. 사주팔자 계산 (오늘의 일진 포함)
    const profile = calculateSajuProfile(birthInfo)

    // 2. 오늘의 한수 프롬프트 생성
    const systemPrompt = buildDailyActionPrompt(profile)

    // 3. Claude에서 오늘의 행동 추천 생성
    const dailyAction = await getDailyAction(systemPrompt)

    return NextResponse.json({
      success: true,
      dailyAction,
    })
  } catch (error) {
    console.error("오늘의 한수 생성 오류:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "오늘의 한수 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
