"use client"

import { pillarToHanja, getSiLabel, STEM_MAP, ELEMENT_COLORS, ELEMENT_BG, ELEMENT_EMOJI, getIlganElement } from "@/lib/saju-data"
import type { DailyFortune } from "./SajuSidebar"

interface SajuInfoPanelProps {
  displayName: string | null
  pillars: { yeon: string; wol: string; il: string; si: string | null }
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number | null
  isLunar: boolean
  gender: string
  ilgan: string
  daeunCurrent: string | null
  dailyFortune: DailyFortune | null
}

function getTodayLabel(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
  return `${month}월 ${day}일 (${weekdays[now.getDay()]})`
}

export default function SajuInfoPanel({
  displayName, pillars, birthYear, birthMonth, birthDay, birthHour,
  isLunar, ilgan, daeunCurrent, dailyFortune,
}: SajuInfoPanelProps) {
  const element = getIlganElement(ilgan)
  const avatarEmoji = element ? ELEMENT_EMOJI[element] : "👤"
  const dayStem = ilgan?.[0]
  const dayStemInfo = dayStem ? STEM_MAP[dayStem] : null
  const siLabel = pillars.si ? getSiLabel(pillars.si) : (birthHour !== null ? `${birthHour}시` : null)
  const birthText = `${birthYear}.${birthMonth}.${birthDay}${siLabel ? ` ${siLabel}` : ""}${isLunar ? " (음력)" : ""}`

  const pillarList = [
    { label: "년주", value: pillars.yeon },
    { label: "월주", value: pillars.wol },
    { label: "일주", value: pillars.il },
    { label: "시주", value: pillars.si || "—" },
  ]

  return (
    <div className="space-y-3">
      {/* 프로필 */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
            {avatarEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate">{displayName || "사용자"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{birthText}</p>
          </div>
          {dayStemInfo && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${ELEMENT_BG[dayStemInfo.element]} ${ELEMENT_COLORS[dayStemInfo.element]}`}>
              {ELEMENT_EMOJI[dayStemInfo.element]} {ilgan}
            </span>
          )}
        </div>

        {/* 사주 4기둥 */}
        <div className="grid grid-cols-4 gap-2">
          {pillarList.map(p => (
            <div key={p.label} className="rounded-xl bg-muted/50 py-2.5 text-center space-y-0.5">
              <p className="text-[11px] text-muted-foreground font-medium">{p.label}</p>
              <p className="text-sm font-bold">{p.value}</p>
              {p.value !== "—" && (
                <p className="text-xs text-muted-foreground/70">{pillarToHanja(p.value)}</p>
              )}
            </div>
          ))}
        </div>

        {daeunCurrent && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <span>🔄</span>
            <span>현재 대운</span>
            <span className="font-bold text-foreground">{daeunCurrent}</span>
          </div>
        )}
      </div>

      {/* 오늘의 한수 */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            ⭐ 오늘의 한수
          </h3>
          <span className="text-xs text-muted-foreground">{getTodayLabel()}</span>
        </div>

        {dailyFortune ? (
          <>
            <div className="rounded-xl bg-gradient-to-r from-amber-50/80 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-800/10 px-3.5 py-3">
              <p className="text-sm leading-relaxed font-medium text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <span className="text-base shrink-0">🧭</span>
                <span>{dailyFortune.coaching}</span>
              </p>
            </div>
            <div className="rounded-xl bg-red-50/60 dark:bg-red-900/10 px-3.5 py-2.5">
              <p className="text-sm leading-relaxed text-red-700 dark:text-red-300 flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <span>{dailyFortune.warning}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/50 p-2.5 text-center">
                <p className="text-[11px] text-muted-foreground font-medium">행운의 숫자</p>
                <p className="text-lg font-bold text-primary mt-0.5">{dailyFortune.lucky_number}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2.5 text-center">
                <p className="text-[11px] text-muted-foreground font-medium">행운의 색</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: dailyFortune.lucky_color_hex }} />
                  <span className="text-xs font-bold">{dailyFortune.lucky_color}</span>
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-2.5 text-center">
                <p className="text-[11px] text-muted-foreground font-medium">오늘의 기운</p>
                <p className="text-sm font-bold text-accent-foreground mt-0.5">{dailyFortune.energy}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 py-4 justify-center">
            <span className="h-4 w-4 border-2 border-primary/40 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">불러오는 중...</span>
          </div>
        )}
      </div>
    </div>
  )
}
