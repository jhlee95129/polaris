"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Plus, Calendar, Waves, TreePine, Flame, Mountain, Gem, Droplets, User, type LucideIcon } from "lucide-react"
import { clearUser } from "@/lib/storage"
import { pillarToHanja, getSiLabel, STEM_MAP, BRANCH_MAP, ELEMENTS, ELEMENT_COLORS, ELEMENT_BG, getIlganElement, type Element } from "@/lib/saju-data"
import { cn } from "@/lib/utils"

const ELEMENT_ICON: Record<Element, LucideIcon> = {
  목: TreePine,
  화: Flame,
  토: Mountain,
  금: Gem,
  수: Droplets,
}

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

function PillarCard({ label, value }: { label: string; value: string }) {
  if (value === "—") {
    return (
      <div className="rounded-lg border border-border bg-background/50 p-2 text-center">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-1">{label}</p>
        <p className="text-sm text-muted-foreground">—</p>
      </div>
    )
  }

  const stem = STEM_MAP[value[0]]
  const branch = BRANCH_MAP[value[1]]
  if (!stem || !branch) return null

  return (
    <div className="rounded-lg border border-border bg-background/50 p-2 text-center space-y-0.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <div>
        <span className={`text-base font-bold ${ELEMENT_COLORS[stem.element]}`}>{stem.hanja}</span>
        <span className={`text-[10px] ml-0.5 ${ELEMENT_COLORS[stem.element]}`}>{stem.hangul}</span>
      </div>
      <div>
        <span className={`text-base font-bold ${ELEMENT_COLORS[branch.element]}`}>{branch.hanja}</span>
        <span className={`text-[10px] ml-0.5 ${ELEMENT_COLORS[branch.element]}`}>{branch.hangul}</span>
      </div>
      <div className="flex justify-center gap-0.5 pt-0.5">
        <span className={`text-[8px] px-1 rounded ${ELEMENT_BG[stem.element]} ${ELEMENT_COLORS[stem.element]}`}>{stem.element}</span>
        <span className={`text-[8px] px-1 rounded ${ELEMENT_BG[branch.element]} ${ELEMENT_COLORS[branch.element]}`}>{branch.element}</span>
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
  onReset,
}: SajuSidebarProps) {
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
  const AvatarIcon = element ? ELEMENT_ICON[element] : User
  const avatarColor = element ? ELEMENT_COLORS[element] : "text-muted-foreground"

  return (
    <div className="flex h-full flex-col bg-card/50">
      {/* 프로필 헤더 */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className={`h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center ${avatarColor}`}>
            <AvatarIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName || "사용자"}</p>
            <p className="text-[11px] text-muted-foreground">{birthText}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{getTodayLabel()}</span>
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
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{dayStemInfo.description}</p>
            </div>
          </div>
        )}

        {/* 사주 요약 */}
        {sajuSummary && (
          <p className="text-[11px] leading-relaxed text-muted-foreground px-1">
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
              <Waves className="h-4 w-4 text-muted-foreground shrink-0" />
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
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">대화 목록</p>
          <button
            onClick={onNewChat}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            새 대화
          </button>
        </div>
        <div className="px-2 pb-2 space-y-0.5">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSessionSwitch(session.id)}
              className={cn(
                "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors truncate",
                session.id === currentSessionId
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {session.title}
            </button>
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
          <Trash2 className="h-3 w-3 mr-1.5" />
          초기화
        </Button>
      </div>
    </div>
  )
}
