import { NextRequest } from "next/server"
import { streamChat, extractSajuBasis } from "@/lib/claude"
import { buildSystemPrompt, buildUserContextBlock } from "@/lib/prompts"
import { getUser, getSession, getSessionMessages, getRecentMessages, saveMessage, updateSessionTitle, consumeBokchae } from "@/lib/db/queries"
import { searchSajuKnowledge } from "@/lib/rag"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, session_id, message, greeting } = body as {
      user_id: string
      session_id: string
      message?: string
      greeting?: boolean
    }

    if (!user_id || !session_id) {
      return new Response(JSON.stringify({ error: "user_id, session_id 필수" }), {
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

    // 복채 차감 (인사는 무료, 유저 메시지만 차감)
    if (message && !greeting) {
      try {
        await consumeBokchae(user_id)
      } catch {
        return new Response(
          JSON.stringify({ error: "bokchae_empty", message: "복채가 부족합니다. 상점에서 충전해 주세요." }),
          { status: 402, headers: { "Content-Type": "application/json" } },
        )
      }
    }

    // 세션 조회 (캐릭터 결정)
    const session = await getSession(session_id)
    const characterId = (session?.character_id || user.character_id || "seonbi") as import("@/lib/characters").CharacterId

    // 세션 메시지 + RAG 검색
    const sessionMessages = await getSessionMessages(session_id, 20)
    const ilganChunk = await searchSajuKnowledge(user.ilgan, message)

    // 시스템 프롬프트 조립
    const systemPrompt = buildSystemPrompt(characterId) + "\n" + buildUserContextBlock({
      user,
      ilganChunk,
    })

    // Claude 메시지 배열 구성
    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = []

    if (greeting && !message) {
      // 인사 생성 모드: 세션에 메시지가 없으면 인사 필요
      const isNewSession = sessionMessages.length === 0
      if (!isNewSession) {
        return new Response(JSON.stringify({ skip: true }), {
          headers: { "Content-Type": "application/json" },
        })
      }

      // 다른 세션에 이전 대화가 있는지 확인
      const crossSessionMessages = await getRecentMessages(user_id, 10)
      const isReturning = crossSessionMessages.length > 0

      if (isReturning) {
        // 재방문 — 이전 대화 맥락 포함
        for (const msg of crossSessionMessages.slice(-10)) {
          claudeMessages.push({ role: msg.role, content: msg.content })
        }
        claudeMessages.push({
          role: "user",
          content: `[시스템] 사용자가 새 대화를 시작했습니다. 이전 대화 내용을 자연스럽게 언급하면서 반갑게 맞아주세요. 이전 대화에서 다뤘던 주요 고민이나 상황을 부드럽게 되물어주세요.`,
        })
      } else {
        // 완전 첫 방문
        claudeMessages.push({
          role: "user",
          content: `[시스템] 사용자가 처음 채팅에 진입했습니다. ${user.display_name ? `"${user.display_name}"` : "사용자"}의 이름을 부르며 명식 한 줄 언급하고 가벼운 첫 질문을 해주세요. 자기소개는 하지 마세요.`,
        })
      }
    } else if (message) {
      // 일반 채팅 — 세션 히스토리 + 새 메시지
      for (const msg of sessionMessages) {
        claudeMessages.push({ role: msg.role, content: msg.content })
      }
      claudeMessages.push({ role: "user", content: message })
    } else {
      return new Response(JSON.stringify({ error: "message 또는 greeting 필수" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 유저 메시지를 스트리밍 시작 전에 먼저 DB 저장 (리프레시 시 유실 방지)
    if (message) {
      await saveMessage(user_id, session_id, "user", message)
      // 첫 유저 메시지 → 세션 제목 자동 설정
      const hasUserMessages = sessionMessages.some(m => m.role === "user")
      if (!hasUserMessages) {
        const title = message.length > 30 ? message.slice(0, 30) + "..." : message
        await updateSessionTitle(session_id, title)
      }
    }

    // 스트리밍 응답 (tool_use로 saju_basis 구조화 출력 추출)
    const stream = streamChat(systemPrompt, claudeMessages)
    const encoder = new TextEncoder()
    let fullText = ""
    let toolInput = ""
    let sajuBasis: Record<string, unknown> | null = null

    let closed = false
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let textCompleteSent = false

          for await (const event of stream) {
            if (closed) break
            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const text = event.delta.text
                fullText += text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                )
              } else if (event.delta.type === "input_json_delta") {
                // 도구 입력 시작 = 텍스트 완료 → 분석 단계 알림
                if (!textCompleteSent) {
                  textCompleteSent = true
                  try {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ textComplete: true })}\n\n`)
                    )
                  } catch { /* 클라이언트 끊김 */ }
                }
                toolInput += event.delta.partial_json
              }
            }
          }

          if (closed) return

          // 도구 미호출 시에도 textComplete 전송
          if (!textCompleteSent) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ textComplete: true })}\n\n`)
              )
            } catch { /* 클라이언트 끊김 */ }
          }

          // tool input 파싱
          if (toolInput) {
            try {
              sajuBasis = JSON.parse(toolInput)
            } catch {
              console.error("saju_basis tool JSON 파싱 실패:", toolInput)
            }
          }

          // 도구 미호출 시 2차 강제 추출
          if (!sajuBasis && fullText) {
            try {
              sajuBasis = await extractSajuBasis(systemPrompt, claudeMessages, fullText) as Record<string, unknown> | null
            } catch (err) {
              console.error("saju_basis fallback 추출 실패:", err)
            }
          }

          // 메타데이터 전송 (항상 기본 사주 정보 포함, tool 사용 시 근거 추가)
          const basis = {
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
          }

          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                meta: { basis, cleanText: fullText }
              })}\n\n`)
            )
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
            controller.close()
          } catch {
            // 클라이언트 연결 끊김 — controller 이미 닫힘
          }
          closed = true
        } catch (err) {
          console.error("스트리밍 오류:", err)
          if (!closed) {
            const errMsg = err instanceof Error ? err.message : "스트리밍 오류"
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
              )
            } catch { /* controller already closed */ }
            closed = true
            try { controller.close() } catch { /* already closed */ }
          }
        }

        // 스트림 완료 후 어시스턴트 응답 DB 저장
        try {
          if (fullText) {
            const meta = {
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
            }
            await saveMessage(user_id, session_id, "assistant", fullText, meta)
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
