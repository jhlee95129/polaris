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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { clearUser } from "@/lib/storage"
import { cn } from "@/lib/utils"
import SajuInfoPanel from "./SajuInfoPanel"

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
  onDeleteAllSessions: () => void
  onReset: () => void
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
  onDeleteAllSessions,
  onReset,
}: SajuSidebarProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<SessionItem | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  function handleReset() {
    clearUser()
    onReset()
  }

  return (
    <div className="flex h-full flex-col">
      {/* 내 정보 + 오늘의 한수 */}
      <div className="p-3 pb-2 overflow-y-auto border-b border-border">
        <SajuInfoPanel
          displayName={displayName}
          pillars={pillars}
          birthYear={birthYear}
          birthMonth={birthMonth}
          birthDay={birthDay}
          birthHour={birthHour}
          isLunar={isLunar}
          gender={gender}
          ilgan={ilgan}
          daeunCurrent={daeunCurrent}
          dailyFortune={dailyFortune}
        />
      </div>

      {/* 대화 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-1 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">대화 목록</p>
          <div className="flex items-center gap-1">
            {sessions.length > 1 && (
              <button
                onClick={() => setDeleteAllOpen(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/5"
              >
                전체 삭제
              </button>
            )}
            <button
              onClick={onNewChat}
              className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-primary/5"
            >
              ➕ 새 대화
            </button>
          </div>
        </div>
        <div className="px-2 pb-2 space-y-0.5">
          {sessions.map(session => (
            <div key={session.id} className="group relative flex items-center">
              <button
                onClick={() => onSessionSwitch(session.id)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-lg transition-colors pr-7",
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
          <span className="text-base mr-1">🧧</span> 복채 충전
        </Button>
        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-11 rounded-xl text-muted-foreground hover:text-destructive"
            >
              <span className="text-base mr-1">🗑️</span> 초기화
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>초기화</AlertDialogTitle>
              <AlertDialogDescription>
                대화 기록을 모두 지우고 새로 시작할까요?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>초기화</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* 전체 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모든 대화를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {sessions.length}개의 대화가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDeleteAllSessions()
                setDeleteAllOpen(false)
              }}
            >
              전체 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
