"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUserId, setPendingTopic } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import {
  ELEMENT_EMOJI,
  ELEMENT_COLORS,
  ELEMENT_BG,
  ELEMENTS,
  STEM_MAP,
  pillarToHanja,
  type Element,
} from "@/lib/saju-data"
import { cn } from "@/lib/utils"

/* ── 타입 ── */

interface UserData {
  id: string
  display_name: string | null
  saju_summary: string | null
  ilgan: string
  yeon_pillar: string
  wol_pillar: string
  il_pillar: string
  si_pillar: string | null
  bokjumoni_count: number
  last_checkin_date: string | null
}

interface SessionItem {
  id: string
  title: string
  updated_at: string
}

interface SajuProfileData {
  dayStem: string
  dayStemDescription: string
  elementCounts: Record<Element, number>
  dominantElement: Element
  weakestElement: Element
  usefulGod: Element
  usefulGodReason: string
  todayPillar: {
    pillar: string
    pillarHanja: string
    stemElement: Element
    branchElement: Element
  } | null
  todayInteraction: string | null
  yearAnimal: string | null
}

/* ── 빠른 상담 토픽 데이터 ── */

interface QuickTopic {
  emoji: string
  label: string
  message: string
}

const QUICK_TOPICS: QuickTopic[] = [
  { emoji: "💼", label: "이직 고민", message: "요즘 이직 고민이 있어" },
  { emoji: "❤️", label: "연애 운세", message: "연애 고민이 있어" },
  { emoji: "💰", label: "재물운", message: "재물운이 궁금해" },
  { emoji: "✨", label: "오늘 운세", message: "오늘 운세 봐줘" },
  { emoji: "🔥", label: "번아웃", message: "요즘 번아웃이 온 것 같아" },
  { emoji: "🧭", label: "진로 탐색", message: "내 적성이 궁금해" },
  { emoji: "👨‍👩‍👧", label: "가족 관계", message: "가족 관계 고민이 있어" },
  { emoji: "💬", label: "자유 상담", message: "" },
]

/* ── USP 배너 데이터 ── */

const USP_ITEMS = [
  { emoji: "💬", title: "대화로 코칭하는 사주", desc: "운세 보고서가 아닌, 실시간 대화형 코칭" },
  { emoji: "🧠", title: "지난 대화를 기억해요", desc: "세션을 넘어 누적되는 맥락 기반 상담" },
  { emoji: "📋", title: "사주 근거를 투명하게", desc: "매 응답마다 명리학 근거 시트 제공" },
]

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

