"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loadProfile, saveConsultation, generateId } from "@/lib/storage"
import { CHARACTERS, type CharacterType } from "@/lib/prompts"
import { CONSULT_CATEGORIES, URGENCY_OPTIONS, buildQuestionFromFlow, findCategory, type ConsultCategory, type ConsultSituation, type UrgencyOption } from "@/lib/consult-flow"
import type { CoachingCard } from "@/lib/claude"
import type { StoredProfile } from "@/lib/storage"
import { ChevronLeft, Sparkles, RefreshCw, AlertCircle, MessageCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

type Step = "category" | "situation" | "urgency" | "detail" | "character" | "loading" | "result"

const TIMING_ICONS: Record<string, string> = {
  "오늘 당장": "⚡",
  "내일": "🕐",
  "이번 주 내": "📅",
  "조금 더 기다려": "⏳",
}

function AskPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<StoredProfile | null>(null)

  // 플로우 상태
  const [step, setStep] = useState<Step>("category")
  const [selectedCategory, setSelectedCategory] = useState<ConsultCategory | null>(null)
  const [selectedSituation, setSelectedSituation] = useState<ConsultSituation | null>(null)
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyOption | null>(null)
  const [detail, setDetail] = useState("")
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null)

  // 결과
  const [card, setCard] = useState<CoachingCard | null>(null)
  const [resultCharacter, setResultCharacter] = useState<CharacterType>("sibling")
  const [error, setError] = useState("")

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setProfile(stored)

    // URL 파라미터로 자동 진입
    const q = searchParams.get("q")
    const cat = searchParams.get("category")
    if (cat) {
      const found = findCategory(cat)
      if (found) {
        setSelectedCategory(found)
        setStep("situation")
      }
    } else if (q) {
      setDetail(q)
      setStep("detail")
    }
  }, [router, searchParams])

  function goBack() {
    switch (step) {
      case "situation": setStep("category"); break
      case "urgency": setStep("situation"); break
      case "detail": setStep("urgency"); break
      case "character": setStep("detail"); break
      default: break
    }
  }

  function handleCategorySelect(cat: ConsultCategory) {
    setSelectedCategory(cat)
    setStep("situation")
  }

  function handleSituationSelect(sit: ConsultSituation) {
    setSelectedSituation(sit)
    setStep("urgency")
  }

  function handleUrgencySelect(urg: UrgencyOption) {
    setSelectedUrgency(urg)
    setStep("detail")
  }

  function handleDetailNext() {
    setStep("character")
  }

  async function handleSubmit(character: CharacterType) {
    if (!profile || !selectedCategory || !selectedSituation || !selectedUrgency) return

    setSelectedCharacter(character)
    setResultCharacter(character)
    setStep("loading")
    setError("")
    setCard(null)

    const question = buildQuestionFromFlow(selectedCategory, selectedSituation, selectedUrgency, detail)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthInfo: profile.birthInfo,
          question,
          character,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "상담 중 오류가 발생했습니다")
      }

      const data = await res.json()
      setCard(data.card)
      setStep("result")

      // 상담 기록 저장
      saveConsultation({
        id: generateId(),
        characterType: character,
        question: `${selectedCategory.label} > ${selectedSituation.label}${detail ? ` | ${detail}` : ""}`,
        card: data.card,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("시간이 오래 걸리고 있어요. 다시 시도해주세요.")
      } else {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다")
      }
      setStep("character")
    }
  }

  function handleRetryOtherCharacter() {
    const characters: CharacterType[] = ["sibling", "grandma", "analyst"]
    const others = characters.filter(c => c !== resultCharacter)
    const nextChar = others[Math.floor(Math.random() * others.length)]
    handleSubmit(nextChar)
  }

  function handleReset() {
    setStep("category")
    setSelectedCategory(null)
    setSelectedSituation(null)
    setSelectedUrgency(null)
    setDetail("")
    setSelectedCharacter(null)
    setCard(null)
    setError("")
  }

  if (!profile) return null

  const stepIndex = ["category", "situation", "urgency", "detail", "character"].indexOf(step)
  const showProgress = stepIndex >= 0

  return (
    <div className="px-4 pt-6">
      {/* 프로그레스 바 */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {step !== "category" && (
              <button onClick={goBack} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= stepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: 카테고리 선택 */}
      {step === "category" && (
        <div>
          <h2 className="mb-1 text-xl font-bold">어떤 고민인가요?</h2>
          <p className="mb-6 text-sm text-muted-foreground">상담 영역을 선택해주세요</p>
          <div className="grid grid-cols-2 gap-3">
            {CONSULT_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => handleCategorySelect(cat)}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-[0.97]"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <p className="font-semibold">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: 세부 상황 선택 */}
      {step === "situation" && selectedCategory && (
        <div>
          <h2 className="mb-1 text-xl font-bold">
            {selectedCategory.emoji} {selectedCategory.label}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">구체적인 상황을 선택해주세요</p>
          <div className="space-y-2">
            {selectedCategory.situations.map(sit => (
              <button
                key={sit.label}
                onClick={() => handleSituationSelect(sit)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
              >
                <span className="text-xl">{sit.emoji}</span>
                <span className="font-medium">{sit.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: 긴급도 선택 */}
      {step === "urgency" && (
        <div>
          <h2 className="mb-1 text-xl font-bold">얼마나 급한가요?</h2>
          <p className="mb-6 text-sm text-muted-foreground">시급도에 따라 다른 코칭을 드려요</p>
          <div className="grid grid-cols-2 gap-3">
            {URGENCY_OPTIONS.map(urg => (
              <button
                key={urg.value}
                onClick={() => handleUrgencySelect(urg)}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97]"
              >
                <span className="text-2xl">{urg.emoji}</span>
                <span className="text-sm font-medium">{urg.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: 추가 맥락 (선택) */}
      {step === "detail" && (
        <div>
          <h2 className="mb-1 text-xl font-bold">더 알려주실 게 있나요?</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            자세히 알려주시면 더 정확한 코칭을 드릴 수 있어요 <span className="text-muted-foreground/60">(선택)</span>
          </p>
          <Textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            placeholder="예: 3개월째 팀장님과 갈등이 심해서 이직을 고민 중이에요..."
            className="mb-4 min-h-[100px] resize-none"
            rows={4}
          />
          <div className="flex gap-3">
            <button
              onClick={handleDetailNext}
              className="flex-1 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
            >
              건너뛰기
            </button>
            <button
              onClick={handleDetailNext}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 5: 캐릭터 선택 */}
      {step === "character" && (
        <div>
          <h2 className="mb-1 text-xl font-bold">누구에게 물어볼까요?</h2>
          <p className="mb-6 text-sm text-muted-foreground">같은 사주, 다른 시각의 코칭</p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {(Object.entries(CHARACTERS) as [CharacterType, typeof CHARACTERS[CharacterType]][]).map(([key, char]) => (
              <button
                key={key}
                onClick={() => handleSubmit(key)}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all hover:shadow-sm active:scale-[0.98] ${char.borderColor} border-opacity-30 hover:border-opacity-100 ${char.bgLight}`}
              >
                <span className="text-3xl">{char.emoji}</span>
                <div className="flex-1">
                  <p className={`font-bold ${char.textColor}`}>{char.name}</p>
                  <p className="text-xs text-muted-foreground">{char.shortDesc}</p>
                </div>
                <MessageCircle className={`h-5 w-5 ${char.textColor} opacity-50`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 로딩 */}
      {step === "loading" && selectedCharacter && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 text-5xl">{CHARACTERS[selectedCharacter].emoji}</div>
          <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {CHARACTERS[selectedCharacter].name}이(가) 사주를 분석하고 있어요...
          </p>
        </div>
      )}

      {/* 결과 */}
      {step === "result" && card && (
        <div className="space-y-4 pb-8">
          {/* 캐릭터 헤더 */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{CHARACTERS[resultCharacter].emoji}</span>
            <div>
              <p className={`font-bold ${CHARACTERS[resultCharacter].textColor}`}>
                {CHARACTERS[resultCharacter].name}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedCategory?.label} &gt; {selectedSituation?.label}
              </p>
            </div>
          </div>

          {/* 진단 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">진단</p>
            <p className="text-sm leading-relaxed">{card.diagnosis}</p>
          </div>

          {/* 오늘의 한수 (핵심 행동) */}
          <div className="rounded-xl border-2 border-accent/40 bg-gradient-to-br from-accent/5 to-accent/10 p-4">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
              <p className="text-xs font-semibold text-accent-foreground">한수</p>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium">
                {TIMING_ICONS[card.timing] || "📅"} {card.timing}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed">{card.action}</p>
          </div>

          {/* 피할 것 */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <p className="mb-1 text-xs font-semibold text-destructive">피할 것</p>
            <p className="text-sm leading-relaxed">{card.avoid}</p>
          </div>

          {/* 명리학 근거 */}
          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer p-4 text-xs font-semibold text-muted-foreground hover:text-foreground">
              명리학 근거 보기
            </summary>
            <div className="border-t border-border px-4 py-3">
              <p className="text-sm leading-relaxed text-muted-foreground">{card.basis}</p>
            </div>
          </details>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              새 고민 상담
            </button>
            <button
              onClick={handleRetryOtherCharacter}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              다른 관점
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AskPage() {
  return (
    <Suspense>
      <AskPageInner />
    </Suspense>
  )
}
