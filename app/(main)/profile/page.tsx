"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { loadProfile, clearProfile, type StoredProfile } from "@/lib/storage"
import type { ProfileSummary } from "@/lib/claude"
import { ELEMENTS, type Element } from "@/lib/saju-data"
import { RefreshCw, LogOut, Sparkles, Sun } from "lucide-react"

const ELEMENT_COLORS: Record<Element, string> = {
  목: "bg-green-500",
  화: "bg-red-500",
  토: "bg-yellow-500",
  금: "bg-gray-400",
  수: "bg-blue-500",
}

const ELEMENT_TEXT_COLORS: Record<Element, string> = {
  목: "text-green-600 dark:text-green-400",
  화: "text-red-600 dark:text-red-400",
  토: "text-yellow-600 dark:text-yellow-400",
  금: "text-gray-500 dark:text-gray-300",
  수: "text-blue-600 dark:text-blue-400",
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StoredProfile | null>(null)
  const [summary, setSummary] = useState<ProfileSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setProfile(stored)
    if (stored.summary) {
      setSummary(stored.summary)
    }
  }, [router])

  async function loadAISummary() {
    if (!profile) return
    setIsLoadingSummary(true)
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile.birthInfo),
      })
      if (!res.ok) throw new Error("프로필 생성 실패")
      const data = await res.json()
      setSummary(data.summary)
      const updated = { ...profile, summary: data.summary }
      setProfile(updated)
      const { saveProfile } = await import("@/lib/storage")
      saveProfile(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingSummary(false)
    }
  }

  function handleReset() {
    clearProfile()
    router.replace("/")
  }

  if (!profile) return null

  const saju = profile.sajuProfile
  const elements = saju.elementCounts
  const maxElement = Math.max(...Object.values(elements))

  return (
    <div className="p-4 space-y-4">
      {/* 히어로 섹션 — 일간 성격 강조 */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-5 overflow-hidden">
        <div className="absolute top-3 right-3">
          <Button variant="ghost" size="icon" onClick={handleReset} title="다시 입력" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {profile.birthInfo.year}년 {profile.birthInfo.month}월 {profile.birthInfo.day}일
            {profile.birthInfo.isLunar ? " (음력)" : " (양��)"}
          </p>
          <h1 className="text-2xl font-bold text-primary">
            {saju.dayStem} — {saju.dayStemDescription}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {saju.dayStemPersonality}
          </p>
          <div className="flex gap-2 pt-1">
            <Badge variant="secondary" className="text-xs">
              용신: {ELEMENTS[saju.usefulGod as Element].name}
            </Badge>
            {saju.yearPillar.animal && (
              <Badge variant="secondary" className="text-xs">
                {saju.yearPillar.animal}띠
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 오늘의 일진 — 골드 하이라이트 */}
      {saju.todayPillar && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
                <Sun className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-accent-foreground/70 mb-1">
                  오늘의 일진: {saju.todayPillar.pillar} ({saju.todayPillar.pillarHanja})
                </p>
                <p className="text-sm leading-relaxed">
                  {saju.todayInteraction}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사주팔자 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">사주팔자</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "시주", pillar: saju.hourPillar },
              { label: "일주", pillar: saju.dayPillar },
              { label: "월주", pillar: saju.monthPillar },
              { label: "년주", pillar: saju.yearPillar },
            ].map(({ label, pillar }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                {pillar ? (
                  <>
                    <div className="rounded-xl bg-muted/60 p-2">
                      <p className="text-lg font-bold">{pillar.pillarHanja}</p>
                      <p className="text-xs text-muted-foreground">{pillar.pillar}</p>
                    </div>
                    <div className="flex justify-center gap-1">
                      <Badge variant="outline" className={`text-[10px] px-1 ${ELEMENT_TEXT_COLORS[pillar.stemElement]}`}>
                        {pillar.stemElement}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1 ${ELEMENT_TEXT_COLORS[pillar.branchElement]}`}>
                        {pillar.branchElement}
                      </Badge>
                    </div>
                    {pillar.tenGod && (
                      <p className="text-[10px] text-muted-foreground">{pillar.tenGod}</p>
                    )}
                    {label === "일주" && (
                      <p className="text-[10px] font-medium text-primary">본인</p>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl bg-muted/60 p-2">
                    <p className="text-lg text-muted-foreground">?</p>
                    <p className="text-xs text-muted-foreground">미상</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 오행 분포 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">오행 분포</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {(Object.entries(elements) as [Element, number][]).map(([el, count]) => (
            <div key={el} className="flex items-center gap-3">
              <span className={`text-sm font-medium w-12 ${ELEMENT_TEXT_COLORS[el]}`}>
                {ELEMENTS[el].name}
              </span>
              <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${ELEMENT_COLORS[el]}`}
                  style={{ width: maxElement > 0 ? `${(count / maxElement) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-sm font-mono w-4 text-right">{count}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            {saju.usefulGodReason}
          </p>
        </CardContent>
      </Card>

      {/* AI 프로필 요약 */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">AI 프로필 분��</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAISummary}
              disabled={isLoadingSummary}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingSummary ? "animate-spin" : ""}`} />
              {summary ? "새로고침" : "분석하기"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSummary ? (
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/5" />
            </div>
          ) : summary ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-xs text-muted-foreground mb-1">성격</p>
                <p>{summary.personality}</p>
              </div>
              <div>
                <p className="font-medium text-xs text-muted-foreground mb-1">강점</p>
                <p>{summary.strength}</p>
              </div>
              <div>
                <p className="font-medium text-xs text-muted-foreground mb-1">주의점</p>
                <p>{summary.weakness}</p>
              </div>
              <div>
                <p className="font-medium text-xs text-muted-foreground mb-1">용신 조언</p>
                <p>{summary.useful_god_advice}</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-xs text-muted-foreground mb-1">오늘 한 줄</p>
                <p className="font-medium">{summary.today_brief}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Sparkles className="h-8 w-8 mx-auto text-primary/30 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                AI가 당신의 사주를 깊이 분석합니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAISummary}
                disabled={isLoadingSummary}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                분석 시작하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <Button
        className="w-full"
        size="lg"
        onClick={() => router.push("/ask")}
      >
        고민 상담받기
      </Button>
    </div>
  )
}
