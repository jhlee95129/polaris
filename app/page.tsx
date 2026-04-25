"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { saveProfile, loadProfile, type StoredProfile } from "@/lib/storage"
import { ChevronRight, ChevronLeft, Sparkles, ArrowRight } from "lucide-react"

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

const EXAMPLE_CHIPS = [
  { text: "회사 때려치울까", emoji: "🏢" },
  { text: "이 사람이 맞을까", emoji: "❤️" },
  { text: "돈이 안 모여", emoji: "💰" },
  { text: "아무것도 하기 싫어", emoji: "🤷" },
]

const ONBOARDING_MESSAGES = [
  "먼저 생년월일을 알려주세요.",
  "태어난 시간을 알면 더 정확해요.",
  "마지막이에요. 바로 시작합니다!",
]

type Phase = "hero" | "onboarding"

export default function LandingPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("hero")
  const [pendingQuestion, setPendingQuestion] = useState("")

  // 온보딩 상태
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [hour, setHour] = useState("-1")
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar")
  const [gender, setGender] = useState<"M" | "F" | "">("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const existing = loadProfile()
    if (existing) {
      router.replace("/home")
    }
  }, [router])

  function startOnboarding(question?: string) {
    if (question) setPendingQuestion(question)
    setPhase("onboarding")
  }

  function canProceedStep0() {
    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)
    return y >= 1900 && y <= 2050 && m >= 1 && m <= 12 && d >= 1 && d <= 31
  }

  async function handleSubmit() {
    setError("")
    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)

    if (!y || !m || !d) {
      setError("생년월일을 입력해주세요")
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

      const storedProfile: StoredProfile = {
        birthInfo,
        sajuProfile: data.profile,
        createdAt: new Date().toISOString(),
      }
      saveProfile(storedProfile)

      // 고민을 적었으면 바로 상담으로, 아니면 홈으로
      if (pendingQuestion.trim()) {
        router.push(`/ask?q=${encodeURIComponent(pendingQuestion.trim())}`)
      } else {
        router.push("/home")
      }
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
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">한수</span>
            </div>
          </div>

          {phase === "hero" ? (
            <>
              {/* 태그라인 */}
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  내 사주는 알아.<br />
                  <span className="text-primary">근데 오늘 뭘 해야 하지?</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  사주 명리학 기반 AI 코치가 구체적인 행동을 알려드립니다
                </p>
              </div>

              {/* Hero textarea */}
              <div className="relative">
                <Textarea
                  value={pendingQuestion}
                  onChange={e => setPendingQuestion(e.target.value)}
                  onFocus={() => {/* textarea에 포커스만으로는 온보딩 시작 안함 */}}
                  placeholder="고민을 적어보세요..."
                  className="min-h-[120px] resize-none pr-24 text-base"
                  rows={4}
                />
                <Button
                  size="sm"
                  className="absolute bottom-3 right-3"
                  onClick={() => startOnboarding(pendingQuestion)}
                >
                  시작하기
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>

              {/* 예시 칩 */}
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => startOnboarding(chip.text)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.text}</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-[11px] text-muted-foreground/70">
                생년월일 입력 후 바로 시작 · 정보는 브라우저에만 저장
              </p>
            </>
          ) : (
            <>
              {/* 온보딩 프로그레스 */}
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === onboardingStep
                        ? "w-8 bg-primary"
                        : i < onboardingStep
                        ? "w-4 bg-primary/40"
                        : "w-4 bg-border"
                    }`}
                  />
                ))}
              </div>

              {/* 대화 버블 */}
              <div className="rounded-2xl rounded-tl-sm border border-border bg-card p-4 shadow-sm">
                <p className="text-sm leading-relaxed">{ONBOARDING_MESSAGES[onboardingStep]}</p>
              </div>

              {/* 고민 미리보기 */}
              {pendingQuestion.trim() && (
                <div className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                  &ldquo;{pendingQuestion}&rdquo; — 분석 준비 중
                </div>
              )}

              {/* Step 0: 생년월일 */}
              {onboardingStep === 0 && (
                <div className="space-y-5">
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

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setPhase("hero")}
                      className="w-12"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={() => {
                        if (canProceedStep0()) {
                          setError("")
                          setOnboardingStep(1)
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
                </div>
              )}

              {/* Step 1: 태어난 시간 */}
              {onboardingStep === 1 && (
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
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setOnboardingStep(0)}
                      className="w-12"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={() => setOnboardingStep(2)}
                    >
                      다음
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: 성별 + 분석 시작 */}
              {onboardingStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      성별 <span className="text-muted-foreground/60">(선택)</span>
                    </Label>
                    <RadioGroup
                      value={gender}
                      onValueChange={v => setGender(v as "M" | "F")}
                      className="flex gap-3"
                    >
                      {[
                        { value: "M", label: "남성" },
                        { value: "F", label: "여성" },
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
                      onClick={() => setOnboardingStep(1)}
                      className="w-12"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          사주를 읽고 있어요...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          {pendingQuestion.trim() ? "분석하고 바로 상담" : "내 사주 분석 시작"}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-center text-[11px] text-muted-foreground/70">
                입력한 정보는 브라우저에만 저장되며, 서버에 보관되지 않습니다.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
