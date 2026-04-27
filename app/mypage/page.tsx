"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserId, clearUser } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { pillarToHanja, getSiLabel, STEM_MAP, BRANCH_MAP, ELEMENTS, ELEMENT_COLORS, ELEMENT_BG, ELEMENT_EMOJI, getIlganElement, type Element, type TenGodKey } from "@/lib/saju-data"
import { cn } from "@/lib/utils"

const HOURS = [
  { value: "-1", label: "모르겠어요" },
  { value: "0", label: "자시 (23:30~01:30)" },
  { value: "1", label: "축시 (01:30~03:30)" },
  { value: "3", label: "인시 (03:30~05:30)" },
  { value: "5", label: "묘시 (05:30~07:30)" },
  { value: "7", label: "진시 (07:30~09:30)" },
  { value: "9", label: "사시 (09:30~11:30)" },
  { value: "11", label: "오시 (11:30~13:30)" },
  { value: "13", label: "미시 (13:30~15:30)" },
  { value: "15", label: "신시 (15:30~17:30)" },
  { value: "17", label: "유시 (17:30~19:30)" },
  { value: "19", label: "술시 (19:30~21:30)" },
  { value: "21", label: "해시 (21:30~23:30)" },
]

interface FullUserData {
  id: string
  display_name: string | null
  saju_summary: string | null
  yeon_pillar: string
  wol_pillar: string
  il_pillar: string
  si_pillar: string | null
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null
  is_lunar: boolean
  gender: string
  ilgan: string | null
  daeun_current: string | null
  created_at: string
  bokchae_count: number
}

