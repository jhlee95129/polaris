import { NextRequest, NextResponse } from "next/server"
import { calculateSajuProfile, type BirthInfo } from "@/lib/saju"
import { buildCoachingSystemPrompt, buildFollowUpSystemPrompt, type PreviousCoaching } from "@/lib/prompts"
import { getCoachingAdvice, type CoachingCard } from "@/lib/claude"
import { searchKnowledge, formatRAGContext } from "@/lib/rag"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { birthInfo, question, threadId, previousCards } = body as {
      birthInfo: BirthInfo
      question: string
      threadId?: string
      previousCards?: PreviousCoaching[]
    }

    // 입력 검증
    if (!birthInfo?.year || !birthInfo?.month || !birthInfo?.day) {
      return NextResponse.json(
        { error: "생년월일 정보가 필요합니다" },
        { status: 400 }
      )
    }

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "고민을 입력해주세요" },
        { status: 400 }
      )
    }

    // 1. 사주팔자 계산
    const profile = calculateSajuProfile(birthInfo)

    // 2. RAG 검색 (명리학 지식에서 관련 내용 검색)
    const sajuKeywords = [
      profile.dayStem,
      profile.dominantElement,
      profile.usefulGod,
      ...profile.dominantTenGods,
    ]
    const ragResults = await searchKnowledge(question, sajuKeywords)
    const ragContext = formatRAGContext(ragResults)

    // 3. 시스템 프롬프트 조합
    let systemPrompt: string
    if (previousCards && previousCards.length > 0) {
      // 후속 코칭: 이전 카드 맥락 포함
      systemPrompt = buildFollowUpSystemPrompt(profile, previousCards, ragContext || undefined)
    } else {
      // 첫 상담
      systemPrompt = buildCoachingSystemPrompt(profile, ragContext || undefined)
    }

    // 4. Claude 코칭 카드 생성
    const coachingCard = await getCoachingAdvice(systemPrompt, question)

    // threadId 생성 (없으면 새로 생성)
    const resolvedThreadId = threadId || `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    return NextResponse.json({
      success: true,
      card: coachingCard,
      threadId: resolvedThreadId,
    })
  } catch (error) {
    console.error("상담 오류:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "상담 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
