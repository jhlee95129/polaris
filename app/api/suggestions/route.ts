import { NextRequest, NextResponse } from "next/server"
import { getClient, MODEL_LIGHT } from "@/lib/claude"

export async function POST(req: NextRequest) {
  try {
    const { messages, user_context } = await req.json() as {
      messages: { role: string; content: string }[]
      user_context?: string
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    // 최근 6개 메시지만 사용 (토큰 절약)
    const recent = messages.slice(-6)

    const res = await getClient().messages.create({
      model: MODEL_LIGHT,
      max_tokens: 400,
      system: `당신은 사주 상담 AI 앱의 추천 질문 생성기입니다.
사용자와 AI 코치의 대화를 보고, 사용자가 다음에 물어볼 만한 자연스러운 후속 질문 7개를 생성하세요.

규칙:
- 반말 구어체 (친구한테 말하듯)
- 각 질문은 15자 이내로 짧게
- 대화 맥락과 직접 연관된 구체적 질문
- JSON 배열로만 출력: ["질문1","질문2","질문3","질문4","질문5","질문6","질문7"]
- 다른 텍스트 없이 JSON만 출력${user_context ? `\n\n사용자 정보: ${user_context}` : ""}`,
      messages: [
        ...recent.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user" as const,
          content: "위 대화를 보고 사용자가 다음에 물어볼 만한 후속 질문 7개를 JSON 배열로 생성해줘.",
        },
      ],
    })

    const text = res.content[0].type === "text" ? res.content[0].text : ""
    // JSON 배열 파싱
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ suggestions: [] })

    const suggestions: string[] = JSON.parse(match[0])
    return NextResponse.json({ suggestions: suggestions.slice(0, 7) })
  } catch (err) {
    console.error("추천 질문 생성 실패:", err)
    return NextResponse.json({ suggestions: [] })
  }
}
