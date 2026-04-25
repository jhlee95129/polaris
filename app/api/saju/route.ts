import { NextRequest, NextResponse } from "next/server"
import { calculateSajuProfile, type BirthInfo } from "@/lib/saju"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { year, month, day, hour, isLunar, isLeapMonth, gender } = body as {
      year: number
      month: number
      day: number
      hour?: number
      isLunar?: boolean
      isLeapMonth?: boolean
      gender?: "M" | "F"
    }

    // 입력 검증
    if (!year || !month || !day) {
      return NextResponse.json(
        { error: "year, month, day는 필수입니다" },
        { status: 400 }
      )
    }

    if (year < 1900 || year > 2050) {
      return NextResponse.json(
        { error: "1900~2050년 사이의 생년을 입력해주세요" },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return NextResponse.json(
        { error: "올바른 월(1-12), 일(1-31)을 입력해주세요" },
        { status: 400 }
      )
    }

    if (hour !== undefined && (hour < 0 || hour > 23)) {
      return NextResponse.json(
        { error: "올바른 시간(0-23)을 입력해주세요" },
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

    const profile = calculateSajuProfile(birthInfo)

    // rawResult 제거 (직렬화 크기 줄이기)
    const { rawResult, ...profileData } = profile

    return NextResponse.json({
      success: true,
      profile: profileData,
    })
  } catch (error) {
    console.error("사주 계산 오류:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "사주 계산 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
