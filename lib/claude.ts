/**
 * Claude API 클라이언트 — 스트리밍 채팅 + 텍스트 생성
 */

import Anthropic from "@anthropic-ai/sdk"

// ─── Claude 클라이언트 ───

let client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return client
}

const MODEL = "claude-sonnet-4-6"
/** 경량 작업용 (추천 질문, 일일 운세 등) */
export const MODEL_LIGHT = "claude-sonnet-4-6"

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
    "자연어 응답을 생성한 뒤 반드시 호출하세요. 사주 관련 조언이나 해석이 포함된 응답에서는 꼭 호출해야 합니다. 단순 인사라도 가능하면 호출하세요.",
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
        description: "핵심 코칭 — 사용자에게 직접 건네는 따뜻한 조언 1-2문장. 구체적 행동이나 마음가짐을 사주 근거와 함께 제시. '라포', '열린 질문' 등 상담 용어 사용 금지. 첫 대화라면 사용자의 사주 특성에서 긍정적인 점을 짧게 짚어줄 것.",
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

// ─── saju_basis 강제 추출 (스트리밍에서 도구 미호출 시 fallback) ───

export async function extractSajuBasis(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  assistantResponse: string
): Promise<SajuBasisInput | null> {
  const anthropic = getClient()
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      ...messages,
      { role: "assistant", content: assistantResponse },
      { role: "user", content: "[시스템] 위 응답에 대해 saju_basis 도구를 호출해 주세요." },
    ],
    tools: [SAJU_BASIS_TOOL],
    tool_choice: { type: "tool", name: "saju_basis" },
  })

  const toolBlock = response.content.find(b => b.type === "tool_use" && b.name === "saju_basis")
  if (toolBlock && toolBlock.type === "tool_use") {
    return toolBlock.input as SajuBasisInput
  }
  return null
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
