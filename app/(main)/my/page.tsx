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

interface ThreadGroup {
  threadId: string
  consultations: StoredConsultation[]
  firstQuestion: string
  count: number
  latestDate: string
}

function groupByThread(consultations: StoredConsultation[]): ThreadGroup[] {
  const threads = new Map<string, StoredConsultation[]>()

  for (const c of consultations) {
    const tid = c.threadId || c.id // 하위 호환: threadId 없으면 id로
    if (!threads.has(tid)) {
      threads.set(tid, [])
    }
    threads.get(tid)!.push(c)
  }

  const groups: ThreadGroup[] = []
  for (const [threadId, items] of threads) {
    // 시간순 정렬
    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    groups.push({
      threadId,
      consultations: items,
      firstQuestion: items[0].question,
      count: items.length,
      latestDate: items[items.length - 1].createdAt,
    })
  }

  // 최신 thread 우선
  groups.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
  return groups
}

export default function MyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StoredProfile | null>(null)
  const [threadGroups, setThreadGroups] = useState<ThreadGroup[]>([])
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(false)
  const [summary, setSummary] = useState<ProfileSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [stats, setStats] = useState<ReturnType<typeof getConsultationStats>>(null)

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setProfile(stored)
    if (stored.summary) setSummary(stored.summary)
    const consultations = loadConsultations()
    setThreadGroups(groupByThread(consultations))
    setStats(getConsultationStats())
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
    const consultations = loadConsultations()
    setThreadGroups(groupByThread(consultations))
    setStats(getConsultationStats())
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
        <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <Sun className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground/70" />
          <div>
            <p className="text-xs font-medium text-accent-foreground/70 mb-0.5">
              오늘의 일진: {saju.todayPillar.pillar} ({saju.todayPillar.pillarHanja})
            </p>
            <p className="text-sm leading-relaxed">{saju.todayInteraction}</p>
          </div>
        </div>
      )}

      {/* 사주 상세 (접힌 상태) */}
      <details className="rounded-xl border border-border bg-card">
        <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-semibold hover:bg-muted/30">
          사주 상세
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </summary>
        <div className="space-y-5 border-t border-border p-4">
          {/* 사주팔자 4주 */}
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

          {/* 오행 분포 */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground">오행 분포</p>
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
          </div>
        </div>
      </details>

      {/* AI 프로필 분석 (접힌 상태) */}
      <details
        className="rounded-xl border border-primary/20 bg-card"
        onToggle={(e) => {
          const open = (e.target as HTMLDetailsElement).open
          setShowAI(open)
          if (open && !summary && !isLoadingSummary) loadAISummary()
        }}
      >
        <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-semibold hover:bg-muted/30">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI 프로필 분석
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAI ? "rotate-180" : ""}`} />
        </summary>
        <div className="border-t border-border p-4">
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
              <div className="border-t border-border pt-3">
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
        </div>
      </details>

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

        {threadGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">아직 상담 기록이 없어요.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/ask")}
            >
              첫 한수 받으러 가기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {threadGroups.map(group => {
              const isExpanded = expandedThreadId === group.threadId
              const latestConsult = group.consultations[group.consultations.length - 1]
              const timeAgo = getTimeAgo(new Date(group.latestDate))

              return (
                <Card
                  key={group.threadId}
                  className={`overflow-hidden transition-all ${isExpanded ? "border-primary/30 border-2" : ""}`}
                >
                  <div className="flex">
                    <div className="w-1 flex-shrink-0 bg-primary/40" />
                    <div className="flex-1">
                      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedThreadId(isExpanded ? null : group.threadId)}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-primary/50" />
                              <CardTitle className="text-sm">{group.firstQuestion}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{timeAgo}</span>
                              {group.count > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  {group.count}회 코칭
                                </Badge>
                              )}
                            </div>
                          </div>
                          {latestConsult.feedback && (
                            <Badge variant={latestConsult.feedback === "helpful" ? "default" : "secondary"} className="text-xs">
                              {latestConsult.feedback === "helpful" ? "도움됨" : latestConsult.feedback === "not_helpful" ? "별로" : "아직"}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="space-y-4">
                          {group.consultations.map((consultation, idx) => (
                            <div key={consultation.id} className="space-y-2">
                              {idx > 0 && <Separator />}
                              {idx > 0 && (
                                <p className="text-xs text-primary font-medium pt-1">
                                  {idx + 1}회차 코칭
                                </p>
                              )}

                              {consultation.followUpNote && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-xs text-muted-foreground mb-1">실행 보고</p>
                                  <p className="text-sm">{consultation.followUpNote}</p>
                                </div>
                              )}

                              <div className="bg-primary/5 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {idx === 0 ? "내 고민" : "질문"}
                                </p>
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

                              {/* 마지막 카드에만 피드백 표시 */}
                              {idx === group.consultations.length - 1 && !consultation.feedback && (
                                <>
                                  <Separator />
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
                                </>
                              )}
                            </div>
                          ))}
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

      {/* 프로필 초기화 */}
      {showResetConfirm ? (
        <div className="rounded-xl border border-destructive/30 p-4 text-center space-y-3">
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
        </div>
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
