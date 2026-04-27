/**
 * Claude API 클라이언트 — 스트리밍 채팅 + 텍스트 생성
 */

import Anthropic from "@anthropic-ai/sdk"

// ─── Claude 클라이언트 ───

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return client
}

const MODEL = "claude-opus-4-7"

// ─── saju_basis tool 정의 (구조화 출력 추출용) ───

export interface SajuBasisInput {
  referenced_pillars: string[]
  key_elements: string[]
  reasoning: string
  coaching: string
  topic: string
}

const SAJU_BASIS_TOOL: Anthropic.Messages.Tool = {
  name: "saju_basis",
  description:
    "사주 해석이 포함된 응답일 때만 호출하세요. 이 응답에서 참조한 명리학적 근거를 구조화합니다. 단순 인사, 잡담, 되묻기, 감정 공감 등 사주 해석이 없는 응답에는 호출하지 마세요.",
  input_schema: {
    type: "object" as const,
    properties: {
      referenced_pillars: {
        type: "array",
        items: { type: "string" },
        description: "이 응답에서 참조한 기둥 배열 (년주/월주/일주/시주/대운)",
      },
      key_elements: {
        type: "array",
        items: { type: "string" },
        description: "이 응답에서 주목한 오행 배열 (목/화/토/금/수)",
      },
      reasoning: {
        type: "string",
        description: "이 응답을 이 사주에게 한 명리학적 이유 1-2문장",
      },
      coaching: {
        type: "string",
        description: "핵심 코칭 — 사주 해석을 바탕으로 사용자가 취해야 할 구체적 행동이나 마음가짐 1-2문장",
      },
      topic: {
        type: "string",
        enum: ["career", "relationship", "love", "family", "health", "finance", "education", "mindset", "timing", "general"],
        description: "이 응답의 주제 (career=직업·진로, relationship=인간관계, love=연애·결혼, family=가족, health=건강, finance=재정·금전, education=학업·시험, mindset=마음가짐, timing=시기·타이밍, general=전반)",
      },
    },
    required: ["referenced_pillars", "key_elements", "reasoning", "coaching", "topic"],
  },
}

// ─── 스트리밍 채팅 ───

/**
 * Claude 스트리밍 채팅 호출
 * SSE로 클라이언트에 전달할 수 있는 MessageStream 반환
 * tool_use: saju_basis tool로 구조화된 근거 데이터 추출
 */
export function streamChat(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
) {
  const anthropic = getClient()
  return anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    tools: [SAJU_BASIS_TOOL],
    tool_choice: { type: "auto" },
  })
}

// ─── 비스트리밍 텍스트 생성 (온보딩 요약 등) ───

/**
 * 1회성 텍스트 생성 (스트리밍 아님)
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const anthropic = getClient()
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  })

  const block = response.content[0]
  if (block.type === "text") return block.text
  return ""
}
