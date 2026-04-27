"use client"

import { pillarToHanja, getSiLabel, STEM_MAP, ELEMENT_COLORS, ELEMENT_BG, ELEMENT_EMOJI, ELEMENTS, getIlganElement } from "@/lib/saju-data"
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
  return `${now.getFullYear()}년 ${month}월 ${day}일 (${weekdays[now.getDay()]})`
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
    { label: "시주", value: pillars.si || "—" },
    { label: "일주", value: pillars.il },
    { label: "월주", value: pillars.wol },
    { label: "년주", value: pillars.yeon },
  ]

  return (
    <div className="space-y-3">
      {/* 프로필 */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">
            {avatarEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName || "사용자"}</p>
            <p className="text-[11px] text-muted-foreground">{birthText}</p>
          </div>
          {dayStemInfo && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${ELEMENT_BG[dayStemInfo.element]} ${ELEMENT_COLORS[dayStemInfo.element]}`}>
              {ELEMENT_EMOJI[dayStemInfo.element]} {ilgan}
            </span>
          )}
        </div>

        {/* 사주 4기둥 */}
        <div className="grid grid-cols-4 gap-1.5">
          {pillarList.map(p => (
            <div key={p.label} className="rounded-lg bg-muted/50 py-1.5 text-center">
              <p className="text-[9px] text-muted-foreground mb-0.5">{p.label}</p>
              <p className="text-xs font-semibold">{p.value}</p>
              {p.value !== "—" && (
                <p className="text-[9px] text-muted-foreground/70">{pillarToHanja(p.value)}</p>
              )}
            </div>
          ))}
        </div>

        {daeunCurrent && (
          <p className="text-[11px] text-muted-foreground">
            현재 대운 <span className="font-medium text-foreground">{daeunCurrent}</span>
          </p>
        )}
      </div>

      {/* 오늘의 한수 */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span className="text-sm">⭐</span> 오늘의 한수
          </h3>
          <span className="text-[10px] text-muted-foreground">{getTodayLabel()}</span>
        </div>

        {dailyFortune ? (
          <>
            <div className="rounded-xl bg-gradient-to-r from-amber-50/80 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-800/10 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
                <span className="text-sm shrink-0">🧭</span>
                <span>{dailyFortune.coaching}</span>
              </p>
            </div>
            <div className="rounded-xl bg-red-50/60 dark:bg-red-900/10 px-3 py-2">
              <p className="text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1.5">
                <span className="text-sm shrink-0">⚠️</span>
                <span>{dailyFortune.warning}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[9px] text-muted-foreground">행운의 숫자</p>
                <p className="text-base font-bold text-primary">{dailyFortune.lucky_number}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[9px] text-muted-foreground">행운의 색</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: dailyFortune.lucky_color_hex }} />
                  <span className="text-[11px] font-medium">{dailyFortune.lucky_color}</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[9px] text-muted-foreground">오늘의 기운</p>
                <p className="text-sm font-bold text-accent-foreground">{dailyFortune.energy}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 py-3 justify-center">
            <span className="h-3.5 w-3.5 border-2 border-primary/40 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">불러오는 중...</span>
          </div>
        )}
      </div>
    </div>
  )
}
