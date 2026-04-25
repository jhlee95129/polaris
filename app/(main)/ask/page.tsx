"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { loadProfile, saveConsultation, generateId } from "@/lib/storage"
import { CHARACTERS, type CharacterType } from "@/lib/prompts"
import type { CoachingCard } from "@/lib/claude"
import { Send, RotateCcw } from "lucide-react"

const CHARACTER_LIST: CharacterType[] = ["sibling", "grandma", "analyst"]

export default function AskPage() {
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [character, setCharacter] = useState<CharacterType>("sibling")
  const [isLoading, setIsLoading] = useState(false)
  const [card, setCard] = useState<CoachingCard | null>(null)
  const [error, setError] = useState("")
  const [hasProfile, setHasProfile] = useState(false)

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

      // 상담 기록 저장
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
  }

  if (!hasProfile) return null

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
              className={`flex-1 rounded-lg border p-3 text-center transition-all ${
                isSelected
                  ? "border-foreground bg-foreground/5 shadow-sm"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <span className="text-lg block">{info.emoji}</span>
              <span className="text-xs font-medium block mt-1">{info.name}</span>
              <span className="text-[10px] text-muted-foreground block">{info.shortDesc}</span>
            </button>
          )
        })}
      </div>

      {/* 고민 입력 */}
      {!card && (
        <div className="space-y-3">
          <Textarea
            placeholder="예: 이직을 고민하고 있는데, 지금이 적절한 타이밍일까요?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={4}
            className="resize-none"
            disabled={isLoading}
          />
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
                사주를 읽고 있어요...
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
        <Card>
          <CardContent className="py-8">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-8 bg-muted rounded animate-pulse mt-4" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 코칭 카드 */}
      {card && !isLoading && (
        <div className="space-y-4">
          {/* 내 질문 */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {CHARACTERS[character].emoji} {CHARACTERS[character].name}에게 물었어요
            </p>
            <p className="text-sm">{question}</p>
          </div>

          {/* 카드 */}
          <Card className="border-foreground/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{CHARACTERS[character].emoji}</span>
                {CHARACTERS[character].name}의 한 수
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 진단 */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">왜 지금 어려운가</p>
                <p className="text-sm leading-relaxed">{card.diagnosis}</p>
              </div>

              <Separator />

              {/* 핵심 행동 */}
              <div className="bg-foreground/5 rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">오늘의 한 수</p>
                <p className="text-base font-semibold leading-relaxed">{card.action}</p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {card.timing}
                </Badge>
              </div>

              {/* 피할 것 */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">피할 것</p>
                <p className="text-sm leading-relaxed">{card.avoid}</p>
              </div>

              <Separator />

              {/* 명리학 근거 */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">명리학 근거</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.basis}</p>
              </div>
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
                // 다른 캐릭터로 같은 질문
                const otherCharacters = CHARACTER_LIST.filter(c => c !== character)
                const next = otherCharacters[Math.floor(Math.random() * otherCharacters.length)]
                setCharacter(next)
                setCard(null)
                // 자동으로 다시 질문
                setTimeout(() => {
                  handleSubmit()
                }, 100)
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
