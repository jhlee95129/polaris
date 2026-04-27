"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { clearUser } from "@/lib/storage"
import { getSiLabel, STEM_MAP, ELEMENT_COLORS, ELEMENT_BG, ELEMENT_EMOJI, ELEMENTS, getIlganElement } from "@/lib/saju-data"
import { cn } from "@/lib/utils"

interface SessionItem {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface DailyFortune {
  coaching: string
  warning: string
  lucky_number: number
  lucky_color: string
  lucky_color_hex: string
  energy: string
}

interface SajuSidebarProps {
  displayName: string | null
  sajuSummary: string | null
  pillars: {
    yeon: string
    wol: string
    il: string
    si: string | null
  }
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number | null
  isLunar: boolean
  gender: string
  ilgan: string
  daeunCurrent: string | null
  sessions: SessionItem[]
  currentSessionId: string | null
  dailyFortune: DailyFortune | null
  onSessionSwitch: (sessionId: string) => void
  onNewChat: () => void
  onSessionDelete: (sessionId: string) => void
  onReset: () => void
}

function getTodayLabel(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
  const weekday = weekdays[now.getDay()]
  return `${now.getFullYear()}년 ${month}월 ${day}일 (${weekday})`
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

export default function SajuSidebar({
  displayName,
  sajuSummary,
  pillars,
  birthYear,
  birthMonth,
  birthDay,
  birthHour,
  isLunar,
  gender,
  ilgan,
  daeunCurrent,
  sessions,
  currentSessionId,
  dailyFortune,
  onSessionSwitch,
  onNewChat,
  onSessionDelete,
  onReset,
}: SajuSidebarProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<SessionItem | null>(null)

  function handleReset() {
    if (confirm("대화 기록을 모두 지우고 새로 시작할까요?")) {
      clearUser()
      onReset()
    }
  }

  const siLabel = pillars.si ? getSiLabel(pillars.si) : (birthHour !== null ? `${birthHour}시` : null)
  const birthText = `${birthYear}.${birthMonth}.${birthDay}${siLabel ? ` ${siLabel}` : ""}${isLunar ? " (음력)" : ""}`

  // 오행 아바타
  const element = getIlganElement(ilgan)
  const avatarEmoji = element ? ELEMENT_EMOJI[element] : "👤"

  // 일간 정보
  const dayStem = ilgan?.[0]
  const dayStemInfo = dayStem ? STEM_MAP[dayStem] : null

  return (
    <div className="flex h-full flex-col">
      {/* 프로필 */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
              {avatarEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName || "사용자"}</p>
              <p className="text-xs text-muted-foreground">{birthText}</p>
            </div>
          </div>
          {dayStemInfo && (
            <div className="mt-2.5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${ELEMENT_BG[dayStemInfo.element]} ${ELEMENT_COLORS[dayStemInfo.element]}`}>
                {ELEMENT_EMOJI[dayStemInfo.element]} {ilgan} ({ELEMENTS[dayStemInfo.element].name})
              </span>
            </div>
          )}

        </div>
      </div>

      {/* 날짜 + 오늘의 운세 */}
      <div className="p-4 pb-3 border-b border-border" style={dailyFortune ? { animation: "fadeInUp 0.3s ease-out" } : undefined}>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <span className="text-sm">📅</span> <span>{getTodayLabel()}</span>
          </div>
          {dailyFortune ? (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span className="text-sm">⭐</span> 오늘의 한수
            </h3>

            {/* 코칭 */}
            <div className="rounded-xl bg-gradient-to-r from-amber-50/80 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-800/10 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <span className="text-sm">🧭</span> {dailyFortune.coaching}
              </p>
            </div>

            {/* 주의할 점 */}
            <div className="rounded-xl bg-red-50/60 dark:bg-red-900/10 px-3 py-2">
              <p className="text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1.5">
                <span className="text-sm">⚠️</span> {dailyFortune.warning}
              </p>
            </div>

            {/* 행운 정보 그리드 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/50 p-2 text-center space-y-0.5">
                <p className="text-[9px] text-muted-foreground">행운의 숫자</p>
                <p className="text-lg font-bold text-primary">{dailyFortune.lucky_number}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2 text-center space-y-0.5">
                <p className="text-[9px] text-muted-foreground">행운의 색</p>
                <div className="flex items-center justify-center gap-1">
                  <span
                    className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: dailyFortune.lucky_color_hex }}
                  />
                  <span className="text-xs font-medium">{dailyFortune.lucky_color}</span>
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-2 text-center space-y-0.5">
                <p className="text-[9px] text-muted-foreground">오늘의 기운</p>
                <p className="text-sm font-bold text-accent-foreground">{dailyFortune.energy}</p>
              </div>
            </div>
          </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-4 flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary/40 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">오늘의 한수 불러오는 중...</span>
            </div>
          )}
      </div>

      {/* 대화 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-1 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">대화 목록</p>
          <button
            onClick={onNewChat}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-primary/5"
          >
            ➕ 새 대화
          </button>
        </div>
        <div className="px-2 pb-2 space-y-0.5">
          {sessions.map(session => (
            <div key={session.id} className="group relative flex items-center">
              <button
                onClick={() => onSessionSwitch(session.id)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-xl transition-colors pr-7",
                  session.id === currentSessionId
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  <button
                    className="absolute right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 text-xs"
                    onClick={() => setDeleteTarget(session)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    대화 삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-[11px] text-muted-foreground/50 px-2.5 py-3 text-center">
              아직 대화가 없습니다
            </p>
          )}
        </div>
      </div>

      {/* 하단 액션 */}
      <div className="p-3 border-t border-border space-y-1.5">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm h-11 rounded-xl"
          onClick={() => router.push("/bokchae")}
        >
          <span className="text-base mr-1">👜</span> 복주머니 충전
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm h-11 rounded-xl text-muted-foreground hover:text-destructive"
          onClick={handleReset}
        >
          <span className="text-base mr-1">🗑️</span> 초기화
        </Button>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대화를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; 대화가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onSessionDelete(deleteTarget.id)
                  setDeleteTarget(null)
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
