"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { saveProfile, loadProfile, type StoredProfile } from "@/lib/storage"

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

export default function OnboardingPage() {
  const router = useRouter()
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [hour, setHour] = useState("-1")
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar")
  const [gender, setGender] = useState<"M" | "F" | "">("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // 이미 프로필이 있으면 프로필 페이지로 리다이렉트
  useEffect(() => {
    const existing = loadProfile()
    if (existing) {
      router.replace("/profile")
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)

    if (!y || !m || !d) {
      setError("생년월일을 입력해주세요")
      return
    }

    if (y < 1900 || y > 2050) {
      setError("1900~2050년 사이의 생년을 입력해주세요")
      return
    }

    if (m < 1 || m > 12) {
      setError("올바른 월(1~12)을 입력해주세요")
      return
    }

    if (d < 1 || d > 31) {
      setError("올바른 일(1~31)을 입력해주세요")
      return
    }

    setIsLoading(true)

    try {
      const birthInfo = {
        year: y,
        month: m,
        day: d,
        hour: hour === "-1" ? undefined : parseInt(hour),
        isLunar: calendarType === "lunar",
        gender: gender || undefined,
      }

      // 사주 계산 API 호출
      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(birthInfo),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "사주 계산에 실패했습니다")
      }

      const data = await res.json()

      // 로컬 저장
      const storedProfile: StoredProfile = {
        birthInfo,
        sajuProfile: data.profile,
        createdAt: new Date().toISOString(),
      }
      saveProfile(storedProfile)

      // 프로필 페이지로 이동
      router.push("/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">한 수</h1>
          <p className="text-muted-foreground text-sm">
            AI 사주 라이프 코치
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            사주로 읽는 오늘의 한 수.<br />
            지금 당신에게 필요한 구체적인 행동을 알려드립니다.
          </p>
        </div>

        {/* 입력 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">생년월일시를 알려주세요</CardTitle>
            <CardDescription>
              정확한 사주 분석을 위해 필요합니다. 태어난 시간을 모르면 건너뛸 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 양력/음력 */}
              <div className="space-y-2">
                <Label>달력</Label>
                <RadioGroup
                  value={calendarType}
                  onValueChange={v => setCalendarType(v as "solar" | "lunar")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solar" id="solar" />
                    <Label htmlFor="solar" className="font-normal cursor-pointer">양력</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lunar" id="lunar" />
                    <Label htmlFor="lunar" className="font-normal cursor-pointer">음력</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 생년월일 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="year">년</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="1990"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    min={1900}
                    max={2050}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">월</Label>
                  <Input
                    id="month"
                    type="number"
                    placeholder="1"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    min={1}
                    max={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day">일</Label>
                  <Input
                    id="day"
                    type="number"
                    placeholder="15"
                    value={day}
                    onChange={e => setDay(e.target.value)}
                    min={1}
                    max={31}
                  />
                </div>
              </div>

              {/* 태어난 시간 */}
              <div className="space-y-2">
                <Label>태어난 시간</Label>
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

              {/* 성별 (선택) */}
              <div className="space-y-2">
                <Label>성별 <span className="text-muted-foreground text-xs">(선택)</span></Label>
                <RadioGroup
                  value={gender}
                  onValueChange={v => setGender(v as "M" | "F")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="M" id="male" />
                    <Label htmlFor="male" className="font-normal cursor-pointer">남성</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="F" id="female" />
                    <Label htmlFor="female" className="font-normal cursor-pointer">여성</Label>
                  </div>
                </RadioGroup>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "사주를 분석하고 있어요..." : "내 사주 보기"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          입력한 정보는 브라우저에만 저장되며, 서버에 보관되지 않습니다.
        </p>
      </div>
    </div>
  )
}