/* ── 메인 컴포넌트 ── */

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [profile, setProfile] = useState<SajuProfileData | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [checkinDone, setCheckinDone] = useState(false)
  const [loading, setLoading] = useState(true)

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
      const res = await fetch("/api/bokjumoni/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await res.json()
      if (data.added) {
        setUser(prev => prev ? { ...prev, bokjumoni_count: data.count } : prev)
        setCheckinDone(true)
      } else {
        setCheckinDone(true)
      }
    } catch { /* ignore */ }
    setCheckinLoading(false)
  }

  function handleTopicClick(message: string) {
    if (message) setPendingTopic(message)
    router.push("/chat")
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  const ilganEmoji = getIlganEmoji(user.ilgan)
  const displayName = user.display_name || "사용자"
  const recentSessions = sessions.slice(0, 3)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">

      {/* ── 인사 헤더 ── */}
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">
          {ilganEmoji} {displayName}님, 오늘도 폴라리스가 함께해요
        </h1>
        {user.saju_summary && (
          <p className="text-muted-foreground text-sm">{user.saju_summary}</p>
        )}
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            👜 복주머니 {user.bokjumoni_count}개
          </span>
          {!checkinDone && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckin}
              disabled={checkinLoading}
              className="h-6 text-xs px-2"
            >
              {checkinLoading ? "..." : "📅 출석 체크인 (+1)"}
            </Button>
          )}
        </div>
      </section>

      {/* ── 오늘의 운세 카드 ── */}
      {profile?.todayPillar && (
        <section className="saju-card-border rounded-2xl p-6 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">📅 오늘의 일진</h2>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </span>
          </div>

          {/* 일진 간지 표시 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gold-gradient">
                {profile.todayPillar.pillarHanja}
              </span>
              <span className="text-lg text-muted-foreground">
                ({profile.todayPillar.pillar})
              </span>
            </div>
            <div className="flex gap-1.5">
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                ELEMENT_BG[profile.todayPillar.stemElement],
                ELEMENT_COLORS[profile.todayPillar.stemElement],
              )}>
                {ELEMENT_EMOJI[profile.todayPillar.stemElement]} {ELEMENTS[profile.todayPillar.stemElement].name}
              </span>
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                ELEMENT_BG[profile.todayPillar.branchElement],
                ELEMENT_COLORS[profile.todayPillar.branchElement],
              )}>
                {ELEMENT_EMOJI[profile.todayPillar.branchElement]} {ELEMENTS[profile.todayPillar.branchElement].name}
              </span>
            </div>
          </div>

          {/* 오행 상호작용 해석 */}
          {profile.todayInteraction && (
            <p className="text-sm leading-relaxed text-foreground/80">
              {profile.todayInteraction}
            </p>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => handleTopicClick("오늘 운세 봐줘")}
          >
            💬 오늘의 운세 자세히 상담하기
          </Button>
        </section>
      )}

      {/* ── 빠른 상담 토픽 ── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-lg">💬 무엇이 궁금하세요?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_TOPICS.map(topic => (
            <button
              key={topic.label}
              onClick={() => handleTopicClick(topic.message)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <span className="text-2xl">{topic.emoji}</span>
              <span className="text-xs font-medium text-foreground">{topic.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 최근 대화 ── */}
      {recentSessions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">🕐 최근 대화</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/chat")}>
              전체 보기
            </Button>
          </div>
          <div className="space-y-2">
            {recentSessions.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  localStorage.setItem("polaris_current_session_id", session.id)
                  router.push("/chat")
                }}
                className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="truncate text-sm font-medium">{session.title}</span>
                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(session.updated_at)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 사주 프로필 미니 ── */}
      {profile && (
        <section className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">🔮 나의 사주 프로필</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/mypage")}>
              상세 리포트
            </Button>
          </div>

          {/* 일간 + 사주 4기둥 */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-3xl">{ilganEmoji}</span>
              <p className="text-xs text-muted-foreground mt-1">{user.ilgan} 일간</p>
            </div>
            <div className="flex gap-2">
              {[
                { label: "년", pillar: user.yeon_pillar },
                { label: "월", pillar: user.wol_pillar },
                { label: "일", pillar: user.il_pillar },
                ...(user.si_pillar ? [{ label: "시", pillar: user.si_pillar }] : []),
              ].map(p => (
                <div key={p.label} className="text-center rounded-lg bg-muted/50 px-3 py-2">
                  <div className="text-xs text-muted-foreground">{p.label}주</div>
                  <div className="text-sm font-bold">{pillarToHanja(p.pillar)}</div>
                  <div className="text-xs text-muted-foreground">{p.pillar}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 오행 분포 바 */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">오행 분포</p>
            <div className="flex gap-1 h-5 rounded-full overflow-hidden">
              {(Object.entries(profile.elementCounts) as [Element, number][])
                .filter(([, v]) => v > 0)
                .map(([el, count]) => {
                  const total = Object.values(profile.elementCounts).reduce((a, b) => a + b, 0)
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div
                      key={el}
                      className={cn("flex items-center justify-center text-[10px] font-bold", ELEMENT_BG[el], ELEMENT_COLORS[el])}
                      style={{ width: `${pct}%` }}
                      title={`${ELEMENTS[el].name} ${pct}%`}
                    >
                      {pct >= 15 && `${ELEMENT_EMOJI[el]}${pct}%`}
                    </div>
                  )
                })}
            </div>
          </div>

          {/* 용신 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">용신:</span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ELEMENT_BG[profile.usefulGod], ELEMENT_COLORS[profile.usefulGod])}>
              {ELEMENT_EMOJI[profile.usefulGod]} {ELEMENTS[profile.usefulGod].name}
            </span>
            <span className="text-muted-foreground text-xs truncate">{profile.usefulGodReason}</span>
          </div>
        </section>
      )}

      {/* ── USP 배너 ── */}
      <section className="grid gap-3 sm:grid-cols-3">
        {USP_ITEMS.map(item => (
          <div
            key={item.title}
            className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-1.5"
          >
            <div className="text-xl">{item.emoji}</div>
            <h3 className="font-semibold text-sm">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
