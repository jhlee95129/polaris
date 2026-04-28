"use client"

import { useState, useEffect, useRef, Fragment, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getUserId, setUserId } from "@/lib/storage"
import { ChevronRight, ChevronLeft, Star, Check } from "lucide-react"

// ─── 상수 ───

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

const STEP_LABELS = ["이름", "생일", "시작"]

// ─── 엔트리 ───

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}

// ─── 프로그레스 인디케이터 ───

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center w-full max-w-[300px] mx-auto">
      {STEP_LABELS.map((label, i) => (
        <Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i < current
                  ? "bg-primary text-primary-foreground"
                  : i === current
                    ? "bg-primary text-primary-foreground animate-[pulseGlow_2s_ease-in-out_infinite]"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < current ? (
                <Check className="h-4 w-4 animate-[checkmark_0.3s_ease-out]" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[11px] transition-colors duration-300 ${
                i <= current ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>

          {i < STEP_LABELS.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-3 -mt-5 rounded-full transition-colors duration-500 ${
                i < current ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
}

// ─── 로딩 화면 ───

function LoadingScreen({ nickname }: { nickname: string }) {
  const [textIdx, setTextIdx] = useState(0)
  const texts = [
    `${nickname}님의 사주를 읽고 있어요...`,
    "만세력으로 사주팔자를 계산하고 있어요",
    "오행의 균형을 살피고 있어요",
    "거의 다 됐어!",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIdx(prev => (prev + 1) % texts.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [texts.length])

  return (
    <div className="flex flex-col items-center justify-center gap-8 animate-[fadeInUp_0.5s_ease-out]">
      {/* 코스믹 오브 */}
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 flex items-center justify-center">
          <Star className="h-10 w-10 text-primary animate-[twinkle_2s_ease-in-out_infinite]" />
        </div>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="orbit-dot text-primary/60"
            style={{
              "--orbit-r": `${36 + i * 6}px`,
              "--orbit-dur": `${6 + i * 2}s`,
              "--dot-size": `${3 + (i % 3)}px`,
              animationDelay: `${i * -1.2}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <p
        key={textIdx}
        className="text-sm text-muted-foreground animate-[fadeInUp_0.4s_ease-out] text-center"
      >
        {texts[textIdx]}
      </p>

      <div className="flex gap-3">
        {["時", "日", "月", "年"].map((char, i) => (
          <div
            key={char}
            className="flex h-14 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-lg font-bold text-primary animate-[fadeInUp_0.4s_ease-out]"
            style={{ animationDelay: `${0.6 + i * 0.15}s`, animationFillMode: "both" }}
          >
            {char}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 메인 컨텐츠 ───

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<"form" | "loading">("form")

  const [nickname, setNickname] = useState(searchParams.get("nickname") || "")
  const [nicknameError, setNicknameError] = useState("")
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [hour, setHour] = useState("-1")
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar")
  const [isLeapMonth, setIsLeapMonth] = useState(false)
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [error, setError] = useState("")

  const [isChecking, setIsChecking] = useState(false)
  const [shakeField, setShakeField] = useState("")
  const nicknameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (getUserId()) {
      router.replace("/dashboard")
    }
  }, [router])

  useEffect(() => {
    // 스텝 전환 시 이전 포커스 해제 + 새 입력필드 포커스
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    const timer = setTimeout(() => {
      if (step === 0) nicknameRef.current?.focus()
      else if (step === 1) document.getElementById("year")?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [step])

  useEffect(() => {
    if (calendarType === "solar") setIsLeapMonth(false)
  }, [calendarType])

  function canProceedStep1() {
    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)
    return y >= 1900 && y <= 2050 && m >= 1 && m <= 12 && d >= 1 && d <= 31
  }

  function triggerShake(field: string) {
    setShakeField(field)
    setTimeout(() => setShakeField(""), 400)
  }

  async function checkNicknameAndProceed() {
    const name = nickname.trim()
    if (!name) {
      setNicknameError("닉네임을 입력해주세요")
      triggerShake("nickname")
      return false
    }
    setIsChecking(true)
    setNicknameError("")
    try {
      const res = await fetch(`/api/user/lookup?name=${encodeURIComponent(name)}`)
      const data = await res.json()
      if (data.found) {
        setNicknameError("이미 사용 중인 닉네임이에요")
        triggerShake("nickname")
        setIsChecking(false)
        return false
      }
    } catch {
      setNicknameError("확인에 실패했어요. 다시 시도해주세요")
      setIsChecking(false)
      return false
    }
    setIsChecking(false)
    return true
  }

  async function handleSubmit() {
    if (!gender) {
      setError("성별을 선택해주세요")
      triggerShake("gender")
      return
    }
    setError("")
    setPhase("loading")

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: nickname.trim(),
          birth_year: parseInt(year),
          birth_month: parseInt(month),
          birth_day: parseInt(day),
          birth_hour: hour === "-1" ? undefined : parseInt(hour),
          is_lunar: calendarType === "lunar",
          is_leap_month: calendarType === "lunar" && isLeapMonth,
          gender,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "온보딩에 실패했습니다")
      }

      const data = await res.json()
      setUserId(data.user_id)
      setTimeout(() => router.push("/dashboard"), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다")
      setPhase("form")
    }
  }

  const bubbleMessages = [
    "안녕, 나는 폴라리스야. 뭐라고 부를까?",
    `${nickname || "친구"}의 생년월일을 알려줘.`,
    "거의 다 왔어! 마지막으로 두 가지만.",
  ]

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="flex flex-1 flex-col items-center justify-center p-5">
        <div className="w-full max-w-md space-y-8">
          {phase === "form" ? (
            <>
              {/* 브랜드 */}
              <div className="text-center">
                <span className="font-[family-name:var(--font-logo)] text-2xl text-foreground" style={{ WebkitTextStroke: "1px currentColor" }}>폴라리스</span>
              </div>

              <StepIndicator current={step} />

              {/* 말풍선 */}
              <div
                key={`bubble-${step}`}
                className="flex items-start gap-2.5 animate-[fadeInUp_0.35s_ease-out]"
              >
                <div className="shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30 shadow-sm">
                    <span className="text-lg leading-none">⭐</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">폴라리스</span>
                  <div className="relative">
                    <div className="absolute -left-[6px] top-2 h-2.5 w-2.5 rotate-45 bg-card border-l border-b border-border/60" />
                    <div className="relative rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 shadow-sm">
                      <p className="text-sm leading-relaxed">{bubbleMessages[step]}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 슬라이딩 트랙 */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${step * 100}%)` }}
                >
                  {/* ━━━ Step 0: 닉네임 ━━━ */}
                  <div className="w-full flex-shrink-0 px-1 pt-1">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">닉네임</Label>
                        <div
                          className={`onboarding-input rounded-2xl transition-all ${
                            shakeField === "nickname" ? "animate-[shake_0.4s_ease-out]" : ""
                          }`}
                        >
                          <Input
                            ref={nicknameRef}
                            placeholder="뭐라고 부를까?"
                            value={nickname}
                            maxLength={10}
                            onChange={e => {
                              setNickname(e.target.value)
                              setNicknameError("")
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                if (nickname.trim()) {
                                  checkNicknameAndProceed().then(ok => {
                                    if (ok) { setError(""); setStep(1) }
                                  })
                                }
                              }
                            }}
                            className="h-14 rounded-2xl text-center text-base"
                            tabIndex={step === 0 ? 0 : -1}
                          />
                        </div>
                        {nicknameError && (
                          <p className="text-xs text-destructive animate-[fadeInUp_0.2s_ease-out]">
                            {nicknameError}
                          </p>
                        )}
                      </div>

                      <Button
                        className="w-full h-14 rounded-2xl text-base"
                        onClick={async () => {
                          const ok = await checkNicknameAndProceed()
                          if (ok) { setError(""); setStep(1) }
                        }}
                        disabled={!nickname.trim() || isChecking}
                        tabIndex={step === 0 ? 0 : -1}
                      >
                        {isChecking ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            확인 중...
                          </span>
                        ) : (
                          <>
                            다음
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* ━━━ Step 1: 생년월일 ━━━ */}
                  <div className="w-full flex-shrink-0 px-1 pt-1">
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
                              className={`flex-1 flex items-center justify-center rounded-2xl border h-14 cursor-pointer transition-all active:scale-[0.97] ${
                                calendarType === opt.value
                                  ? "border-primary bg-primary/5 text-primary font-medium shadow-sm"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <RadioGroupItem value={opt.value} className="sr-only absolute" />
                              <span className="text-sm">{opt.label}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* 윤달 */}
                      <div className={`leap-month-container ${calendarType === "lunar" ? "visible" : ""}`}>
                        <div>
                          <label className="flex items-center gap-3 cursor-pointer py-1">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={isLeapMonth}
                                onChange={e => setIsLeapMonth(e.target.checked)}
                                className="peer sr-only"
                                tabIndex={step === 1 && calendarType === "lunar" ? 0 : -1}
                              />
                              <div className="h-5 w-5 rounded-md border-2 border-border bg-background transition-all peer-checked:border-primary peer-checked:bg-primary" />
                              <Check className="absolute inset-0 m-auto h-3 w-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100" />
                            </div>
                            <span className="text-sm text-muted-foreground">윤달이에요</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">생년월일</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: "year", placeholder: "1990", value: year, setter: setYear, min: 1900, max: 2050, label: "년" },
                            { id: "month", placeholder: "1", value: month, setter: setMonth, min: 1, max: 12, label: "월" },
                            { id: "day", placeholder: "15", value: day, setter: setDay, min: 1, max: 31, label: "일" },
                          ].map(field => (
                            <div key={field.id} className="space-y-1.5">
                              <span className="text-[11px] text-muted-foreground/70">{field.label}</span>
                              <div className="onboarding-input rounded-2xl">
                                <Input
                                  id={field.id}
                                  type="number"
                                  inputMode="numeric"
                                  placeholder={field.placeholder}
                                  value={field.value}
                                  onChange={e => field.setter(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter" && field.id === "day" && canProceedStep1()) {
                                      setError("")
                                      setStep(2)
                                    }
                                  }}
                                  min={field.min}
                                  max={field.max}
                                  className="h-14 rounded-2xl text-center text-base"
                                  tabIndex={step === 1 ? 0 : -1}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {error && step === 1 && (
                        <p className="text-sm text-destructive animate-[fadeInUp_0.2s_ease-out]">{error}</p>
                      )}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="h-14 w-14 rounded-2xl"
                          onClick={() => setStep(0)}
                          tabIndex={step === 1 ? 0 : -1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          className="flex-1 h-14 rounded-2xl text-base"
                          onClick={() => {
                            if (!canProceedStep1()) {
                              setError("올바른 생년월일을 입력해주세요")
                              return
                            }
                            setError("")
                            setStep(2)
                          }}
                          disabled={!year || !month || !day}
                          tabIndex={step === 1 ? 0 : -1}
                        >
                          다음
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* ━━━ Step 2: 시간 + 성별 ━━━ */}
                  <div className="w-full flex-shrink-0 px-1 pt-1">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">태어난 시간</Label>
                        <div className="onboarding-input rounded-2xl">
                          <Select value={hour} onValueChange={setHour}>
                            <SelectTrigger className="h-14 rounded-2xl" tabIndex={step === 2 ? 0 : -1}>
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
                        {hour === "-1" && (
                          <p className="text-[11px] text-muted-foreground/70">
                            시간을 모르면 시주가 빠져서 일부 해석이 제한돼요
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">성별 (대운 계산에 필요)</Label>
                        <RadioGroup
                          value={gender}
                          onValueChange={v => { setGender(v as "male" | "female"); setError("") }}
                          className="flex gap-3"
                        >
                          <div className={shakeField === "gender" ? "contents animate-[shake_0.4s_ease-out]" : "contents"}>
                            {[
                              { value: "male", label: "남성" },
                              { value: "female", label: "여성" },
                            ].map(opt => (
                              <label
                                key={opt.value}
                                className={`flex-1 flex items-center justify-center rounded-2xl border h-14 cursor-pointer transition-all active:scale-[0.97] ${
                                  gender === opt.value
                                    ? "border-primary bg-primary/5 text-primary font-medium shadow-sm"
                                    : "border-border hover:border-primary/30"
                                }`}
                              >
                                <RadioGroupItem value={opt.value} className="sr-only absolute" />
                                <span className="text-sm">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      {error && step === 2 && (
                        <p className="text-sm text-destructive animate-[fadeInUp_0.2s_ease-out]">{error}</p>
                      )}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="h-14 w-14 rounded-2xl"
                          onClick={() => setStep(1)}
                          tabIndex={step === 2 ? 0 : -1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          className="flex-1 h-14 rounded-2xl text-base shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                          onClick={handleSubmit}
                          disabled={!gender}
                          tabIndex={step === 2 ? 0 : -1}
                        >
                          <Star className="h-4 w-4 mr-1.5" />
                          폴라리스 시작하기
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-muted-foreground/70">
                입력한 정보는 사주 계산에만 사용됩니다.
              </p>
            </>
          ) : (
            <LoadingScreen nickname={nickname} />
          )}
        </div>
      </div>
    </div>
  )
}
