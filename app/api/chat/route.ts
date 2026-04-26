import { NextRequest } from "next/server"
import { streamChat } from "@/lib/claude"
import { buildSystemPrompt, buildUserContextBlock } from "@/lib/prompts"
import { getUser, getRecentMessages, saveMessage } from "@/lib/db/queries"
import { searchSajuKnowledge } from "@/lib/rag"

const SESSION_GAP_MS = 4 * 60 * 60 * 1000 // 4시간

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, message, greeting } = body as {
      user_id: string
      message?: string
      greeting?: boolean
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id 필수" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 사용자 조회
    const user = await getUser(user_id)
    if (!user) {
      return new Response(JSON.stringify({ error: "사용자를 찾을 수 없습니다" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 최근 메시지 + RAG 검색 (사용자 메시지 기반 컨텍스트 검색)
    const recentMessages = await getRecentMessages(user_id, 20)
    const ilganChunk = await searchSajuKnowledge(user.ilgan, message)

    // 시스템 프롬프트 조립
    const systemPrompt = buildSystemPrompt() + "\n" + buildUserContextBlock({
      user,
      ilganChunk,
    })

    // Claude 메시지 배열 구성
    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = []

    if (greeting && !message) {
      // 인사 생성 모드
      const isReturning = recentMessages.length > 0
      const lastMsg = recentMessages[recentMessages.length - 1]
      const isNewSession = !lastMsg ||
        (Date.now() - new Date(lastMsg.created_at).getTime()) > SESSION_GAP_MS

      if (isReturning && isNewSession) {
        // 재방문 — 이전 대화 맥락 포함
        for (const msg of recentMessages.slice(-10)) {
          claudeMessages.push({ role: msg.role, content: msg.content })
        }
        claudeMessages.push({
          role: "user",
          content: `[시스템] 사용자가 다시 돌아왔습니다. 이전 대화 내용을 자연스럽게 언급하면서 반갑게 맞아주세요. 이전 대화에서 다뤘던 주요 고민이나 상황을 부드럽게 되물어주세요.`,
        })
      } else if (!isReturning) {
        // 첫 방문
        claudeMessages.push({
          role: "user",
          content: `[시스템] 사용자가 처음 채팅에 진입했습니다. ${user.display_name ? `"${user.display_name}"` : "사용자"}의 이름을 부르며 명식 한 줄 언급하고 가벼운 첫 질문을 해주세요. 자기소개는 하지 마세요.`,
        })
      } else {
        // 같은 세션 내 — 인사 불필요, 빈 응답
        return new Response(JSON.stringify({ skip: true }), {
          headers: { "Content-Type": "application/json" },
        })
      }
    } else if (message) {
      // 일반 채팅 — 히스토리 + 새 메시지
      for (const msg of recentMessages) {
        claudeMessages.push({ role: msg.role, content: msg.content })
      }
      claudeMessages.push({ role: "user", content: message })
    } else {
      return new Response(JSON.stringify({ error: "message 또는 greeting 필수" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // saju_basis 태그 파싱
    function parseSajuBasis(text: string) {
      const match = text.match(/<saju_basis>\s*([\s\S]*?)\s*<\/saju_basis>/)
      if (!match) return { cleanText: text, sajuBasis: null }
      const cleanText = text.replace(/<saju_basis>[\s\S]*?<\/saju_basis>/, "").trimEnd()
      try {
        return { cleanText, sajuBasis: JSON.parse(match[1]) as Record<string, unknown> }
      } catch {
        return { cleanText, sajuBasis: null }
      }
    }

    // 스트리밍 응답
    const stream = streamChat(systemPrompt, claudeMessages)
    const encoder = new TextEncoder()
    let fullResponse = ""

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text
              fullResponse += text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              )
            }
          }

          // 스트림 완료 — saju_basis 태그 파싱 후 메타데이터 전송
          const { cleanText, sajuBasis } = parseSajuBasis(fullResponse)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              meta: {
                basis: {
                  ilgan: user.ilgan,
                  ilganChunk: ilganChunk || null,
                  pillars: {
                    yeon: user.yeon_pillar,
                    wol: user.wol_pillar,
                    il: user.il_pillar,
                    si: user.si_pillar,
                  },
                  daeun: user.daeun_current || null,
                  ...(sajuBasis || {}),
                },
                cleanText,
              }
            })}\n\n`)
          )

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (err) {
          console.error("스트리밍 오류:", err)
          const errMsg = err instanceof Error ? err.message : "스트리밍 오류"
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
          )
          controller.close()
        }

        // 스트림 완료 후 DB 저장 (클린 텍스트)
        try {
          const { cleanText, sajuBasis } = parseSajuBasis(fullResponse)
          if (message) {
            await saveMessage(user_id, "user", message)
          }
          if (cleanText) {
            await saveMessage(user_id, "assistant", cleanText, {
              basis: {
                ilgan: user.ilgan,
                ilganChunk: ilganChunk || null,
                pillars: {
                  yeon: user.yeon_pillar,
                  wol: user.wol_pillar,
                  il: user.il_pillar,
                  si: user.si_pillar,
                },
                daeun: user.daeun_current || null,
                ...(sajuBasis || {}),
              },
            })
          }
        } catch (err) {
          console.error("메시지 저장 실패:", err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("채팅 오류:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "채팅 처리 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
