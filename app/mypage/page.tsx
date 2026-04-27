"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserId, clearUser } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { pillarToHanja, getSiLabel, STEM_MAP, BRANCH_MAP, ELEMENTS, ELEMENT_COLORS, ELEMENT_BG, ELEMENT_EMOJI, TEN_GOD_MAP, getIlganElement, type Element, type TenGodKey } from "@/lib/saju-data"

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

// 토픽별 관련 십신 매핑
const TOPIC_TEN_GODS: { emoji: string; label: string; tenGods: TenGodKey[]; description: string }[] = [
  { emoji: "💼", label: "직업·진로", tenGods: ["정관", "편관", "식신", "상관"], description: "직업과 사회적 역할에 영향을 주는 십신입니다" },
  { emoji: "💰", label: "재정·금전", tenGods: ["정재", "편재"], description: "재물 운과 경제 활동에 영향을 주는 십신입니다" },
  { emoji: "🤝", label: "인간관계", tenGods: ["비견", "겁재"], description: "대인관계와 사회적 교류에 영향을 주는 십신입니다" },
  { emoji: "📚", label: "학업·성장", tenGods: ["정인", "편인"], description: "배움과 지적 성장에 영향을 주는 십신입니다" },
]

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
    fetch(`/api/user?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => {
        setUser(data.user)
        // 사주 프로필 fetch
        fetch(`/api/saju-profile?user_id=${id}`)
          .then(r => r.ok ? r.json() : null)
          .then(p => p && setProfile(p))
          .catch(() => {})
      })
      .catch(() => router.replace("/onboarding"))
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

  function cancelEditing() {
    setEditing(false)
    setError("")
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
      // 사주 프로필 새로고침
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

  function handleReset() {
    if (confirm("대화 기록을 모두 지우고 새로 시작할까요?")) {
      clearUser()
      router.replace("/")
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100svh-49px)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    )
  }

  const pillars = [
    { label: "시주", value: user.si_pillar || "—" },
    { label: "일주", value: user.il_pillar },
    { label: "월주", value: user.wol_pillar },
    { label: "년주", value: user.yeon_pillar },
  ]

  return (
    <div className="mx-auto max-w-[918px] px-5 py-8 space-y-6">
      {/* 프로필 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {user.display_name || "사용자"}
        </h1>
        {user.saju_summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {user.saju_summary}
          </p>
        )}
      </div>

      {/* 일간 특성 */}
      {user.ilgan && (() => {
        const dayStem = user.ilgan[0]
        const stemInfo = dayStem ? STEM_MAP[dayStem] : null
        const element = getIlganElement(user.ilgan)
        const avatarEmoji = element ? ELEMENT_EMOJI[element] : "👤"
        const elementInfo = element ? ELEMENTS[element] : null

        return stemInfo ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">일간 특성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center border-2 border-primary/20 text-2xl">
                  {avatarEmoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-2xl font-bold ${ELEMENT_COLORS[stemInfo.element]}`}>{stemInfo.hanja}</span>
                    <span className="text-base font-medium">{user.ilgan}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ELEMENT_BG[stemInfo.element]} ${ELEMENT_COLORS[stemInfo.element]}`}>
                      {ELEMENTS[stemInfo.element].name}
                    </span>
                    <span className="text-xs text-muted-foreground">{stemInfo.yinYang}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stemInfo.description}</p>
                </div>
              </div>
              {elementInfo && (
                <div className={`rounded-xl p-4 ${ELEMENT_BG[stemInfo.element]} border border-current/10`}>
                  <p className={`text-sm font-medium ${ELEMENT_COLORS[stemInfo.element]} mb-1`}>{elementInfo.name} ({stemInfo.element})</p>
                  <p className="text-sm text-muted-foreground">{elementInfo.nature}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null
      })()}

      {/* 사주 4기둥 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">사주 명식</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            {pillars.map(p => {
              if (p.value === "—") {
                return (
                  <div key={p.label} className="rounded-lg border border-border bg-background p-3 space-y-1">
                    <p className="text-[11px] text-muted-foreground">{p.label}</p>
                    <p className="text-lg text-muted-foreground">—</p>
                  </div>
                )
              }
              const stem = STEM_MAP[p.value[0]]
              const branch = BRANCH_MAP[p.value[1]]
              if (!stem || !branch) return null
              return (
                <div key={p.label} className="rounded-lg border border-border bg-background p-3 space-y-1">
                  <p className="text-[11px] text-muted-foreground">{p.label}</p>
                  <div>
                    <span className={`text-xl font-bold ${ELEMENT_COLORS[stem.element]}`}>{stem.hanja}</span>
                    <span className={`text-xs ml-0.5 ${ELEMENT_COLORS[stem.element]}`}>{stem.hangul}</span>
                  </div>
                  <div>
                    <span className={`text-xl font-bold ${ELEMENT_COLORS[branch.element]}`}>{branch.hanja}</span>
                    <span className={`text-xs ml-0.5 ${ELEMENT_COLORS[branch.element]}`}>{branch.hangul}</span>
                  </div>
                  <div className="flex justify-center gap-1 pt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${ELEMENT_BG[stem.element]} ${ELEMENT_COLORS[stem.element]}`}>{stem.element}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${ELEMENT_BG[branch.element]} ${ELEMENT_COLORS[branch.element]}`}>{branch.element}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 현재 대운 */}
          {user.daeun_current && (() => {
            const dStem = STEM_MAP[user.daeun_current[0]]
            return (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                <span className="text-base shrink-0">🌊</span>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">현재 대운</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-medium">{user.daeun_current}</span>
                    <span className="text-sm text-muted-foreground">{pillarToHanja(user.daeun_current)}</span>
                    {dStem && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${ELEMENT_BG[dStem.element]} ${ELEMENT_COLORS[dStem.element]}`}>
                        {dStem.element}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* ── 사주 리포트 ── */}
      {profile && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">📋 사주 리포트</h2>

          {/* 성격·기질 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">🧬 성격·기질</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                <p className="text-sm font-medium mb-1">
                  {profile.dayStem} — {profile.dayStemDescription}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.dayStemPersonality}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 오행 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">🔥 오행 분포</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 바 차트 */}
              <div className="space-y-2.5">
                {(["목", "화", "토", "금", "수"] as Element[]).map(el => {
                  const count = profile.elementCounts[el] || 0
                  const maxCount = Math.max(...Object.values(profile.elementCounts), 1)
                  const pct = (count / maxCount) * 100
                  return (
                    <div key={el} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center">{ELEMENT_EMOJI[el]}</span>
                      <span className={`text-xs font-medium w-16 ${ELEMENT_COLORS[el]}`}>
                        {ELEMENTS[el].name}
                      </span>
                      <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${ELEMENT_BG[el]} border ${
                            el === profile.dominantElement ? "border-current/30" : "border-transparent"
                          }`}
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-4 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>

              {/* 강한/약한 오행 */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-3 ${ELEMENT_BG[profile.dominantElement]} border border-current/10`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">가장 강한 오행</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ELEMENT_EMOJI[profile.dominantElement]}</span>
                    <div>
                      <p className={`text-sm font-bold ${ELEMENT_COLORS[profile.dominantElement]}`}>
                        {ELEMENTS[profile.dominantElement].name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{ELEMENTS[profile.dominantElement].nature}</p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-xl p-3 ${ELEMENT_BG[profile.weakestElement]} border border-current/10`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">가장 약한 오행</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ELEMENT_EMOJI[profile.weakestElement]}</span>
                    <div>
                      <p className={`text-sm font-bold ${ELEMENT_COLORS[profile.weakestElement]}`}>
                        {ELEMENTS[profile.weakestElement].name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{ELEMENTS[profile.weakestElement].nature}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 용신 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">⭐ 용신 (보완 오행)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`rounded-xl p-4 ${ELEMENT_BG[profile.usefulGod]} border border-current/10`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{ELEMENT_EMOJI[profile.usefulGod]}</span>
                  <div>
                    <p className={`text-base font-bold ${ELEMENT_COLORS[profile.usefulGod]}`}>
                      {ELEMENTS[profile.usefulGod].name}
                    </p>
                    <p className="text-xs text-muted-foreground">{ELEMENTS[profile.usefulGod].nature}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.usefulGodReason}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border">
                  <span>🎨</span>
                  <span>행운 색상: {ELEMENTS[profile.usefulGod].color}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border">
                  <span>🧭</span>
                  <span>행운 방향: {ELEMENTS[profile.usefulGod].direction}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 토픽별 십신 분석 (직업, 재정, 인간관계, 학업) */}
          {TOPIC_TEN_GODS.map(topic => (
            <Card key={topic.label}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {topic.emoji} {topic.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{topic.description}</p>
                <div className="space-y-2.5">
                  {topic.tenGods.map(tgName => {
                    const tg = TEN_GOD_MAP[tgName]
                    if (!tg) return null
                    const isDominant = profile.dominantTenGods.includes(tgName)
                    return (
                      <div
                        key={tgName}
                        className={`rounded-xl border p-3.5 ${
                          isDominant
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-background"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{tg.name}</span>
                            <span className="text-xs text-muted-foreground">{tg.hanja}</span>
                            {isDominant && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                내 사주에 강함
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {tg.keywords.map(kw => (
                            <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {kw}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-green-600 dark:text-green-400 mb-0.5 font-medium">👍 강점</p>
                            <p className="text-muted-foreground">{tg.positive}</p>
                          </div>
                          <div>
                            <p className="text-amber-600 dark:text-amber-400 mb-0.5 font-medium">⚠️ 주의</p>
                            <p className="text-muted-foreground">{tg.negative}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          📌 영향 분야: {tg.lifeArea}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 오늘의 운세 */}
          {profile.todayPillar && profile.todayInteraction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">📅 오늘의 운세</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">오늘 일진</p>
                    <p className="text-lg font-bold">{profile.todayPillar.pillar}</p>
                    <p className="text-xs text-muted-foreground">{profile.todayPillar.pillarHanja}</p>
                  </div>
                  <div className="flex gap-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${ELEMENT_BG[profile.todayPillar.stemElement]} ${ELEMENT_COLORS[profile.todayPillar.stemElement]}`}>
                      {ELEMENT_EMOJI[profile.todayPillar.stemElement]} {profile.todayPillar.stemElement}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${ELEMENT_BG[profile.todayPillar.branchElement]} ${ELEMENT_COLORS[profile.todayPillar.branchElement]}`}>
                      {ELEMENT_EMOJI[profile.todayPillar.branchElement]} {profile.todayPillar.branchElement}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <p className="text-sm leading-relaxed">{profile.todayInteraction}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 기본 정보 — 보기/편집 모드 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">기본 정보</CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={startEditing} className="text-muted-foreground hover:text-foreground">
              ✏️ 수정
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              {/* 닉네임 */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">닉네임</Label>
                <Input
                  placeholder="닉네임 (선택)"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                />
              </div>

              {/* 달력 */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">달력</Label>
                <RadioGroup
                  value={calendarType}
                  onValueChange={v => setCalendarType(v as "solar" | "lunar")}
                  className="flex gap-3"
                >
                  {[
                    { value: "solar", label: "양력" },
                    { value: "lunar", label: "음력" },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-all text-sm ${
                        calendarType === opt.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* 생년월일 */}
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

              {/* 태어난 시간 */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">태어난 시간</Label>
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger>
                    <SelectValue placeholder="시간을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map(h => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 성별 */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">성별</Label>
                <RadioGroup
                  value={gender}
                  onValueChange={v => setGender(v as "male" | "female")}
                  className="flex gap-3"
                >
                  {[
                    { value: "male", label: "남성" },
                    { value: "female", label: "여성" },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-all text-sm ${
                        gender === opt.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* 저장/취소 버튼 */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={cancelEditing} disabled={saving} className="flex-1">
                  ❌ 취소
                </Button>
                <Button onClick={handleSave} disabled={saving || !canSave()} className="flex-1">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      사주 재계산 중...
                    </span>
                  ) : (
                    "저장"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-base">📅</span>
                <span>
                  {user.birth_year}년 {user.birth_month}월 {user.birth_day}일
                  <span className="ml-1.5 text-muted-foreground">
                    ({user.is_lunar ? "음력" : "양력"})
                  </span>
                </span>
              </div>
              {user.birth_hour !== null && user.birth_hour >= 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-base">⏰</span>
                  <span>
                    태어난 시: {user.si_pillar ? getSiLabel(user.si_pillar) : `${user.birth_hour}시`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-base">👤</span>
                <span>{user.gender === "male" ? "남성" : "여성"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 리셋 */}
      <div className="pt-4">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleReset}
        >
          🗑️ 기억을 지우고 새로 시작
        </Button>
      </div>
    </div>
  )
}