interface SajuProfileData {
  dayStem: string
  dayStemDescription: string
  dayStemPersonality: string
  elementCounts: Record<Element, number>
  dominantElement: Element
  weakestElement: Element
  usefulGod: Element
  usefulGodReason: string
  dominantTenGods: TenGodKey[]
  todayPillar: { pillar: string; pillarHanja: string; stemElement: Element; branchElement: Element } | null
  todayInteraction: string | null
  yearAnimal: string | null
}

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<FullUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<SajuProfileData | null>(null)

  // 편집 모드
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // 편집 폼 상태
  const [nickname, setNickname] = useState("")
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [hour, setHour] = useState("-1")
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar")
  const [gender, setGender] = useState<"male" | "female">("male")

  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace("/onboarding")
      return
    }
    Promise.all([
      fetch(`/api/user?id=${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/saju-profile?user_id=${id}`).then(r => r.ok ? r.json() : null),
    ]).then(([userData, profileData]) => {
      if (userData?.user) setUser(userData.user)
      else router.replace("/onboarding")
      if (profileData) setProfile(profileData)
    }).catch(() => router.replace("/onboarding"))
      .finally(() => setLoading(false))
  }, [router])

  function startEditing() {
    if (!user) return
    setNickname(user.display_name || "")
    setYear(String(user.birth_year))
    setMonth(String(user.birth_month))
    setDay(String(user.birth_day))
    setHour(user.birth_hour !== null && user.birth_hour >= 0 ? String(user.birth_hour) : "-1")
    setCalendarType(user.is_lunar ? "lunar" : "solar")
    setGender(user.gender as "male" | "female")
    setError("")
    setEditing(true)
  }

  function canSave() {
    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)
    return y >= 1900 && y <= 2050 && m >= 1 && m <= 12 && d >= 1 && d <= 31
  }

  async function handleSave() {
    if (!user || !canSave()) {
      setError("올바른 생년월일을 입력해주세요")
      return
    }
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          display_name: nickname.trim() || undefined,
          birth_year: parseInt(year),
          birth_month: parseInt(month),
          birth_day: parseInt(day),
          birth_hour: hour === "-1" ? undefined : parseInt(hour),
          is_lunar: calendarType === "lunar",
          gender,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "수정에 실패했습니다")
      }
      const data = await res.json()
      setUser(data.user)
      setEditing(false)
      fetch(`/api/saju-profile?user_id=${user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(p => p && setProfile(p))
        .catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    const id = getUserId()
    if (!id) return
    try {
      await fetch(`/api/user?id=${id}`, { method: "DELETE" })
    } catch { /* 실패해도 로컬 정리 진행 */ }
    clearUser()
    router.replace("/")
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100svh-49px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const ilgan = user.ilgan?.[0]
  const stemInfo = ilgan ? STEM_MAP[ilgan] : null
  const element = user.ilgan ? getIlganElement(user.ilgan) : null
  const avatarEmoji = element ? ELEMENT_EMOJI[element] : "👤"

  const pillars = [
    { label: "년주", emoji: "🌳", value: user.yeon_pillar, desc: "태어난 해" },
    { label: "월주", emoji: "🌙", value: user.wol_pillar, desc: "태어난 달" },
    { label: "일주", emoji: "☀️", value: user.il_pillar, desc: "나 자신" },
    { label: "시주", emoji: "⭐", value: user.si_pillar || null, desc: "미래·자녀" },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">

      {/* ═══ 프로필 헤더 ═══ */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20 text-3xl">
          {avatarEmoji}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{user.display_name || "사용자"}</h1>
          {stemInfo && (
            <p className="text-sm text-muted-foreground">
              {user.ilgan} · {stemInfo.hanja} · {ELEMENTS[stemInfo.element].name} · {stemInfo.yinYang}
            </p>
          )}
        </div>
      </div>

      {/* 한 줄 요약 */}
      {user.saju_summary && (
        <div className="rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground/80">{user.saju_summary}</p>
        </div>
      )}

      {/* ═══ 기본 정보 ═══ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">👤 기본 정보</h2>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={startEditing} className="text-xs text-muted-foreground">
              수정
            </Button>
          )}
        </div>

        {editing ? (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">닉네임</Label>
              <Input placeholder="닉네임 (선택)" value={nickname} onChange={e => setNickname(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">달력</Label>
              <RadioGroup value={calendarType} onValueChange={v => setCalendarType(v as "solar" | "lunar")} className="flex gap-3">
                {[{ value: "solar", label: "양력" }, { value: "lunar", label: "음력" }].map(opt => (
                  <label key={opt.value} className={cn(
                    "flex-1 flex items-center justify-center rounded-xl border p-2.5 cursor-pointer transition-all text-sm",
                    calendarType === opt.value ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/30",
                  )}>
                    <RadioGroupItem value={opt.value} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">년</Label>
                <Input type="number" placeholder="1990" value={year} onChange={e => setYear(e.target.value)} min={1900} max={2050} className="text-center" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">월</Label>
                <Input type="number" placeholder="1" value={month} onChange={e => setMonth(e.target.value)} min={1} max={12} className="text-center" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">일</Label>
                <Input type="number" placeholder="15" value={day} onChange={e => setDay(e.target.value)} min={1} max={31} className="text-center" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">태어난 시간</Label>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger><SelectValue placeholder="시간을 선택하세요" /></SelectTrigger>
                <SelectContent>
                  {HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">성별</Label>
              <RadioGroup value={gender} onValueChange={v => setGender(v as "male" | "female")} className="flex gap-3">
                {[{ value: "male", label: "남성" }, { value: "female", label: "여성" }].map(opt => (
                  <label key={opt.value} className={cn(
                    "flex-1 flex items-center justify-center rounded-xl border p-2.5 cursor-pointer transition-all text-sm",
                    gender === opt.value ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/30",
                  )}>
                    <RadioGroupItem value={opt.value} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => { setEditing(false); setError("") }} disabled={saving} className="flex-1">취소</Button>
              <Button onClick={handleSave} disabled={saving || !canSave()} className="flex-1">
                {saving ? "사주 재계산 중..." : "저장"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <span>📅</span>
              <span>{user.birth_year}년 {user.birth_month}월 {user.birth_day}일 <span className="text-muted-foreground">({user.is_lunar ? "음력" : "양력"})</span></span>
            </div>
            {user.birth_hour !== null && user.birth_hour >= 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span>⏰</span>
                <span>{user.si_pillar ? getSiLabel(user.si_pillar) : `${user.birth_hour}시`}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span>👤</span>
              <span>{user.gender === "male" ? "남성" : "여성"}</span>
            </div>
          </div>
        )}
      </section>

      {/* ═══ 나의 성격 ═══ */}
      {profile && (
        <section className="space-y-3">
          <h2 className="font-semibold text-lg">🧬 나의 성격</h2>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-medium">{profile.dayStemDescription}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.dayStemPersonality}</p>
          </div>
        </section>
      )}

      {/* ═══ 사주 4기둥 ═══ */}
      <section className="space-y-3">
        <h2 className="font-semibold text-lg">🏛️ 나의 사주</h2>
        <div className="grid grid-cols-4 gap-2">
          {pillars.map(p => {
            if (!p.value) {
              return (
                <div key={p.label} className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-center">
                  <span className="text-lg">{p.emoji}</span>
                  <p className="text-[10px] text-muted-foreground mt-1">{p.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                </div>
              )
            }
            const stem = STEM_MAP[p.value[0]]
            const branch = BRANCH_MAP[p.value[1]]
            if (!stem || !branch) return null
            const isIl = p.label === "일주"
            return (
              <div key={p.label} className={cn(
                "rounded-2xl border p-3 text-center",
                isIl ? "border-primary/30 bg-primary/5" : "border-border bg-card",
              )}>
                <span className="text-lg">{p.emoji}</span>
                <p className="text-[10px] text-muted-foreground mt-1">{p.label}</p>
                <div className="mt-1.5">
                  <span className={`text-xl font-bold ${ELEMENT_COLORS[stem.element]}`}>{stem.hanja}</span>
                  <span className={`text-xl font-bold ml-0.5 ${ELEMENT_COLORS[branch.element]}`}>{branch.hanja}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
              </div>
            )
          })}
        </div>

        {/* 현재 대운 */}
        {user.daeun_current && (() => {
          const dStem = STEM_MAP[user.daeun_current[0]]
          return (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <span className="text-xl">🌊</span>
              <div>
                <p className="text-xs text-muted-foreground">현재 대운</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-semibold">{user.daeun_current}</span>
                  <span className="text-xs text-muted-foreground">{pillarToHanja(user.daeun_current)}</span>
                  {dStem && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ELEMENT_BG[dStem.element]} ${ELEMENT_COLORS[dStem.element]}`}>
                      {ELEMENT_EMOJI[dStem.element]} {dStem.element}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </section>

      {/* ═══ 오행 밸런스 ═══ */}
      {profile && (
        <section className="space-y-3">
          <h2 className="font-semibold text-lg">⚖️ 오행 밸런스</h2>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            {/* 바 차트 */}
            <div className="space-y-2">
              {(["목", "화", "토", "금", "수"] as Element[]).map(el => {
                const count = profile.elementCounts[el] || 0
                const maxCount = Math.max(...Object.values(profile.elementCounts), 1)
                const pct = (count / maxCount) * 100
                return (
                  <div key={el} className="flex items-center gap-2.5">
                    <span className="text-base w-5 text-center">{ELEMENT_EMOJI[el]}</span>
                    <span className={`text-xs font-medium w-6 ${ELEMENT_COLORS[el]}`}>{el}</span>
                    <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ELEMENT_BG[el]}`}
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-3 text-right">{count}</span>
                  </div>
                )
              })}
            </div>

            {/* 강한 / 약한 / 용신 */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className={`rounded-xl p-3 text-center ${ELEMENT_BG[profile.dominantElement]}`}>
                <p className="text-[10px] text-muted-foreground mb-1">강한 기운</p>
                <span className="text-lg">{ELEMENT_EMOJI[profile.dominantElement]}</span>
                <p className={`text-xs font-semibold mt-0.5 ${ELEMENT_COLORS[profile.dominantElement]}`}>
                  {ELEMENTS[profile.dominantElement].name}
                </p>
              </div>
              <div className={`rounded-xl p-3 text-center ${ELEMENT_BG[profile.weakestElement]}`}>
                <p className="text-[10px] text-muted-foreground mb-1">약한 기운</p>
                <span className="text-lg">{ELEMENT_EMOJI[profile.weakestElement]}</span>
                <p className={`text-xs font-semibold mt-0.5 ${ELEMENT_COLORS[profile.weakestElement]}`}>
                  {ELEMENTS[profile.weakestElement].name}
                </p>
              </div>
              <div className={`rounded-xl p-3 text-center ${ELEMENT_BG[profile.usefulGod]} ring-1 ring-primary/20`}>
                <p className="text-[10px] text-muted-foreground mb-1">보완 기운</p>
                <span className="text-lg">{ELEMENT_EMOJI[profile.usefulGod]}</span>
                <p className={`text-xs font-semibold mt-0.5 ${ELEMENT_COLORS[profile.usefulGod]}`}>
                  {ELEMENTS[profile.usefulGod].name}
                </p>
              </div>
            </div>

            {/* 용신 설명 */}
            <p className="text-xs text-muted-foreground leading-relaxed">{profile.usefulGodReason}</p>

            {/* 행운 팁 */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span>🎨</span> 행운 색상: {ELEMENTS[profile.usefulGod].color}
              </div>
              <div className="flex-1 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span>🧭</span> 행운 방향: {ELEMENTS[profile.usefulGod].direction}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ 오늘의 운세 ═══ */}
      {profile?.todayPillar && profile?.todayInteraction && (
        <section className="space-y-3">
          <h2 className="font-semibold text-lg">📅 오늘의 운세</h2>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs px-2 py-1 rounded-full ${ELEMENT_BG[profile.todayPillar.stemElement]} ${ELEMENT_COLORS[profile.todayPillar.stemElement]}`}>
                  {ELEMENT_EMOJI[profile.todayPillar.stemElement]} {profile.todayPillar.stemElement}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${ELEMENT_BG[profile.todayPillar.branchElement]} ${ELEMENT_COLORS[profile.todayPillar.branchElement]}`}>
                  {ELEMENT_EMOJI[profile.todayPillar.branchElement]} {profile.todayPillar.branchElement}
                </span>
              </div>
              <span className="text-sm font-medium">{profile.todayPillar.pillar}</span>
              <span className="text-xs text-muted-foreground">{profile.todayPillar.pillarHanja}</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{profile.todayInteraction}</p>
          </div>
        </section>
      )}

      {/* ═══ 계정 삭제 ═══ */}
      <div className="pt-2 pb-8">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive text-sm">
              계정 삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>계정을 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                모든 대화 기록과 사주 정보가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없어요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteAccount}
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
