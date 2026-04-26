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

// ─── 스트리밍 채팅 ───

/**
 * Claude 스트리밍 채팅 호출
 * SSE로 클라이언트에 전달할 수 있는 MessageStream 반환
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
