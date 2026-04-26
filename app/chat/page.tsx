"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getUserId } from "@/lib/storage"
import MessageList, { type ChatMessage } from "@/components/chat/MessageList"
import MessageInput from "@/components/chat/MessageInput"
import SajuSidebar from "@/components/chat/SajuSidebar"
import { Star, ChevronDown, ChevronUp } from "lucide-react"

interface UserData {
  id: string
  display_name: string | null
  saju_summary: string | null
  yeon_pillar: string
  wol_pillar: string
  il_pillar: string
  si_pillar: string | null
}

export default function ChatPage() {
  const router = useRouter()
  const [userId, setUserIdState] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false)

  // 초기 로드
  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace("/")
      return
    }
    setUserIdState(id)
    loadUserAndMessages(id)
  }, [router])

  async function loadUserAndMessages(id: string) {
    try {
      const res = await fetch(`/api/user?id=${id}`)
      if (!res.ok) {
        router.replace("/onboarding")
        return
      }

      const { user: userData, messages: msgData } = await res.json()
      setUser(userData as UserData)

      const loadedMessages: ChatMessage[] = (msgData ?? []).map((m: { id: string; role: string; content: string }) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
      setMessages(loadedMessages)

      // 인사 필요 여부 판단
      const lastMsg = msgData?.[msgData.length - 1]
      const needsGreeting = !lastMsg ||
        (Date.now() - new Date(lastMsg.created_at).getTime()) > 4 * 60 * 60 * 1000

      if (needsGreeting) {
        requestGreeting(id, loadedMessages)
      }
    } catch {
      router.replace("/onboarding")
    }
  }

  // 인사 요청
  async function requestGreeting(id: string, currentMessages: ChatMessage[]) {
    setIsStreaming(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, greeting: true }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.skip) {
          setIsStreaming(false)
          return
        }
        throw new Error(data.error)
      }

      const contentType = res.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const data = await res.json()
        if (data.skip) {
          setIsStreaming(false)
          return
        }
      }

      // SSE 스트리밍 읽기
      await readStream(res, currentMessages)
    } catch (err) {
      console.error("인사 요청 실패:", err)
    }
    setIsStreaming(false)
  }

  // 메시지 전송
  const handleSend = useCallback(async (text: string) => {
    if (!userId || isStreaming) return

    // 사용자 메시지 추가
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setIsStreaming(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: text }),
      })

      if (!res.ok) {
        throw new Error("채팅 요청 실패")
      }

      await readStream(res, updatedMessages)
    } catch (err) {
      console.error("메시지 전송 실패:", err)
      // 에러 메시지
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "미안, 지금 좀 연결이 불안정해. 잠시 후에 다시 말해줄래?",
      }])
    }
    setIsStreaming(false)
  }, [userId, isStreaming, messages])

  // SSE 스트리밍 읽기
  async function readStream(res: Response, currentMessages: ChatMessage[]) {
    const reader = res.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let assistantContent = ""
    const assistantId = `assistant-${Date.now()}`

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const data = line.slice(6)
        if (data === "[DONE]") break

        try {
          const parsed = JSON.parse(data)
          if (parsed.text) {
            assistantContent += parsed.text
            setMessages([
              ...currentMessages,
              { id: assistantId, role: "assistant", content: assistantContent },
            ])
          }
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    }
  }

  // 리셋 핸들러
  function handleReset() {
    router.replace("/")
  }

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-svh">
      {/* 데스크탑 사이드바 */}
      <div className="hidden md:block w-[280px] shrink-0">
        <SajuSidebar
          sajuSummary={user.saju_summary}
          displayName={user.display_name}
          pillars={{
            yeon: user.yeon_pillar,
            wol: user.wol_pillar,
            il: user.il_pillar,
            si: user.si_pillar,
          }}
          onReset={handleReset}
        />
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* 모바일 헤더 */}
        <div className="md:hidden border-b border-border bg-card/50 px-4 py-3">
          <button
            onClick={() => setMobileInfoOpen(!mobileInfoOpen)}
            className="flex items-center gap-2 w-full"
          >
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium flex-1 text-left truncate">
              {user.saju_summary || "폴라리스"}
            </span>
            {mobileInfoOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {mobileInfoOpen && (
            <div className="mt-3 grid grid-cols-4 gap-2 text-center p-2 rounded-lg bg-background/50 border border-border">
              {[
                { label: "년주", value: user.yeon_pillar },
                { label: "월주", value: user.wol_pillar },
                { label: "일주", value: user.il_pillar },
                { label: "시주", value: user.si_pillar || "—" },
              ].map(p => (
                <div key={p.label} className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">{p.label}</p>
                  <p className="text-xs font-medium">{p.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 메시지 목록 */}
        <MessageList messages={messages} isStreaming={isStreaming} />

        {/* 입력 */}
        <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
