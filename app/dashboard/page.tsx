"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUserId, setPendingTopic, setPendingSession } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import {
  ELEMENT_EMOJI,
  STEM_MAP,
  type Element,
} from "@/lib/saju-data"
import { cn } from "@/lib/utils"
import { TOPIC_CATEGORIES } from "@/lib/topic-data"
import { CHARACTERS, type CharacterId } from "@/lib/characters"
import { toast } from "sonner"

/* ── 타입 ── */

interface UserData {
  id: string
  display_name: string | null
  ilgan: string
  bokchae_count: number
  last_checkin_date: string | null
}

interface SessionItem {
  id: string
  title: string
  character_id: string
  updated_at: string
}

interface SajuProfileData {
  todayInteraction: string | null
}

/* ── 유틸 ── */

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "방금 전"
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}일 전`
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
}

function getIlganEmoji(ilgan: string): string {
  const char = ilgan?.[0]
  if (!char) return "⭐"
  const stem = STEM_MAP[char]
  if (!stem) return "⭐"
  return ELEMENT_EMOJI[stem.element] ?? "⭐"
}

/* ── 복채 패키지 ── */

const PACKAGES = [
  { id: "small", name: "소복채", count: 3, price: "₩1,000", emoji: "💰" },
  { id: "medium", name: "중복채", count: 5, price: "₩2,000", emoji: "💰💰" },
  { id: "large", name: "대복채", count: 10, price: "₩3,000", emoji: "💰💰💰" },
]

/* ── 메인 컴포넌트 ── */

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [profile, setProfile] = useState<SajuProfileData | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [checkinDone, setCheckinDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showEmptyModal, setShowEmptyModal] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)

  useEffect(() => {
    const userId = getUserId()
    if (!userId) {
      router.replace("/onboarding")
      return
    }

    // 유저 데이터 + 사주 프로필 병렬 로드
    Promise.all([
      fetch(`/api/user?id=${userId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/saju-profile?user_id=${userId}`).then(r => r.ok ? r.json() : null),
    ]).then(([userData, profileData]) => {
      if (userData?.user) {
        setUser(userData.user)
        setSessions(userData.sessions ?? [])
        // 오늘 이미 체크인했는지 확인
        const today = new Date().toISOString().slice(0, 10)
        if (userData.user.last_checkin_date === today) {
          setCheckinDone(true)
        }
      }
      if (profileData) setProfile(profileData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [router])

  async function handleCheckin() {
    if (!user || checkinDone) return
    setCheckinLoading(true)
    try {
      const res = await fetch("/api/bokchae/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await res.json()
      if (data.added) {
        setUser(prev => prev ? { ...prev, bokchae_count: data.count } : prev)
        setCheckinDone(true)
        setShowEmptyModal(false)
        toast.success("📅 출석 체크인 완료!", { description: `복채 +1 (총 ${data.count}개)`, duration: 2000 })
      } else {
        setCheckinDone(true)
      }
    } catch {
      toast.error("체크인에 실패했어요")
    }
    setCheckinLoading(false)
  }

  async function handleInlinePurchase(pkgId: string) {
    if (!user || purchaseLoading) return
    setPurchaseLoading(pkgId)
    try {
      const res = await fetch("/api/bokchae/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, package: pkgId }),
      })
      const data = await res.json()
      if (data.count !== undefined) {
        setUser(prev => prev ? { ...prev, bokchae_count: data.count } : prev)
        toast.success(`💰 복채 +${data.added}`, { description: `총 ${data.count}개`, duration: 2000 })
        setShowEmptyModal(false)
      }
    } catch {
      toast.error("충전에 실패했어요")
    } finally {
      setPurchaseLoading(null)
    }
  }

  function handleTopicClick(message: string) {
    if (user && user.bokchae_count <= 0) {
      setShowEmptyModal(true)
      return
    }
    if (message) setPendingTopic(message)
    router.push("/chat")
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8 animate-pulse">
        {/* 인사 헤더 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-40 rounded-lg bg-muted" />
            <div className="h-4 w-56 rounded bg-muted" />
          </div>
          <div className="h-6 w-20 rounded-full bg-muted" />
        </div>
        {/* 체크인 카드 */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-28 rounded bg-muted" />
              <div className="h-3 w-36 rounded bg-muted" />
            </div>
            <div className="h-8 w-16 rounded-md bg-muted" />
          </div>
        </div>
        {/* 최근 대화 */}
        <div className="space-y-3">
          <div className="h-5 w-24 rounded bg-muted" />
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-border bg-card px-4 py-3">
              <div className="h-4 rounded bg-muted" style={{ width: `${50 + i * 10}%` }} />
            </div>
          ))}
        </div>
        {/* 배너 */}
        <div className="h-20 rounded-2xl bg-muted" />
        {/* 코칭 카드 */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-16 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const ilganEmoji = getIlganEmoji(user.ilgan)
  const displayName = user.display_name || "사용자"
  const recentSessions = sessions.slice(0, 3)

  const hour = new Date().getHours()
  const greeting =
    hour < 6  ? "늦은 밤이에요, 오늘 하루도 고생했어요" :
    hour < 12 ? "좋은 아침이에요, 오늘 하루도 응원할게요" :
    hour < 18 ? "오후도 힘내요, 좋은 흐름이 함께해요" :
                "수고한 하루, 편안한 저녁 보내세요"

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">

      {/* ═══ 인사 헤더 ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {ilganEmoji} {displayName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{greeting}</p>
        </div>
        <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          💰 복채 {user.bokchae_count}
        </span>
      </div>

      {/* ═══ 출석 체크인 카드 ═══ */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">📅 출석 체크인</h2>
            <p className="text-xs text-muted-foreground mt-0.5">매일 1회, 복채 +1</p>
          </div>
          <Button
            size="sm"
            onClick={handleCheckin}
            disabled={checkinDone || checkinLoading}
          >
            {checkinLoading ? <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : checkinDone ? "완료" : "체크인"}
          </Button>
        </div>
      </div>

      {/* ═══ S1: 최근 대화 ═══ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">최근 대화</h2>
          {recentSessions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => router.push("/chat")}>
              전체 보기
            </Button>
          )}
        </div>
        {recentSessions.length > 0 ? (
          <div className="space-y-2">
            {recentSessions.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  setPendingSession(session.id)
                  router.push("/chat")
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="truncate text-sm font-medium flex items-center gap-1.5">
                  <span className="text-xs shrink-0">{CHARACTERS[session.character_id as CharacterId]?.emoji || "📜"}</span>
                  {session.title}
                </span>
                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(session.updated_at)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => router.push("/chat")}
            className="w-full rounded-2xl border border-dashed border-border bg-card p-6 text-center transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <p className="text-sm text-muted-foreground">아직 대화가 없어요</p>
            <p className="mt-1 text-sm font-medium text-primary">첫 상담 시작하기 →</p>
          </button>
        )}
      </section>

      {/* ═══ 배너: 오늘의 한마디 ═══ */}
      <button
        onClick={() => handleTopicClick("오늘 운세 봐줘")}
        className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-4 text-left text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]"
      >
        <span className="text-4xl">✨</span>
        <div>
          <p className="text-xs font-medium text-white/70">오늘의 한마디</p>
          <p className="mt-1 text-sm font-semibold leading-snug">
            오늘 하루, 어떤 기운이 감돌까요? 터치해서 확인해 보세요
          </p>
        </div>
      </button>

      {/* ═══ S2: 오늘의 코칭 ═══ */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">오늘의 코칭</h2>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </span>
          </div>
          {profile?.todayInteraction && (
            <p className="text-sm leading-relaxed text-foreground/80">
              {profile.todayInteraction}
            </p>
          )}
          <div className="grid grid-cols-4 gap-2">
            {[
              { emoji: "☀️", label: "오늘 운세",   bg: "bg-amber-50 dark:bg-amber-950/40",   message: "오늘 운세 봐줘" },
              { emoji: "💼", label: "오늘 업무",   bg: "bg-blue-50 dark:bg-blue-950/40",     message: "오늘 업무운이 궁금해" },
              { emoji: "❤️", label: "오늘 연애",   bg: "bg-rose-50 dark:bg-rose-950/40",     message: "오늘 연애운 어때?" },
              { emoji: "💰", label: "오늘 재물",   bg: "bg-emerald-50 dark:bg-emerald-950/40",message: "오늘 재물운 봐줘" },
              { emoji: "🤝", label: "오늘 대인",   bg: "bg-violet-50 dark:bg-violet-950/40", message: "오늘 대인관계운 알려줘" },
              { emoji: "🍀", label: "오늘 행운",   bg: "bg-green-50 dark:bg-green-950/40",   message: "오늘 행운의 시간대가 궁금해" },
              { emoji: "⚠️", label: "오늘 주의",   bg: "bg-orange-50 dark:bg-orange-950/40", message: "오늘 조심할 점 알려줘" },
              { emoji: "🌙", label: "내일 미리보기",bg: "bg-indigo-50 dark:bg-indigo-950/40", message: "내일 운세 미리 볼 수 있어?" },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => handleTopicClick(item.message)}
                className={cn(
                  "rounded-xl p-3 text-center transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]",
                  item.bg,
                )}
              >
                <span className="block text-2xl mb-1">{item.emoji}</span>
                <span className="text-[11px] font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 배너: 고민 상담 유도 ═══ */}
      <button
        onClick={() => handleTopicClick("요즘 고민이 있는데 사주로 방향을 찾고 싶어")}
        className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-4 text-left text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]"
      >
        <span className="text-4xl">🧭</span>
        <div>
          <p className="text-xs font-medium text-white/70">나만의 상담</p>
          <p className="mt-1 text-sm font-semibold leading-snug">
            요즘 고민이 있다면, 사주로 방향을 찾아볼까요?
          </p>
        </div>
      </button>

      {/* ═══ S3: 무엇이 궁금하세요? ═══ */}
      <section className="space-y-6">
        <h2 className="font-semibold text-lg">무엇이 궁금하세요?</h2>
        {TOPIC_CATEGORIES.map(category => (
          <div key={category.label}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">{category.emoji}</span>
              <h3 className="text-sm font-semibold">{category.label}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {category.cards.map(card => (
                <button
                  key={card.key}
                  onClick={() => handleTopicClick(card.message)}
                  className={cn(
                    "group cursor-pointer rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-1 active:scale-[0.97]",
                    card.key === "free"
                      ? "border border-dashed border-border bg-card hover:border-primary/40"
                      : card.bg,
                  )}
                >
                  <span className="mb-2 block text-3xl drop-shadow-sm">{card.emoji}</span>
                  <p className="text-[13px] font-medium leading-snug text-foreground">{card.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ═══ 배너: 나를 알아가는 시간 ═══ */}
      <button
        onClick={() => handleTopicClick("내 사주에서 가장 강한 기운이 뭐야? 성격이랑 어떻게 연결되는지 알려줘")}
        className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-4 text-left text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]"
      >
        <span className="text-4xl">🪞</span>
        <div>
          <p className="text-xs font-medium text-white/70">나를 알아가는 시간</p>
          <p className="mt-1 text-sm font-semibold leading-snug">
            내 사주 속 숨은 강점, 지금 확인해 볼까요?
          </p>
        </div>
      </button>

      {/* ═══ S4: 사주로 보는 나 ═══ */}
      <section className="space-y-4">
        <h2 className="font-semibold text-lg">사주로 보는 나</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { emoji: "🔥", label: "내 성격 깊이 보기", bg: "bg-rose-50 dark:bg-rose-950/40", message: "내 사주로 본 성격의 장단점을 알려줘" },
            { emoji: "🧬", label: "타고난 재능", bg: "bg-violet-50 dark:bg-violet-950/40", message: "내 사주에서 타고난 재능이나 적성이 뭐야?" },
            { emoji: "🔮", label: "올해의 흐름", bg: "bg-indigo-50 dark:bg-indigo-950/40", message: "올해 나한테 어떤 흐름이 오고 있어?" },
            { emoji: "🤝", label: "인간관계 패턴", bg: "bg-emerald-50 dark:bg-emerald-950/40", message: "내 사주로 본 인간관계 스타일이 궁금해" },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => handleTopicClick(item.message)}
              className={cn(
                "rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-1 active:scale-[0.97]",
                item.bg,
              )}
            >
              <span className="mb-2 block text-3xl drop-shadow-sm">{item.emoji}</span>
              <p className="text-[13px] font-medium leading-snug text-foreground">{item.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ 복채 인라인 충전 다이얼로그 ═══ */}
      {showEmptyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEmptyModal(false)}>
          <div className="mx-4 w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-1">
              <p className="text-4xl">💰</p>
              <h3 className="text-lg font-bold">복채가 없어요</h3>
              <p className="text-sm text-muted-foreground">질문 1개에 복채 1개가 필요해요</p>
            </div>

            {!checkinDone && (
              <button
                onClick={handleCheckin}
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

            <div className="rounded-xl bg-gradient-to-r from-amber-50/80 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 px-3 py-2 text-center">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">오픈 기념 무료 충전 이벤트</p>
            </div>

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
    </div>
  )
}
