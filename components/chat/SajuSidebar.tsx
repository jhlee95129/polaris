"use client"

import { useState } from "react"
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
import { pillarToHanja, getSiLabel, STEM_MAP, BRANCH_MAP, ELEMENTS, ELEMENT_COLORS, ELEMENT_BG, ELEMENT_EMOJI, getIlganElement, type Element } from "@/lib/saju-data"
import { cn } from "@/lib/utils"

interface SessionItem {
  id: string
  title: string
  created_at: string
  updated_at: string
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

function PillarCard({ label, value }: { label: string; value: string }) {
  if (value === "—") {
    return (
      <div className="rounded-lg border border-border bg-background/50 p-2 text-center">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">{label}</p>
        <p className="text-sm text-muted-foreground">—</p>
      </div>
    )
  }

  const stem = STEM_MAP[value[0]]
  const branch = BRANCH_MAP[value[1]]
  if (!stem || !branch) return null

  return (
    <div className="rounded-lg border border-border bg-background/50 p-2 text-center space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <div>
        <span className={`text-lg font-bold ${ELEMENT_COLORS[stem.element]}`}>{stem.hanja}</span>
        <span className={`text-[11px] ml-0.5 ${ELEMENT_COLORS[stem.element]}`}>{stem.hangul}</span>
      </div>
      <div>
        <span className={`text-lg font-bold ${ELEMENT_COLORS[branch.element]}`}>{branch.hanja}</span>
        <span className={`text-[11px] ml-0.5 ${ELEMENT_COLORS[branch.element]}`}>{branch.hangul}</span>
      </div>
      <div className="flex justify-center gap-0.5 pt-0.5">
        <span className={`text-[9px] px-1 rounded ${ELEMENT_BG[stem.element]} ${ELEMENT_COLORS[stem.element]}`}>{stem.element}</span>
        <span className={`text-[9px] px-1 rounded ${ELEMENT_BG[branch.element]} ${ELEMENT_COLORS[branch.element]}`}>{branch.element}</span>
      </div>
    </div>
  )
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
  onSessionSwitch,
  onNewChat,
  onSessionDelete,
  onReset,
}: SajuSidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<SessionItem | null>(null)

  function handleReset() {
    if (confirm("대화 기록을 모두 지우고 새로 시작할까요?")) {
      clearUser()
      onReset()
    }
  }

  const siLabel = pillars.si ? getSiLabel(pillars.si) : (birthHour !== null ? `${birthHour}시` : null)
  const birthText = `${birthYear}.${birthMonth}.${birthDay}${siLabel ? ` ${siLabel}` : ""}${isLunar ? " (음력)" : ""}`
  const dayStem = ilgan?.[0]
  const dayStemInfo = dayStem ? STEM_MAP[dayStem] : null

  // 오행 아바타
  const element = getIlganElement(ilgan)
  const avatarEmoji = element ? ELEMENT_EMOJI[element] : "👤"

  return (
    <div className="flex h-full flex-col bg-surface-dim">
      {/* 프로필 헤더 */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            {avatarEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName || "사용자"}</p>
            <p className="text-xs text-muted-foreground">{birthText}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          📅 <span>{getTodayLabel()}</span>
        </div>
      </div>

      {/* 사주 정보 */}
      <div className="p-4 space-y-4 border-b border-border">
        {/* 일간 */}
        {dayStemInfo && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <span className={`text-xl font-bold ${ELEMENT_COLORS[dayStemInfo.element]}`}>
              {dayStemInfo.hanja}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">{ilgan}</span>
                <span className={`text-[9px] px-1 py-px rounded ${ELEMENT_BG[dayStemInfo.element]} ${ELEMENT_COLORS[dayStemInfo.element]}`}>
                  {ELEMENTS[dayStemInfo.element].name}
                </span>
                <span className="text-[9px] text-muted-foreground">{dayStemInfo.yinYang}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{dayStemInfo.description}</p>
            </div>
          </div>
        )}

        {/* 사주 요약 */}
        {sajuSummary && (
          <p className="text-xs leading-relaxed text-muted-foreground px-1">
            {sajuSummary}
          </p>
        )}

        {/* 사주 명식 */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">사주 명식</p>
          <div className="grid grid-cols-4 gap-1.5">
            <PillarCard label="시주" value={pillars.si || "—"} />
            <PillarCard label="일주" value={pillars.il} />
            <PillarCard label="월주" value={pillars.wol} />
            <PillarCard label="년주" value={pillars.yeon} />
          </div>
        </div>

        {/* 현재 대운 */}
        {daeunCurrent && (() => {
          const dStem = STEM_MAP[daeunCurrent[0]]
          return (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-background/50">
              <span className="text-sm shrink-0">🌊</span>
              <div className="flex-1">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">현재 대운</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-medium">{daeunCurrent}</span>
                  <span className="text-xs text-muted-foreground">{pillarToHanja(daeunCurrent)}</span>
                  {dStem && (
                    <span className={`text-[9px] px-1 py-px rounded ${ELEMENT_BG[dStem.element]} ${ELEMENT_COLORS[dStem.element]}`}>
                      {dStem.element}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* 대화 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 pb-1 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">대화 목록</p>
          <button
            onClick={onNewChat}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
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

      {/* 하단 */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
          onClick={handleReset}
        >
          🗑️ 초기화
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
