"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getUserId, setUserId } from "@/lib/storage"
import { ChevronRight, ChevronLeft, Star } from "lucide-react"

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

const STEP_MESSAGES = [
  "안녕, 나는 폴라리스야. 먼저 생년월일을 알려줘.",
  "태어난 시간을 알면 더 정확해져.",
  "성별만 알려주면 바로 시작할게!",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState("")
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [hour, setHour] = useState("-1")
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar")
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (getUserId()) {
      router.replace("/chat")
    }
  }, [router])

  function canProceedStep0() {
    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)
    return y >= 1900 && y <= 2050 && m >= 1 && m <= 12 && d >= 1 && d <= 31
  }

  async function handleSubmit() {
    if (!gender) {
      setError("성별을 선택해주세요 (대운 계산에 필요해요)")
      return
    }
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        throw new Error(data.error || "온보딩에 실패했습니다")
      }

      const data = await res.json()
      setUserId(data.user_id)
      router.push("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="flex flex-1 flex-col items-center justify-center p-5">
        <div className="w-full max-w-md space-y-8">
          {/* 브랜드 마크 */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2">
              <Star className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">폴라리스</span>
            </div>
          </div>

          {/* 프로그레스 */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-8 bg-primary"
                    : i < step
                    ? "w-4 bg-primary/40"
                    : "w-4 bg-border"
                }`}
              />
            ))}
          </div>

          {/* 대화 버블 */}
          <div className="rounded-2xl rounded-tl-sm border border-border bg-card p-4 shadow-sm">
            <p className="text-sm leading-relaxed">{STEP_MESSAGES[step]}</p>
          </div>

          {/* Step 0: 닉네임 + 생년월일 */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">닉네임 (선택)</Label>
                <Input
                  placeholder="뭐라고 부를까?"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                />
              </div>

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
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                        calendarType === opt.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`cal-${opt.value}`} className="sr-only" />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-xs text-muted-foreground">년</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="1990"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    min={1900}
                    max={2050}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month" className="text-xs text-muted-foreground">월</Label>
                  <Input
                    id="month"
                    type="number"
                    placeholder="1"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    min={1}
                    max={12}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day" className="text-xs text-muted-foreground">일</Label>
                  <Input
                    id="day"
                    type="number"
                    placeholder="15"
                    value={day}
                    onChange={e => setDay(e.target.value)}
                    min={1}
                    max={31}
                    className="text-center"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  if (canProceedStep0()) {
                    setError("")
                    setStep(1)
                  } else {
                    setError("올바른 생년월일을 입력해주세요")
                  }
                }}
                disabled={!year || !month || !day}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 1: 태어난 시간 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">태어난 시간</Label>
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="h-12">
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
                {hour === "-1" && (
                  <p className="text-xs text-muted-foreground/70">
                    시간을 모르면 시주가 빠져서 일부 해석이 제한돼요
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(0)}
                  className="w-12"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={() => setStep(2)}
                >
                  다음
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: 성별 + 제출 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">성별 (대운 계산에 필요)</Label>
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
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                        gender === opt.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`gen-${opt.value}`} className="sr-only" />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="w-12"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isLoading || !gender}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      사주를 읽고 있어요...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      폴라리스 시작하기
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-[11px] text-muted-foreground/70">
            입력한 정보는 사주 계산에만 사용됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
