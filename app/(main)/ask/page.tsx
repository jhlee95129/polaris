"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { loadProfile, saveConsultation, generateId } from "@/lib/storage"
import { CHARACTERS, type CharacterType } from "@/lib/prompts"
import type { CoachingCard } from "@/lib/claude"
import { Send, RotateCcw, ChevronDown, ChevronUp, Clock, Zap, CalendarDays, Hourglass } from "lucide-react"

const CHARACTER_LIST: CharacterType[] = ["sibling", "grandma", "analyst"]

const TIMING_ICONS: Record<string, React.ReactNode> = {
  "오늘 당장": <Zap className="h-3 w-3" />,
  "내일": <Clock className="h-3 w-3" />,
  "이번 주 내": <CalendarDays className="h-3 w-3" />,
  "조금 더 기다려": <Hourglass className="h-3 w-3" />,
}

export default function AskPage() {
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [character, setCharacter] = useState<CharacterType>("sibling")
  const [isLoading, setIsLoading] = useState(false)
  const [card, setCard] = useState<CoachingCard | null>(null)
  const [error, setError] = useState("")
  const [hasProfile, setHasProfile] = useState(false)
  const [showBasis, setShowBasis] = useState(false)

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setHasProfile(true)
  }, [router])

  async function handleSubmit() {
    if (!question.trim()) return
    setError("")
    setIsLoading(true)
    setCard(null)
    setShowBasis(false)

    try {
      const stored = loadProfile()
      if (!stored) throw new Error("프로필을 먼저 등록해주세요")

      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthInfo: stored.birthInfo,
          question: question.trim(),
          character,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "상담에 실패했습니다")
      }

      const data = await res.json()
      setCard(data.card)

      saveConsultation({
        id: generateId(),
        characterType: character,
        question: question.trim(),
        card: data.card,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setCard(null)
    setQuestion("")
    setError("")
    setShowBasis(false)
  }

  if (!hasProfile) return null

  const charInfo = CHARACTERS[character]

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="pt-2">
        <h1 className="text-xl font-bold">한 수 받기</h1>
        <p className="text-xs text-muted-foreground">
          지금 고민을 말해주세요. 사주에 기반한 구체적인 한 수를 알려드릴게요.
        </p>
      </div>

      {/* 캐릭터 선택 */}
      <div className="flex gap-2">
        {CHARACTER_LIST.map(type => {
          const info = CHARACTERS[type]
          const isSelected = character === type
          return (
            <button
              key={type}
              onClick={() => setCharacter(type)}
              className={`flex-1 rounded-xl border-2 p-3 text-center transition-all ${
                isSelected
                  ? `${info.borderColor} ${info.bgLight} shadow-sm`
                  : "border-border hover:border-primary/20"
              }`}
            >
              <span className="text-xl block">{info.emoji}</span>
              <span className={`text-xs font-medium block mt-1 ${isSelected ? info.textColor : ""}`}>
                {info.name}
              </span>
              <span className="text-[10px] text-muted-foreground block">{info.shortDesc}</span>
            </button>
          )
        })}
      </div>

      {/* 고민 입력 */}
      {!card && (
        <div className="space-y-3">
          <div className="relative">
            <Textarea
              placeholder="예: 이직을 고민하고 있는데, 지금이 적절한 타이밍일까요?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={4}
              className="resize-none rounded-2xl rounded-tl-sm pr-4"
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {charInfo.emoji} 사주를 읽고 있어요...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                한 수 받기
              </span>
            )}
          </Button>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <Card className={`${charInfo.borderColor} border-2`}>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl">{charInfo.emoji}</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="text-xs text-muted-foreground">{charInfo.name}이(가) 사주를 살펴보고 있어요</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 코칭 카드 */}
      {card && !isLoading && (
        <div className="space-y-4">
          {/* 내 질문 버블 */}
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded-2xl rounded-br-sm p-3 max-w-[85%]">
              <p className="text-sm">{question}</p>
            </div>
          </div>

          {/* 캐릭터 응답 카드 */}
          <Card className={`${charInfo.borderColor} border-2 overflow-hidden`}>
            {/* 캐릭터 헤더 */}
            <div className={`${charInfo.bgLight} px-4 py-3 flex items-center gap-2`}>
              <span className="text-lg">{charInfo.emoji}</span>
              <span className={`text-sm font-semibold ${charInfo.textColor}`}>
                {charInfo.name}의 한 수
              </span>
            </div>

            <CardContent className="space-y-4 pt-4">
              {/* 진단 */}
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">왜 지금 어려운가</p>
                <p className="text-sm leading-relaxed">{card.diagnosis}</p>
              </div>

              {/* 핵심 행동 — 골드 강조 */}
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                <p className="text-[11px] font-medium text-accent-foreground/70 mb-2">오늘의 한 수</p>
                <p className="text-base font-semibold leading-relaxed">{card.action}</p>
                <Badge variant="secondary" className="mt-2 text-xs gap-1">
                  {TIMING_ICONS[card.timing]}
                  {card.timing}
                </Badge>
              </div>

              {/* 피할 것 */}
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">피할 것</p>
                <p className="text-sm leading-relaxed text-destructive/80">{card.avoid}</p>
              </div>

              {/* 명리학 근거 — 접이식 */}
              <button
                onClick={() => setShowBasis(!showBasis)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showBasis ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                명리학 근거 {showBasis ? "접기" : "보기"}
              </button>
              {showBasis && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.basis}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 다시 질문 */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              새 고민
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const otherCharacters = CHARACTER_LIST.filter(c => c !== character)
                const next = otherCharacters[Math.floor(Math.random() * otherCharacters.length)]
                setCharacter(next)
                setCard(null)
                setShowBasis(false)
                setTimeout(() => handleSubmit(), 100)
              }}
            >
              다른 관점으로 보기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
