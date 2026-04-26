"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getUserId } from "@/lib/storage"
import MessageList, { type ChatMessage } from "@/components/chat/MessageList"
import MessageInput from "@/components/chat/MessageInput"
import SajuSidebar from "@/components/chat/SajuSidebar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ChevronDown, ChevronUp } from "lucide-react"
import { pillarToHanja } from "@/lib/saju-data"

interface UserData {
  id: string
  display_name: string | null
  saju_summary: string | null
  yeon_pillar: string
  wol_pillar: string
  il_pillar: string
  si_pillar: string | null
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null
  is_lunar: boolean
  gender: string
  ilgan: string
  daeun_current: string | null
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
      const u = userData as UserData
      setUser(u)

      // 기본 basis (metadata 없는 이전 메시지용 폴백)
      const fallbackBasis: ChatMessage["basis"] = {
        ilgan: u.ilgan,
        ilganChunk: null,
        pillars: { yeon: u.yeon_pillar, wol: u.wol_pillar, il: u.il_pillar, si: u.si_pillar },
        daeun: u.daeun_current || null,
      }

      const loadedMessages: ChatMessage[] = (msgData ?? []).map((m: { id: string; role: string; content: string; metadata?: { basis?: ChatMessage["basis"] } | null }) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        ...(m.role === "assistant" ? { basis: m.metadata?.basis ?? fallbackBasis } : {}),
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
        const errData = await res.json().catch(() => ({}))
        console.error("채팅 API 에러:", res.status, errData)
        throw new Error(errData.error || "채팅 요청 실패")
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
    let basis: ChatMessage["basis"] = undefined
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
          if (parsed.meta?.basis) {
            basis = parsed.meta.basis
            // 클린 텍스트가 있으면 saju_basis 태그 제거된 버전으로 교체
            if (parsed.meta.cleanText) {
              assistantContent = parsed.meta.cleanText
            }
            setMessages([
              ...currentMessages,
              { id: assistantId, role: "assistant", content: assistantContent, basis },
            ])
            continue
          }
          if (parsed.error) {
            console.error("스트리밍 에러:", parsed.error)
            assistantContent = "미안, 지금 연결에 문제가 생겼어. 잠시 후에 다시 말해줄래?"
            setMessages([
              ...currentMessages,
              { id: assistantId, role: "assistant", content: assistantContent },
            ])
            return
          }
          if (parsed.text) {
            assistantContent += parsed.text
            // 스트리밍 중 <saju_basis> 태그가 보이지 않도록 실시간 제거
            const displayContent = assistantContent.replace(/<saju_basis[\s\S]*$/, "").trimEnd()
            setMessages([
              ...currentMessages,
              { id: assistantId, role: "assistant", content: displayContent },
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

  const sidebarProps = {
    displayName: user.display_name,
    sajuSummary: user.saju_summary,
    pillars: {
      yeon: user.yeon_pillar,
      wol: user.wol_pillar,
      il: user.il_pillar,
      si: user.si_pillar,
    },
    birthYear: user.birth_year,
    birthMonth: user.birth_month,
    birthDay: user.birth_day,
    birthHour: user.birth_hour,
    isLunar: user.is_lunar,
    gender: user.gender,
    ilgan: user.ilgan,
    daeunCurrent: user.daeun_current,
    onReset: handleReset,
  }

  return (
    <div className="h-[calc(100svh-49px)]">
      {/* 데스크탑: Resizable */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize="25%">
            <SajuSidebar {...sidebarProps} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="75%">
            <div className="flex h-full flex-col">
              <MessageList messages={messages} isStreaming={isStreaming} />
              <MessageInput onSend={handleSend} disabled={isStreaming} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 모바일: 접히는 헤더 */}
      <div className="md:hidden flex flex-col h-full">
        <div className="border-b border-border bg-card/50 px-4 py-3">
          <button
            onClick={() => setMobileInfoOpen(!mobileInfoOpen)}
            className="flex items-center gap-2 w-full"
          >
            <span className="text-sm">🔮</span>
            <span className="text-sm font-medium flex-1 text-left truncate">
              {user.saju_summary || "내 명식 보기"}
            </span>
            {mobileInfoOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {mobileInfoOpen && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-4 gap-2 text-center p-2 rounded-lg bg-background/50 border border-border">
                {[
                  { label: "시주", value: user.si_pillar || "—" },
                  { label: "일주", value: user.il_pillar },
                  { label: "월주", value: user.wol_pillar },
                  { label: "년주", value: user.yeon_pillar },
                ].map(p => (
                  <div key={p.label} className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">{p.label}</p>
                    <p className="text-xs font-medium">{p.value}</p>
                    {p.value !== "—" && (
                      <p className="text-[10px] font-medium text-primary/70">{pillarToHanja(p.value)}</p>
                    )}
                  </div>
                ))}
              </div>
              {user.daeun_current && (
                <p className="text-xs text-muted-foreground">
                  🌊 현재 대운: <span className="font-medium text-foreground">{user.daeun_current}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <MessageList messages={messages} isStreaming={isStreaming} />
        <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
