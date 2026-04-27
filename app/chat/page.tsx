"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getUserId, getPendingTopic, getCurrentSessionId, setCurrentSessionId } from "@/lib/storage"
import MessageList, { type ChatMessage } from "@/components/chat/MessageList"
import MessageInput from "@/components/chat/MessageInput"
import SajuSidebar, { type DailyFortune } from "@/components/chat/SajuSidebar"
import SajuInfoPanel from "@/components/chat/SajuInfoPanel"
import { Button } from "@/components/ui/button"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronDown, ChevronLeft, Share2, Check, User } from "lucide-react"
import { getIlganElement, ELEMENT_EMOJI } from "@/lib/saju-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  bokchae_count: number
  last_checkin_date: string | null
}

const PACKAGES = [
  { id: "small", name: "소복채", count: 3, price: "₩1,000", emoji: "🧧" },
  { id: "medium", name: "중복채", count: 5, price: "₩2,000", emoji: "🧧🧧" },
  { id: "large", name: "대복채", count: 10, price: "₩3,500", emoji: "🧧🧧🧧" },
]

interface SessionItem {
  id: string
  title: string
  created_at: string
  updated_at: string
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return "방금"
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function BokchaeBadge({ count, animating }: { count: number; animating: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300 transition-all duration-300 cursor-help",
            animating && "scale-110 ring-2 ring-amber-400/50"
          )}
          style={animating ? { animation: "shake 0.5s ease-in-out" } : undefined}
        >
          <span className="text-base">🧧</span> {count}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>질문 1개 = 복채 1개</p>
      </TooltipContent>
    </Tooltip>
  )
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
  const [bokchaeCount, setBokchaeCount] = useState<number>(0)
  const [showEmptyModal, setShowEmptyModal] = useState(false)
  const [mobileDeleteTarget, setMobileDeleteTarget] = useState<SessionItem | null>(null)
  const [bokchaeAnimating, setBokchaeAnimating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [dailyFortune, setDailyFortune] = useState<DailyFortune | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [checkinDone, setCheckinDone] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  // 일일 운세 로드 (localStorage 캐시)
  async function fetchDailyFortune(userData: UserData) {
    const todayKey = new Date().toISOString().slice(0, 10)
    const cacheKey = `daily-fortune-${userData.id}-${todayKey}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        setDailyFortune(JSON.parse(cached))
        return
      } catch { /* 캐시 파싱 실패 시 재요청 */ }
    }

    try {
      const res = await fetch("/api/daily-fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ilgan: userData.ilgan,
          pillars: {
            yeon: userData.yeon_pillar,
            wol: userData.wol_pillar,
            il: userData.il_pillar,
            si: userData.si_pillar,
          },
          daeun_current: userData.daeun_current,
          display_name: userData.display_name,
        }),
      })
      const data = await res.json()
      if (data.coaching) {
        setDailyFortune(data)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      }
    } catch {
      // 실패 시 무시
    }
  }

  // AI 추천 질문 요청
  async function fetchSuggestions(msgs: ChatMessage[]) {
    setSuggestionsLoading(true)
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs.map(m => ({ role: m.role, content: m.content })),
          user_context: user ? `${user.display_name}, 일간: ${user.ilgan}` : undefined,
        }),
      })
      const data = await res.json()
      if (data.suggestions?.length) setSuggestions(data.suggestions)
    } catch {
      // 실패 시 무시
    } finally {
      setSuggestionsLoading(false)
    }
  }

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
      setBokchaeCount(u.bokchae_count ?? 0)
      const today = new Date().toISOString().slice(0, 10)
      setCheckinDone(u.last_checkin_date === today)
      fetchDailyFortune(u)
      const loadedSessions: SessionItem[] = sessionData ?? []
      setSessions(loadedSessions)

      // 현재 세션 결정
      const pendingTopic = getPendingTopic()
      const savedSessionId = getCurrentSessionId()

      if (pendingTopic) {
        // 랜딩 카드 → 새 세션 생성 후 자동 전송
        const topicTitle = pendingTopic.length > 30 ? pendingTopic.slice(0, 30) + "..." : pendingTopic
        const session = await createNewSession(id, topicTitle)
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
  async function createNewSession(userId: string, title?: string): Promise<SessionItem> {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...(title && { title }) }),
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

    // 마지막 메시지가 AI 응답이면 추천 질문 복원
    if (loadedMessages.length > 0 && loadedMessages[loadedMessages.length - 1].role === "assistant") {
      fetchSuggestions(loadedMessages)
    } else {
      setSuggestions([])
    }
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

  // 세션 삭제
  async function handleSessionDelete(sessionId: string) {
    if (isStreaming) return
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("삭제 실패")

      const remaining = sessions.filter(s => s.id !== sessionId)
      setSessions(remaining)

      // 현재 보고 있던 세션을 삭제한 경우
      if (sessionId === currentSessionId) {
        if (remaining.length > 0) {
          await loadSessionMessages(remaining[0].id)
        } else {
          // 세션이 모두 없어짐 → 새 세션 생성
          if (userId) {
            const session = await createNewSession(userId)
            requestGreeting(userId, session.id, [])
          }
        }
      }
    } catch (err) {
      console.error("세션 삭제 실패:", err)
      toast.error("대화 삭제에 실패했어요")
    }
  }

  async function handleDeleteAllSessions() {
    if (isStreaming) return
    try {
      await Promise.all(sessions.map(s => fetch(`/api/sessions?id=${s.id}`, { method: "DELETE" })))
      setSessions([])
      if (userId) {
        const session = await createNewSession(userId)
        requestGreeting(userId, session.id, [])
      }
    } catch (err) {
      console.error("전체 삭제 실패:", err)
    }
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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 402 || errData.error === "bokchae_empty") {
          setBokchaeCount(0)
          setShowEmptyModal(true)
          setMessages(currentMessages)
          setIsStreaming(false)
          return
        }
        throw new Error("채팅 요청 실패")
      }
      setBokchaeCount(prev => Math.max(0, prev - 1))
      setBokchaeAnimating(true)
      toast("🧧 복채 -1", { description: `남은 복채: ${bokchaeCount - 1}개`, duration: 2000 })
      setTimeout(() => setBokchaeAnimating(false), 600)
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

  // 토픽 메뉴에서 선택
  async function handleTopicFromMenu(message: string) {
    if (!userId || isStreaming || !message) return
    if (bokchaeCount <= 0) { setShowEmptyModal(true); return }
    const title = message.length > 30 ? message.slice(0, 30) + "..." : message
    const session = await createNewSession(userId, title)
    await autoSendTopic(userId, session.id, message, [])
  }

  // 메시지 전송
  const handleSend = useCallback(async (text: string) => {
    if (!userId || !currentSessionId || isStreaming) return

    // 복채 클라이언트 프리체크
    if (bokchaeCount <= 0) {
      setShowEmptyModal(true)
      return
    }

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setSuggestions([])
    setIsStreaming(true)

    // 첫 유저 메시지면 세션 제목 즉시 업데이트
    if (!messages.some(m => m.role === "user")) {
      const title = text.length > 30 ? text.slice(0, 30) + "..." : text
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s))
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, session_id: currentSessionId, message: text }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        // 402: 복채 부족
        if (res.status === 402 || errData.error === "bokchae_empty") {
          setBokchaeCount(0)
          setShowEmptyModal(true)
          setMessages(prev => prev.filter(m => m.id !== userMsg.id))
          setIsStreaming(false)
          return
        }
        console.error("채팅 API 에러:", res.status, errData)
        throw new Error(errData.error || "채팅 요청 실패")
      }

      // 성공 시 복채 낙관적 차감
      setBokchaeCount(prev => Math.max(0, prev - 1))
      setBokchaeAnimating(true)
      toast("🧧 복채 -1", { description: `남은 복채: ${bokchaeCount - 1}개`, duration: 2000 })
      setTimeout(() => setBokchaeAnimating(false), 600)

      await readStream(res, updatedMessages)
    } catch (err) {
      console.error("메시지 전송 실패:", err)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "미안, 지금 좀 연결이 불안정해. 잠시 후에 다시 말해줄래?",
      }])
    }
    setIsStreaming(false)
  }, [userId, currentSessionId, isStreaming, messages, bokchaeCount])

  // SSE 스트리밍 읽기
  async function readStream(res: Response, currentMessages: ChatMessage[]) {
    const reader = res.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let assistantContent = ""
    let basis: ChatMessage["basis"] = undefined
    const assistantId = `assistant-${Date.now()}`

    // 통일된 메시지 업데이트: 이미 존재하면 교체, 없으면 추가
    const upsertMsg = (msg: ChatMessage) => {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.id === assistantId) return [...prev.slice(0, -1), msg]
        return [...prev, msg]
      })
    }

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
          if (parsed.meta) {
            if (parsed.meta.basis) basis = parsed.meta.basis
            if (parsed.meta.cleanText) assistantContent = parsed.meta.cleanText
            upsertMsg({ id: assistantId, role: "assistant", content: assistantContent, ...(basis ? { basis } : {}) })
            continue
          }
          if (parsed.error) {
            console.error("스트리밍 에러:", parsed.error)
            assistantContent = "미안, 지금 연결에 문제가 생겼어. 잠시 후에 다시 말해줄래?"
            upsertMsg({ id: assistantId, role: "assistant", content: assistantContent })
            return
          }
          if (parsed.text) {
            assistantContent += parsed.text
            upsertMsg({ id: assistantId, role: "assistant", content: assistantContent })
          }
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    }

    // 스트리밍 완료 후 AI 추천 질문 비동기 요청
    if (assistantContent) {
      const finalMessages = [...currentMessages, { id: assistantId, role: "assistant" as const, content: assistantContent }]
      fetchSuggestions(finalMessages)
    }
  }

  // 인라인 체크인
  async function handleInlineCheckin() {
    if (!userId || checkinLoading || checkinDone) return
    setCheckinLoading(true)
    try {
      const res = await fetch("/api/bokchae/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (data.added) {
        setBokchaeCount(data.count)
        setCheckinDone(true)
        setShowEmptyModal(false)
        toast.success("📅 출석 체크인 완료!", { description: `복채 +1 (총 ${data.count}개)`, duration: 2000 })
      } else {
        setCheckinDone(true)
      }
    } catch {
      toast.error("체크인에 실패했어요")
    } finally {
      setCheckinLoading(false)
    }
  }

  // 인라인 패키지 구매
  async function handleInlinePurchase(pkgId: string) {
    if (!userId || purchaseLoading) return
    setPurchaseLoading(pkgId)
    try {
      const res = await fetch("/api/bokchae/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, package: pkgId }),
      })
      const data = await res.json()
      if (data.count !== undefined) {
        setBokchaeCount(data.count)
        toast.success(`🧧 복채 +${data.added}`, { description: `총 ${data.count}개`, duration: 2000 })
        setShowEmptyModal(false)
      }
    } catch {
      toast.error("충전에 실패했어요")
    } finally {
      setPurchaseLoading(null)
    }
  }

  async function handleShare() {
    if (!currentSessionId || shareLoading) return
    setShareLoading(true)
    try {
      const res = await fetch(`/api/sessions/${currentSessionId}/share`, { method: "POST" })
      const { share_token } = await res.json()
      const url = `${window.location.origin}/share/${share_token}`
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      toast.success("공유 링크가 복사되었습니다!", { description: "친구에게 보내보세요", duration: 2000 })
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      toast.error("공유 링크 생성에 실패했어요")
    } finally {
      setShareLoading(false)
    }
  }

  function handleReset() {
    router.replace("/")
  }

  if (!user || isInitializing) {
    return (
      <div className="flex min-h-svh animate-pulse">
        {/* 사이드바 스켈레톤 (데스크톱) */}
        <div className="hidden md:flex w-72 flex-col border-r border-border bg-card p-4 space-y-4">
          <div className="h-8 w-32 rounded-lg bg-muted" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
        {/* 채팅 영역 스켈레톤 */}
        <div className="flex-1 flex flex-col">
          <div className="h-12 border-b border-border bg-card" />
          <div className="flex-1 p-4 space-y-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
              <div className="h-16 w-2/3 rounded-2xl bg-muted" />
            </div>
            <div className="flex gap-3 justify-end">
              <div className="h-10 w-1/2 rounded-2xl bg-muted" />
            </div>
          </div>
          <div className="p-3 pb-6">
            <div className="mx-auto max-w-3xl h-[52px] rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  // 오행 아바타 이모지
  const element = getIlganElement(user.ilgan)
  const mobileAvatarEmoji = element ? ELEMENT_EMOJI[element] : "⭐"

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
    onSessionDelete: handleSessionDelete,
    onDeleteAllSessions: handleDeleteAllSessions,
    onReset: handleReset,
    dailyFortune,
  }

  const currentSessionTitle = sessions.find(s => s.id === currentSessionId)?.title || "새 대화"

  // 추천 질문 표시 조건: AI 응답 후 (로딩 중이거나 추천 질문이 있을 ��)
  const showSuggestions = (suggestions.length > 0 || suggestionsLoading) &&
    messages.length > 0 && messages[messages.length - 1].role === "assistant" && !isStreaming

  return (
    <div className="h-[calc(100svh-49px)]">
      {/* 데스크탑: Resizable */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize="25%" minSize="18%" maxSize="40%" collapsible collapsedSize="0%">
            <SajuSidebar {...sidebarProps} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="75%" minSize="50%">
            <div className="flex h-full flex-col">
              {/* 데스크탑 헤더 */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="p-1 -ml-1 rounded-md hover:bg-muted transition-colors"
                    aria-label="대시보드로 돌아가기"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground/60" />
                  </button>
                  <span className="text-sm font-semibold text-foreground/80">사주 상담방</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleShare}
                        disabled={shareLoading || !currentSessionId}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {shareCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{shareCopied ? "복사됨!" : "이 대화 공유하기"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <BokchaeBadge count={bokchaeCount} animating={bokchaeAnimating} />
                </div>
              </div>
              <MessageList messages={messages} isStreaming={isStreaming} ilgan={user.ilgan} displayName={user.display_name || undefined} scrollTrigger={suggestions.length} />
              <MessageInput onSend={handleSend} onTopicSelect={handleTopicFromMenu} disabled={isStreaming} showSuggestions={showSuggestions} suggestions={suggestions} suggestionsLoading={suggestionsLoading} />
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
              onClick={() => router.push("/dashboard")}
              className="p-1 -ml-1 rounded-md hover:bg-muted transition-colors shrink-0"
              aria-label="대시보드로 돌아가기"
            >
              <ChevronLeft className="h-5 w-5 text-foreground/60" />
            </button>
            <button
              onClick={() => setMobileSessionListOpen(true)}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <span className="text-sm shrink-0">💬</span>
              <span className="text-sm font-medium truncate">{currentSessionTitle}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
            <span className="ml-2 shrink-0">
              <BokchaeBadge count={bokchaeCount} animating={bokchaeAnimating} />
            </span>
            <button
              onClick={handleShare}
              disabled={shareLoading || !currentSessionId}
              className="ml-1 p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              {shareCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Share2 className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={handleNewChat}
              className="ml-1 p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-sm">➕</span>
            </button>
          </div>

          {/* 내 정보 보기 버튼 */}
          <button
            onClick={() => setMobileInfoOpen(true)}
            className="flex items-center gap-2 w-full rounded-lg bg-muted/50 px-3 py-2 hover:bg-muted transition-colors"
          >
            <span className="text-sm">{mobileAvatarEmoji}</span>
            <span className="text-xs font-medium flex-1 text-left truncate text-foreground/80">
              {user.saju_summary || "내 정보 · 오늘의 한수"}
            </span>
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* 모바일 세션 목록 Sheet */}
        <Sheet open={mobileSessionListOpen} onOpenChange={setMobileSessionListOpen}>
          <SheetContent side="left" className="w-[320px]" aria-describedby={undefined}>
            <SheetHeader>
              <SheetTitle>대화 목록</SheetTitle>
            </SheetHeader>
            <div className="space-y-1 mt-4 px-4">
              <button
                onClick={() => {
                  handleNewChat()
                  setMobileSessionListOpen(false)
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors flex items-center gap-2"
              >
                ➕ 새 대화
              </button>
              {sessions.map(session => (
                <div key={session.id} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      handleSessionSwitch(session.id)
                      setMobileSessionListOpen(false)
                    }}
                    className={cn(
                      "flex-1 text-left px-3 py-2 rounded-lg transition-colors min-w-0",
                      session.id === currentSessionId
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <p className={cn("text-sm truncate", session.id === currentSessionId && "font-medium")}>
                      {session.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {formatRelativeTime(session.updated_at || session.created_at)}
                    </p>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="shrink-0 p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 text-xs"
                        onClick={() => setMobileDeleteTarget(session)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        대화 삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* 모바일 내 정보 Sheet */}
        <Sheet open={mobileInfoOpen} onOpenChange={setMobileInfoOpen}>
          <SheetContent side="right" className="w-[320px] overflow-y-auto" aria-describedby={undefined}>
            <SheetHeader>
              <SheetTitle>내 정보</SheetTitle>
            </SheetHeader>
            <div className="mt-4 px-4">
              <SajuInfoPanel
                displayName={user.display_name}
                pillars={{
                  yeon: user.yeon_pillar,
                  wol: user.wol_pillar,
                  il: user.il_pillar,
                  si: user.si_pillar,
                }}
                birthYear={user.birth_year}
                birthMonth={user.birth_month}
                birthDay={user.birth_day}
                birthHour={user.birth_hour}
                isLunar={user.is_lunar}
                gender={user.gender}
                ilgan={user.ilgan}
                daeunCurrent={user.daeun_current}
                dailyFortune={dailyFortune}
              />
            </div>
          </SheetContent>
        </Sheet>

        <MessageList messages={messages} isStreaming={isStreaming} ilgan={user.ilgan} displayName={user.display_name || undefined} scrollTrigger={suggestions.length} />
        <MessageInput onSend={handleSend} onTopicSelect={handleTopicFromMenu} disabled={isStreaming} showSuggestions={showSuggestions} suggestions={suggestions} suggestionsLoading={suggestionsLoading} />
      </div>

      {/* 복채 인라인 충전 다이얼로그 */}
      {showEmptyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEmptyModal(false)}>
          <div className="mx-4 w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-1">
              <p className="text-4xl">🧧</p>
              <h3 className="text-lg font-bold">복채가 없어요</h3>
              <p className="text-sm text-muted-foreground">질문 1개에 복채 1개가 필요해요</p>
            </div>

            {/* 출석 체크인 */}
            {!checkinDone && (
              <button
                onClick={handleInlineCheckin}
                disabled={checkinLoading}
                className="w-full flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 px-4 py-3 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📅</span>
                  <div className="text-left">
                    <p className="text-sm font-medium">출석 체크인</p>
                    <p className="text-xs text-muted-foreground">매일 무료 +1</p>
                  </div>
                </div>
                {checkinLoading ? (
                  <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">무료</span>
                )}
              </button>
            )}

            {/* 이벤트 배너 */}
            <div className="rounded-xl bg-gradient-to-r from-amber-50/80 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 px-3 py-2 text-center">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">🎉 오픈 기념 무료 충전 이벤트</p>
            </div>

            {/* 패키지 그리드 */}
            <div className="grid grid-cols-3 gap-2">
              {PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handleInlinePurchase(pkg.id)}
                  disabled={!!purchaseLoading}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 p-3 transition-all disabled:opacity-50"
                >
                  <span className="text-lg">{pkg.emoji}</span>
                  <p className="text-xs font-semibold">{pkg.name}</p>
                  <p className="text-lg font-bold text-primary">{pkg.count}개</p>
                  <p className="text-[10px] text-muted-foreground line-through">{pkg.price}</p>
                  {purchaseLoading === pkg.id ? (
                    <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">무료 충전</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-sm text-muted-foreground"
                onClick={() => setShowEmptyModal(false)}
              >
                닫기
              </Button>
              <Button
                className="flex-1 text-sm"
                onClick={() => router.push("/bokchae")}
              >
                상점 가기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 세션 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!mobileDeleteTarget} onOpenChange={(open) => !open && setMobileDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대화를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{mobileDeleteTarget?.title}&rdquo; 대화가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (mobileDeleteTarget) {
                  handleSessionDelete(mobileDeleteTarget.id)
                  if (mobileDeleteTarget.id === currentSessionId) {
                    setMobileSessionListOpen(false)
                  }
                  setMobileDeleteTarget(null)
                }
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
