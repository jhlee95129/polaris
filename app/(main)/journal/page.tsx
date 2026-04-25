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
  updateFeedback,
  getConsultationStats,
  type StoredConsultation,
} from "@/lib/storage"
import { CHARACTERS } from "@/lib/prompts"
import { MessageCircle, ThumbsUp, ThumbsDown, Clock } from "lucide-react"

export default function JournalPage() {
  const router = useRouter()
  const [consultations, setConsultations] = useState<StoredConsultation[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setConsultations(loadConsultations())
  }, [router])

  function handleFeedback(id: string, feedback: "helpful" | "not_helpful" | "not_tried") {
    updateFeedback(id, feedback)
    setConsultations(loadConsultations())
  }

  const stats = getConsultationStats()

  if (consultations.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="pt-2">
          <h1 className="text-xl font-bold">한 수 일지</h1>
          <p className="text-xs text-muted-foreground">상담 기록이 이곳에 쌓입니다.</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">아직 상담 기록이 없어요.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/ask")}
            >
              첫 한 수 받으러 가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="pt-2">
        <h1 className="text-xl font-bold">한 수 일지</h1>
        <p className="text-xs text-muted-foreground">
          총 {consultations.length}개의 상담 기록
        </p>
      </div>

      {/* 통계 (3회 이상) */}
      {stats && (
        <Card>
          <CardContent className="py-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">상담 횟수</span>
              <span className="font-medium">{stats.totalCount}회</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">도움이 됐어요</span>
              <span className="font-medium">{stats.feedbackCounts.helpful}회</span>
            </div>
            <div className="flex gap-1 mt-2">
              {(Object.entries(stats.characterCounts) as [string, number][])
                .filter(([, count]) => count > 0)
                .map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-[10px]">
                    {CHARACTERS[type as keyof typeof CHARACTERS].emoji} {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상담 타임라인 */}
      <div className="space-y-3">
        {consultations.map(consultation => {
          const charInfo = CHARACTERS[consultation.characterType]
          const isExpanded = expandedId === consultation.id
          const date = new Date(consultation.createdAt)
          const timeAgo = getTimeAgo(date)

          return (
            <Card key={consultation.id}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : consultation.id)}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{charInfo.emoji}</span>
                      <CardTitle className="text-sm">{charInfo.name}</CardTitle>
                      <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {consultation.question}
                    </p>
                  </div>
                  {consultation.feedback && (
                    <Badge variant={consultation.feedback === "helpful" ? "default" : "secondary"} className="text-[10px]">
                      {consultation.feedback === "helpful" ? "도움됨" : consultation.feedback === "not_helpful" ? "별로" : "아직"}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">내 고민</p>
                    <p className="text-sm">{consultation.question}</p>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">진단</p>
                      <p className="text-sm">{consultation.card.diagnosis}</p>
                    </div>
                    <div className="bg-foreground/5 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">한 수</p>
                      <p className="text-sm font-semibold">{consultation.card.action}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">{consultation.card.timing}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">피할 것</p>
                      <p className="text-sm">{consultation.card.avoid}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* 피드백 */}
                  {!consultation.feedback && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium">그 한 수, 해봤어요?</p>
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
            </Card>
          )
        })}
      </div>
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
