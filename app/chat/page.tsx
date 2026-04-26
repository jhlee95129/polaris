"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getUserId, getPendingTopic, getCurrentSessionId, setCurrentSessionId } from "@/lib/storage"
import MessageList, { type ChatMessage } from "@/components/chat/MessageList"
import MessageInput from "@/components/chat/MessageInput"
import SajuSidebar from "@/components/chat/SajuSidebar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ChevronDown, ChevronUp, Plus, Star, MessageCircle } from "lucide-react"
import { pillarToHanja, getIlganElement, ELEMENT_COLORS } from "@/lib/saju-data"
import { TreePine, Flame, Mountain, Gem, Droplets, type LucideIcon } from "lucide-react"
import type { Element } from "@/lib/saju-data"
import { cn } from "@/lib/utils"

const ELEMENT_ICON: Record<Element, LucideIcon> = {
  목: TreePine, 화: Flame, 토: Mountain, 금: Gem, 수: Droplets,
}

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

interface SessionItem {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const [userId, setUserIdState] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null)
  const [mobileSessionListOpen, setMobileSessionListOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // 초기 로드
  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace("/")
      return
    }
    setUserIdState(id)
    loadUserAndSessions(id)
  }, [router])

  async function loadUserAndSessions(id: string) {
    try {
      const res = await fetch(`/api/user?id=${id}`)
      if (!res.ok) {
        router.replace("/onboarding")
        return
      }

      const { user: userData, sessions: sessionData } = await res.json()
      const u = userData as UserData
      setUser(u)
      const loadedSessions: SessionItem[] = sessionData ?? []
      setSessions(loadedSessions)

      // 현재 세션 결정
      const pendingTopic = getPendingTopic()
      const savedSessionId = getCurrentSessionId()

      if (pendingTopic) {
        // 랜딩 카드 → 새 세션 생성 후 자동 전송
        const session = await createNewSession(id)
        setIsInitializing(false)
        await autoSendTopic(id, session.id, pendingTopic, [])
      } else if (savedSessionId && loadedSessions.some(s => s.id === savedSessionId)) {
        // 저장된 세션 복원
        await loadSessionMessages(savedSessionId)
        setIsInitializing(false)
      } else if (loadedSessions.length > 0) {
        // 가장 최근 세션 로드
        await loadSessionMessages(loadedSessions[0].id)
        setIsInitializing(false)
      } else {
        // 세션 없음 → 새 세션 생성 + greeting
        const session = await createNewSession(id)
        setIsInitializing(false)
        requestGreeting(id, session.id, [])
      }
    } catch {
      router.replace("/onboarding")
    }
  }

  // 새 세션 생성
  async function createNewSession(userId: string): Promise<SessionItem> {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    })
    const { session } = await res.json()
    setSessions(prev => [session, ...prev])
    setCurrentSessionIdState(session.id)
    setCurrentSessionId(session.id)
    setMessages([])
    return session
  }

  // 세션 메시지 로드
  async function loadSessionMessages(sessionId: string) {
    setCurrentSessionIdState(sessionId)
    setCurrentSessionId(sessionId)

    const res = await fetch(`/api/sessions/${sessionId}/messages`)
    const { messages: msgData } = await res.json()

    const fallbackBasis: ChatMessage["basis"] = user ? {
      ilgan: user.ilgan,
      ilganChunk: null,
      pillars: { yeon: user.yeon_pillar, wol: user.wol_pillar, il: user.il_pillar, si: user.si_pillar },
      daeun: user.daeun_current || null,
    } : undefined

    const loadedMessages: ChatMessage[] = (msgData ?? []).map((m: { id: string; role: string; content: string; metadata?: { basis?: ChatMessage["basis"] } | null }) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      ...(m.role === "assistant" ? { basis: m.metadata?.basis ?? fallbackBasis } : {}),
    }))
    setMessages(loadedMessages)
  }

  // 새 대화 버튼
  async function handleNewChat() {
    if (!userId || isStreaming) return
    const session = await createNewSession(userId)
    requestGreeting(userId, session.id, [])
  }

  // 세션 전환
  async function handleSessionSwitch(sessionId: string) {
    if (sessionId === currentSessionId || isStreaming) return
    await loadSessionMessages(sessionId)
  }

  // 인사 요청
  async function requestGreeting(id: string, sessionId: string, currentMessages: ChatMessage[]) {
    setIsStreaming(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, session_id: sessionId, greeting: true }),
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

      await readStream(res, currentMessages)
    } catch (err) {
      console.error("인사 요청 실패:", err)
    }
    setIsStreaming(false)
  }

  // 주제 카드 → 자동 전송
  async function autoSendTopic(id: string, sessionId: string, text: string, currentMessages: ChatMessage[]) {
    const userMsg: ChatMessage = { id: `temp-${Date.now()}`, role: "user", content: text }
    const updatedMessages = [...currentMessages, userMsg]
    setMessages(updatedMessages)
    setIsStreaming(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, session_id: sessionId, message: text }),
      })
      if (!res.ok) throw new Error("채팅 요청 실패")
      await readStream(res, updatedMessages)

      // 세션 제목 업데이트
      const title = text.length > 30 ? text.slice(0, 30) + "..." : text
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s))
    } catch (err) {
      console.error("자동 전송 실패:", err)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "미안, 지금 좀 연결이 불안정해. 잠시 후에 다시 말해줄래?",
      }])
    }
    setIsStreaming(false)
  }

  // 메시지 전송
  const handleSend = useCallback(async (text: string) => {
    if (!userId || !currentSessionId || isStreaming) return

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
        body: JSON.stringify({ user_id: userId, session_id: currentSessionId, message: text }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error("채팅 API 에러:", res.status, errData)
        throw new Error(errData.error || "채팅 요청 실패")
      }

      await readStream(res, updatedMessages)

      // 첫 메시지면 세션 제목 업데이트
      if (messages.length === 0) {
        const title = text.length > 30 ? text.slice(0, 30) + "..." : text
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s))
      }
    } catch (err) {
      console.error("메시지 전송 실패:", err)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "미안, 지금 좀 연결이 불안정해. 잠시 후에 다시 말해줄래?",
      }])
    }
    setIsStreaming(false)
  }, [userId, currentSessionId, isStreaming, messages])

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

  function handleReset() {
    router.replace("/")
  }

  if (!user || isInitializing) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    )
  }

  // 오행 아바타 아이콘
  const element = getIlganElement(user.ilgan)
  const MobileAvatarIcon = element ? ELEMENT_ICON[element] : Star
  const mobileAvatarColor = element ? ELEMENT_COLORS[element] : "text-primary"

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
    sessions,
    currentSessionId,
    onSessionSwitch: handleSessionSwitch,
    onNewChat: handleNewChat,
    onReset: handleReset,
  }

  const currentSessionTitle = sessions.find(s => s.id === currentSessionId)?.title || "새 대화"

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
              <MessageList messages={messages} isStreaming={isStreaming} ilgan={user.ilgan} />
              <MessageInput onSend={handleSend} disabled={isStreaming} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 모바일 */}
      <div className="md:hidden flex flex-col h-full">
        <div className="border-b border-border bg-card/50 px-4 py-3 space-y-2">
          {/* 세션 제목 + 새 대화 */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileSessionListOpen(true)}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">{currentSessionTitle}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
            <button
              onClick={handleNewChat}
              className="ml-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* 사주 정보 토글 */}
          <button
            onClick={() => setMobileInfoOpen(!mobileInfoOpen)}
            className="flex items-center gap-2 w-full"
          >
            <MobileAvatarIcon className={`h-4 w-4 ${mobileAvatarColor}`} />
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
            <div className="space-y-2">
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
                  현재 대운: <span className="font-medium text-foreground">{user.daeun_current}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* 모바일 세션 목록 Sheet */}
        <Sheet open={mobileSessionListOpen} onOpenChange={setMobileSessionListOpen}>
          <SheetContent side="left" className="w-[280px]">
            <SheetHeader>
              <SheetTitle>대화 목록</SheetTitle>
            </SheetHeader>
            <div className="space-y-1 mt-4">
              <button
                onClick={() => {
                  handleNewChat()
                  setMobileSessionListOpen(false)
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                새 대화
              </button>
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => {
                    handleSessionSwitch(session.id)
                    setMobileSessionListOpen(false)
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate",
                    session.id === currentSessionId
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {session.title}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <MessageList messages={messages} isStreaming={isStreaming} ilgan={user.ilgan} />
        <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
