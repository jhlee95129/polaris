import { NextRequest, NextResponse } from "next/server"
import { getClient, MODEL_LIGHT } from "@/lib/claude"

export async function POST(req: NextRequest) {
  try {
    const { ilgan, pillars, daeun_current, display_name } = await req.json() as {
      ilgan: string
      pillars: { yeon: string; wol: string; il: string; si: string | null }
      daeun_current: string | null
      display_name: string | null
    }

    if (!ilgan) {
      return NextResponse.json({ error: "ilgan required" }, { status: 400 })
    }

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

    const sajuContext = [
      `일간: ${ilgan}`,
      `사주: 년주 ${pillars.yeon}, 월주 ${pillars.wol}, 일주 ${pillars.il}${pillars.si ? `, 시주 ${pillars.si}` : ""}`,
      daeun_current ? `현재 대운: ${daeun_current}` : null,
      display_name ? `이름: ${display_name}` : null,
    ].filter(Boolean).join("\n")

    const res = await getClient().messages.create({
      model: MODEL_LIGHT,
      max_tokens: 400,
      system: `당신은 사주 명리학 전문가입니다. 오늘 날짜(${todayStr})와 사용자의 사주 정보를 바탕으로 오늘의 운세 정보를 생성합니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

{
  "coaching": "오늘의 핵심 코칭 (20자 이내, 따뜻한 한마디)",
  "warning": "오늘 주의할 점 (20자 이내)",
  "lucky_number": 숫자(1-99),
  "lucky_color": "색깔 이름 (한국어, 2-4자)",
  "lucky_color_hex": "#hex색상코드",
  "energy": "오늘의 기운 한 단어 (예: 활력, 안정, 집중, 도전, 여유)"
}

사주 오행의 균형, 일간과 오늘의 관계를 고려해 자연스럽고 구체적인 내용을 생성하세요.`,
      messages: [{
        role: "user",
        content: sajuContext,
      }],
    })

    const text = res.content[0].type === "text" ? res.content[0].text : ""
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return NextResponse.json({
        coaching: "오늘 하루도 잘 해낼 거예요",
        warning: "무리하지 마세요",
        lucky_number: 7,
        lucky_color: "파랑",
        lucky_color_hex: "#4A90D9",
        energy: "안정",
      })
    }

    const fortune = JSON.parse(match[0])
    return NextResponse.json(fortune)
  } catch (err) {
    console.error("일일 운세 생성 실패:", err)
    return NextResponse.json({
      coaching: "오늘 하루도 잘 해낼 거예요",
      warning: "무리하지 마세요",
      lucky_number: 7,
      lucky_color: "파랑",
      lucky_color_hex: "#4A90D9",
      energy: "안정",
    })
  }
}
