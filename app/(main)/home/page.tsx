"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { loadProfile, loadConsultations, saveDailyAction, loadDailyAction } from "@/lib/storage"
import { getSuggestedQuestions } from "@/lib/suggestions"
import { CHARACTERS } from "@/lib/prompts"
import { ELEMENTS } from "@/lib/saju-data"
import type { DailyAction } from "@/lib/claude"
import type { StoredProfile, StoredConsultation } from "@/lib/storage"
import type { SuggestedQuestion } from "@/lib/suggestions"
import { Sparkles, ChevronRight, RefreshCw, AlertCircle } from "lucide-react"

const ELEMENT_EMOJI: Record<string, string> = {
  목: "🌿",
  화: "🔥",
  토: "🏔️",
  금: "⚔️",
  수: "🌊",
}

const TIMING_EMOJI: Record<string, string> = {
  아침: "🌅",
  점심: "☀️",
  저녁: "🌙",
  하루종일: "🕐",
}

export default function HomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StoredProfile | null>(null)
  const [dailyAction, setDailyAction] = useState<DailyAction | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([])
  const [recentConsults, setRecentConsults] = useState<StoredConsultation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setProfile(stored)
    setSuggestions(getSuggestedQuestions(stored.sajuProfile))
    setRecentConsults(loadConsultations().slice(0, 3))

    // 오늘의 한수 캐시 확인
    const cached = loadDailyAction()
    if (cached) {
      setDailyAction(cached)
    } else {
      fetchDailyAction(stored)
    }
  }, [router])

  async function fetchDailyAction(stored: StoredProfile) {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthInfo: stored.birthInfo }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "오늘의 한수를 생성하지 못했습니다")
      }

      const data = await res.json()
      setDailyAction(data.dailyAction)
      saveDailyAction(data.dailyAction)
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  const today = new Date()
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][today.getDay()]
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 ${dayOfWeek}요일`
  const { sajuProfile } = profile
  const dayStemName = sajuProfile.dayStem

  return (
    <div className="space-y-6 px-4 pt-6">
      {/* 날짜 헤더 */}
      <div>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
        <h1 className="text-xl font-bold tracking-tight">
          {dayStemName}일간님의 오늘
        </h1>
      </div>

      {/* 오늘의 한수 카드 */}
      <section className="rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/5 via-accent/10 to-accent/5 p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
          <h2 className="font-bold text-accent-foreground">오늘의 한수</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded bg-accent/20" />
            <div className="h-5 w-full animate-pulse rounded bg-accent/20" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-accent/20" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-accent/20" />
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => profile && fetchDailyAction(profile)}
              className="flex items-center gap-1.5 rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/10"
            >
              <RefreshCw className="h-3 w-3" />
              다시 시도
            </button>
          </div>
        ) : dailyAction ? (
          <div className="space-y-3">
            <p className="text-base font-medium leading-relaxed">
              &ldquo;{dailyAction.action}&rdquo;
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {dailyAction.reason}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium">
                {ELEMENT_EMOJI[dailyAction.element] || "✦"} {dailyAction.element}({ELEMENTS[dailyAction.element as keyof typeof ELEMENTS]?.name || dailyAction.element})
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium">
                {TIMING_EMOJI[dailyAction.timing] || "🕐"} {dailyAction.timing}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dailyAction.keyword.split(",").map((kw, i) => (
                <span key={i} className="text-xs text-accent-foreground/70">
                  #{kw.trim()}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* 오늘의 에너지 */}
      {sajuProfile.todayPillar && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">오늘의 에너지</h3>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center rounded-lg bg-primary/5 px-3 py-2">
              <span className="text-lg font-bold">{sajuProfile.todayPillar.pillar}</span>
              <span className="text-xs text-muted-foreground">{sajuProfile.todayPillar.pillarHanja}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {sajuProfile.todayPillar.stemElement}({ELEMENTS[sajuProfile.todayPillar.stemElement]?.name}) · {sajuProfile.todayPillar.yinYang}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {sajuProfile.todayInteraction}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 지금 고민 있나요? */}
      {suggestions.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">지금 고민 있나요?</h3>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((q, i) => (
              <Link
                key={i}
                href={`/ask?q=${encodeURIComponent(q.text)}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
              >
                <span className="text-lg">{q.emoji}</span>
                <span className="line-clamp-2 flex-1 text-xs leading-snug">{q.text}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 최근 상담 */}
      {recentConsults.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">최근 상담</h3>
            <Link href="/my" className="flex items-center gap-0.5 text-xs text-primary hover:underline">
              전체 <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentConsults.map((c) => {
              const char = CHARACTERS[c.characterType]
              const timeAgo = getTimeAgo(c.createdAt)
              return (
                <Link
                  key={c.id}
                  href="/my"
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-lg">{char.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{c.question}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                  </div>
                  {c.feedback && (
                    <span className="text-xs">
                      {c.feedback === "helpful" ? "👍" : c.feedback === "not_helpful" ? "👎" : "⏳"}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 하단 CTA */}
      {recentConsults.length === 0 && (
        <section className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">아직 상담 기록이 없어요</p>
          <Link
            href="/ask"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            첫 상담 시작하기
          </Link>
        </section>
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
}
