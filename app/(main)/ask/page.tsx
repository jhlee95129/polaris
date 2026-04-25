"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loadProfile, saveConsultation, generateId, useEnergy, getEnergyBalance, addEnergy } from "@/lib/storage"
import type { CoachingCard } from "@/lib/claude"
import type { StoredProfile } from "@/lib/storage"
import type { PreviousCoaching } from "@/lib/prompts"
import { Sparkles, AlertCircle, Zap, ArrowUp, ShieldAlert, RotateCcw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

type Step = "input" | "loading" | "result" | "no-energy"

const TIMING_ICONS: Record<string, string> = {
  "오늘 당장": "⚡",
  "내일": "🕐",
  "이번 주 내": "📅",
  "조금 더 기다려": "⏳",
}

// 코칭 카드 컴포넌트 (이전 + 현재 카드 공용)
function CoachingCardView({ card, isLatest }: { card: CoachingCard; isLatest: boolean }) {
  return (
    <div className={`overflow-hidden rounded-xl border bg-card ${isLatest ? "border-border" : "border-border/50 opacity-80"}`}>
      {/* 진단 */}
      <div className="p-4">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">진단</p>
        <p className="text-sm leading-relaxed">{card.diagnosis}</p>
      </div>

      {/* 한수 */}
      <div className="border-t border-border bg-accent/5 p-4">
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
      <div className="border-t border-border p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
          <p className="text-xs font-semibold text-destructive">피할 것</p>
        </div>
        <p className="text-sm leading-relaxed">{card.avoid}</p>
      </div>

      {/* 명리학 근거 — 최신 카드만 펼칠 수 있음 */}
      {isLatest && (
        <details>
          <summary className="cursor-pointer border-t border-border p-4 text-xs font-semibold text-muted-foreground hover:text-foreground">
            명리학 근거 보기
          </summary>
          <div className="border-t border-border px-4 py-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{card.basis}</p>
          </div>
        </details>
      )}
    </div>
  )
}

function AskPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<StoredProfile | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 플로우 상태
  const [step, setStep] = useState<Step>("input")
  const [question, setQuestion] = useState("")
  const [followUp, setFollowUp] = useState("")

  // 결과
  const [card, setCard] = useState<CoachingCard | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [threadCards, setThreadCards] = useState<PreviousCoaching[]>([])
  const [error, setError] = useState("")
  const [energy, setEnergy] = useState(3)

  // ?q= 자동 제출용
  const autoSubmitted = useRef(false)

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setProfile(stored)
    setEnergy(getEnergyBalance())

    const q = searchParams.get("q")
    if (q) setQuestion(q)
  }, [router, searchParams])

  // ?q= 존재 시 자동 제출
  useEffect(() => {
    if (profile && question && !autoSubmitted.current && searchParams.get("q")) {
      autoSubmitted.current = true
      submitQuestion(question)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, question])

  // 결과 나오면 하단으로 스크롤
  useEffect(() => {
    if (step === "result") {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [step, threadCards.length])

  async function submitQuestion(text: string) {
    if (!profile || !text.trim()) return

    // 기운 체크
    if (!useEnergy()) {
      setEnergy(0)
      setStep("no-energy")
      return
    }
    setEnergy(getEnergyBalance())

    setStep("loading")
    setError("")
    setCard(null)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthInfo: profile.birthInfo,
          question: text,
          threadId: threadId || undefined,
          previousCards: threadCards.length > 0 ? threadCards : undefined,
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
      setThreadId(data.threadId)
      setStep("result")

      setThreadCards(prev => [...prev, { question: text, card: data.card }])

      saveConsultation({
        id: generateId(),
        threadId: data.threadId,
        question: text,
        card: data.card,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("시간이 오래 걸리고 있어요. 다시 시도해주세요.")
      } else {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다")
      }
      addEnergy(1)
      setEnergy(getEnergyBalance())
      setStep(threadCards.length > 0 ? "result" : "input")
    }
  }

  function handleFollowUpSubmit() {
    if (!followUp.trim()) return
    const text = followUp.trim()
    setFollowUp("")
    submitQuestion(text)
  }

  function handleReset() {
    setQuestion("")
    setFollowUp("")
    setCard(null)
    setThreadId(null)
    setThreadCards([])
    setError("")
    router.push("/home")
  }

  if (!profile) return null

  return (
    <div className="px-4 pt-6 pb-8">
      {/* 첫 입력 (스레드 시작 전) */}
      {step === "input" && threadCards.length === 0 && (
        <div className="flex flex-col items-center pt-6">
          <h2 className="mb-2 text-center text-xl font-bold">무엇이 고민인가요?</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            자세히 적을수록 더 정확한 코칭을 드려요
          </p>

          {error && (
            <div className="mb-4 flex w-full max-w-lg items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative w-full max-w-lg">
            <Textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="예: 3개월째 팀장님과 갈등이 심해서 이직을 고민 중이에요..."
              className="min-h-[130px] resize-none pr-4 pb-14 text-base"
              rows={5}
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  submitQuestion(question)
                }
              }}
            />
            <button
              onClick={() => submitQuestion(question)}
              disabled={!question.trim()}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              한수 받기
            </button>
          </div>

          <div className={`mt-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            energy > 0 ? "bg-accent/10 text-accent-foreground" : "bg-destructive/10 text-destructive"
          }`}>
            <Zap className="h-3 w-3" />
            <span>기운 {energy}</span>
          </div>
        </div>
      )}

      {/* 코칭 스레드 (대화 이력 + 최신 결과 + 이어서 질문) */}
      {(step === "result" || step === "loading") && threadCards.length > 0 && (
        <div className="space-y-6">
          {/* 스레드 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-primary">코칭 세션</p>
              <span className="text-xs text-muted-foreground">{threadCards.length}회차</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                energy > 0 ? "bg-accent/10 text-accent-foreground" : "bg-destructive/10 text-destructive"
              }`}>
                <Zap className="h-3 w-3" />
                <span>{energy}</span>
              </div>
            </div>
          </div>

          {/* 대화 이력 */}
          {threadCards.map((tc, i) => {
            const isLatest = i === threadCards.length - 1
            return (
              <div key={i} className="space-y-3">
                {/* 내 질문 */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary/10 px-4 py-2.5">
                    <p className="text-sm">{tc.question}</p>
                  </div>
                </div>

                {/* 코칭 카드 */}
                <CoachingCardView card={tc.card} isLatest={isLatest} />

                {/* 이전 카드와 다음 질문 사이 구분 */}
                {!isLatest && tc.followUpNote && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-muted/50 px-4 py-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">실행 후기</p>
                      <p className="text-sm">{tc.followUpNote}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* 로딩 중 */}
          {step === "loading" && (
            <div className="flex items-center gap-3 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">사주를 분석하고 있어요...</p>
            </div>
          )}

          {/* 에러 */}
          {error && step === "result" && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 이어서 질문하기 — 결과 바로 아래 */}
          {step === "result" && (
            <div className="space-y-3">
              <div className="relative">
                <Textarea
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  placeholder="해봤더니 어땠나요? 더 궁금한 것이 있나요?"
                  className="min-h-[80px] resize-none pr-12 text-sm"
                  rows={3}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleFollowUpSubmit()
                    }
                  }}
                />
                <button
                  onClick={handleFollowUpSubmit}
                  disabled={!followUp.trim()}
                  className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  새 고민 상담
                </button>
                <span className="text-xs text-muted-foreground">⚡1 / 회</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* 기운 부족 */}
      {step === "no-energy" && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="mb-1 text-lg font-bold">기운이 부족해요</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            오늘의 무료 기운을 모두 사용했어요.<br />
            내일 다시 충전되거나, 기운을 충전할 수 있어요.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <button
              onClick={() => {
                addEnergy(5)
                setEnergy(getEnergyBalance())
                setStep(threadCards.length > 0 ? "result" : "input")
              }}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              기운 충전하기 (5개 / ₩1,000)
            </button>
            <Link
              href="/home"
              className="rounded-xl border border-border px-4 py-3 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              내일 다시 올게요
            </Link>
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
