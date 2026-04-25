"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  loadProfile,
  loadConsultations,
  clearProfile,
  clearConsultations,
  updateFeedback,
  getConsultationStats,
  type StoredProfile,
  type StoredConsultation,
} from "@/lib/storage"
import type { ProfileSummary } from "@/lib/claude"
import { CHARACTERS } from "@/lib/prompts"
import { ELEMENTS, type Element } from "@/lib/saju-data"
import {
  LogOut,
  Sparkles,
  Sun,
  RefreshCw,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Clock,
  MessageCircle,
} from "lucide-react"

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

export default function MyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StoredProfile | null>(null)
  const [consultations, setConsultations] = useState<StoredConsultation[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(false)
  const [summary, setSummary] = useState<ProfileSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setProfile(stored)
    if (stored.summary) setSummary(stored.summary)
    setConsultations(loadConsultations())
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

  function handleFeedback(id: string, feedback: "helpful" | "not_helpful" | "not_tried") {
    updateFeedback(id, feedback)
    setConsultations(loadConsultations())
  }

  function handleReset() {
    clearProfile()
    clearConsultations()
    router.replace("/")
  }

  if (!profile) return null

  const saju = profile.sajuProfile
  const elements = saju.elementCounts
  const maxElement = Math.max(...Object.values(elements))
  const stats = getConsultationStats()

  return (
    <div className="space-y-4 px-4 pt-6 pb-4">
      {/* 사주 프로필 히어로 */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-5 overflow-hidden">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {profile.birthInfo.year}년 {profile.birthInfo.month}월 {profile.birthInfo.day}일
            {profile.birthInfo.isLunar ? " (음력)" : " (양력)"}
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

      {/* 오늘의 일진 */}
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

      {/* 사주팔자 4주 */}
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
                <p className="text-xs text-muted-foreground">{label}</p>
                {pillar ? (
                  <>
                    <div className="rounded-xl bg-muted/60 p-2">
                      <p className="text-lg font-bold">{pillar.pillarHanja}</p>
                      <p className="text-xs text-muted-foreground">{pillar.pillar}</p>
                    </div>
                    <div className="flex justify-center gap-1">
                      <Badge variant="outline" className={`text-xs px-1 ${ELEMENT_TEXT_COLORS[pillar.stemElement]}`}>
                        {pillar.stemElement}
                      </Badge>
                      <Badge variant="outline" className={`text-xs px-1 ${ELEMENT_TEXT_COLORS[pillar.branchElement]}`}>
                        {pillar.branchElement}
                      </Badge>
                    </div>
                    {pillar.tenGod && (
                      <p className="text-xs text-muted-foreground">{pillar.tenGod}</p>
                    )}
                    {label === "일주" && (
                      <p className="text-xs font-medium text-primary">본인</p>
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

      {/* AI 프로필 분석 (접힌 상태) */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <button
            onClick={() => {
              setShowAI(!showAI)
              if (!showAI && !summary && !isLoadingSummary) loadAISummary()
            }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">AI 프로필 분석</CardTitle>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAI ? "rotate-180" : ""}`} />
          </button>
        </CardHeader>
        {showAI && (
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadAISummary}
                  disabled={isLoadingSummary}
                  className="mt-1"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingSummary ? "animate-spin" : ""}`} />
                  새로고침
                </Button>
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
        )}
      </Card>

      <Separator />

      {/* 상담 기록 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">상담 기록</h2>
          {stats && (
            <span className="text-xs text-muted-foreground">
              {stats.totalCount}회 · 도움됨 {stats.feedbackCounts.helpful}회
            </span>
          )}
        </div>

        {/* 통계 (3회 이상) */}
        {stats && (
          <Card className="bg-primary/5 border-primary/10 mb-3">
            <CardContent className="py-3">
              <div className="flex gap-1">
                {(Object.entries(stats.characterCounts) as [string, number][])
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => {
                    const charInfo = CHARACTERS[type as keyof typeof CHARACTERS]
                    return (
                      <Badge key={type} variant="secondary" className={`text-xs ${charInfo.textColor}`}>
                        {charInfo.emoji} {count}
                      </Badge>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {consultations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">아직 상담 기록이 없어요.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/ask")}
              >
                첫 한수 받으러 가기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {consultations.map(consultation => {
              const charInfo = CHARACTERS[consultation.characterType]
              const isExpanded = expandedId === consultation.id
              const date = new Date(consultation.createdAt)
              const timeAgo = getTimeAgo(date)

              return (
                <Card
                  key={consultation.id}
                  className={`overflow-hidden transition-all ${isExpanded ? `${charInfo.borderColor} border-2` : ""}`}
                >
                  <div className="flex">
                    <div
                      className={`w-1 flex-shrink-0 ${
                        consultation.characterType === "sibling"
                          ? "bg-[var(--color-sibling)]"
                          : consultation.characterType === "grandma"
                          ? "bg-[var(--color-grandma)]"
                          : "bg-[var(--color-analyst)]"
                      }`}
                    />
                    <div className="flex-1">
                      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : consultation.id)}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{charInfo.emoji}</span>
                              <CardTitle className="text-sm">{charInfo.name}</CardTitle>
                              <span className="text-xs text-muted-foreground">{timeAgo}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {consultation.question}
                            </p>
                          </div>
                          {consultation.feedback && (
                            <Badge variant={consultation.feedback === "helpful" ? "default" : "secondary"} className="text-xs">
                              {consultation.feedback === "helpful" ? "도움됨" : consultation.feedback === "not_helpful" ? "별로" : "아직"}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="space-y-3">
                          <div className="bg-primary/5 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">내 고민</p>
                            <p className="text-sm">{consultation.question}</p>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">진단</p>
                              <p className="text-sm">{consultation.card.diagnosis}</p>
                            </div>
                            <div className="bg-accent/10 rounded-lg p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">한수</p>
                              <p className="text-sm font-semibold">{consultation.card.action}</p>
                              <Badge variant="secondary" className="mt-1 text-xs">{consultation.card.timing}</Badge>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">피할 것</p>
                              <p className="text-sm">{consultation.card.avoid}</p>
                            </div>
                          </div>

                          <Separator />

                          {!consultation.feedback && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium">그 한수, 해봤어요?</p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFeedback(consultation.id, "helpful")
                                  }}
                                >
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  좋았어요
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFeedback(consultation.id, "not_helpful")
                                  }}
                                >
                                  <ThumbsDown className="h-3 w-3 mr-1" />
                                  별로였어요
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFeedback(consultation.id, "not_tried")
                                  }}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  아직이요
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* 프로필 초기화 */}
      {showResetConfirm ? (
        <Card className="border-destructive/30">
          <CardContent className="py-4 text-center space-y-3">
            <p className="text-sm font-medium">정말 초기화하시겠어요?</p>
            <p className="text-xs text-muted-foreground">모든 프로필과 상담 기록이 삭제됩니다.</p>
            <div className="flex gap-2 justify-center">
              <Button variant="destructive" size="sm" onClick={handleReset}>
                초기화
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => setShowResetConfirm(true)}
        >
          <LogOut className="h-4 w-4 mr-2" />
          프로필 초기화
        </Button>
      )}
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "방금"
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return `${date.getMonth() + 1}/${date.getDate()}`
}
