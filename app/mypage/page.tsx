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
import { Separator } from "@/components/ui/separator"
import { Trash2, Calendar, User as UserIcon, Pencil, X, Loader2 } from "lucide-react"
import { pillarToHanja, getSiLabel } from "@/lib/saju-data"

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

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<FullUserData | null>(null)
  const [loading, setLoading] = useState(true)

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
      .then(data => setUser(data.user))
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

      {/* 사주 4기둥 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">내 명식</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-center">
            {pillars.map(p => (
              <div key={p.label} className="rounded-lg border border-border bg-background p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground">{p.label}</p>
                <p className="text-lg font-semibold">{p.value}</p>
                {p.value !== "—" && (
                  <p className="text-sm font-medium text-primary/70">{pillarToHanja(p.value)}</p>
                )}
              </div>
            ))}
          </div>

          {(user.ilgan || user.daeun_current) && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-6 text-sm">
                {user.ilgan && (
                  <div>
                    <span className="text-muted-foreground">일간: </span>
                    <span className="font-medium text-primary">{user.ilgan}</span>
                  </div>
                )}
                {user.daeun_current && (
                  <div>
                    <span className="text-muted-foreground">현재 대운: </span>
                    <span className="font-medium">{user.daeun_current}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 기본 정보 — 보기/편집 모드 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">기본 정보</CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={startEditing} className="text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              수정
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
                  <X className="h-4 w-4 mr-1.5" />
                  취소
                </Button>
                <Button onClick={handleSave} disabled={saving || !canSave()} className="flex-1">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {user.birth_year}년 {user.birth_month}월 {user.birth_day}일
                  <span className="ml-1.5 text-muted-foreground">
                    ({user.is_lunar ? "음력" : "양력"})
                  </span>
                </span>
              </div>
              {user.birth_hour !== null && user.birth_hour >= 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    태어난 시: {user.si_pillar ? getSiLabel(user.si_pillar) : `${user.birth_hour}시`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
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
          <Trash2 className="h-4 w-4 mr-2" />
          기억을 지우고 새로 시작
        </Button>
      </div>
    </div>
  )
}
