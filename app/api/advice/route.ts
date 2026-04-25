import { NextRequest, NextResponse } from "next/server"
import { calculateSajuProfile, type BirthInfo } from "@/lib/saju"
import { buildCoachingSystemPrompt, type CharacterType } from "@/lib/prompts"
import { getCoachingAdvice } from "@/lib/claude"
import { searchKnowledge, formatRAGContext } from "@/lib/rag"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { birthInfo, question, character } = body as {
      birthInfo: BirthInfo
      question: string
      character: CharacterType
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

    const validCharacters: CharacterType[] = ["sibling", "grandma", "analyst"]
    if (!validCharacters.includes(character)) {
      return NextResponse.json(
        { error: "올바른 캐릭터를 선택해주세요" },
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

    // 3. 시스템 프롬프트 조합 (RAG 컨텍스트 포함)
    const systemPrompt = buildCoachingSystemPrompt(profile, character, ragContext || undefined)

    // 4. Claude 코칭 카드 생성
    const coachingCard = await getCoachingAdvice(systemPrompt, question)

    return NextResponse.json({
      success: true,
      card: coachingCard,
      character,
    })
  } catch (error) {
    console.error("상담 오류:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "상담 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
