"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loadProfile, getEnergyBalance } from "@/lib/storage"
import type { StoredProfile } from "@/lib/storage"
import { Sparkles, ArrowRight, Zap, ChevronDown } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const CATEGORIES = [
  {
    id: "work",
    emoji: "🏢",
    label: "회사가 문제",
    questions: [
      "때려치울까 고민이에요",
      "직장 상사랑 갈등이 심해요",
      "승진이 안 되고 있어요",
      "번아웃 온 것 같아요",
    ],
  },
  {
    id: "people",
    emoji: "❤️",
    label: "사람이 문제",
    questions: [
      "이 사람이 맞는 건지 모르겠어요",
      "연인이랑 자꾸 싸워요",
      "썸 타는 중인데 어떻게 해야 할까요",
      "가족/친구 관계가 힘들어요",
    ],
  },
  {
    id: "money",
    emoji: "💰",
    label: "돈이 문제",
    questions: [
      "투자 시작할까 말까 고민이에요",
      "돈이 안 모여요",
      "부업이나 사이드 잡 해볼까요",
      "큰 지출 앞두고 있어요",
    ],
  },
  {
    id: "self",
    emoji: "🤷",
    label: "나 자신이 문제",
    questions: [
      "아무것도 하기 싫어요",
      "뭘 해야 할지 모르겠어요",
      "자꾸 미루게 돼요",
      "자신감이 바닥이에요",
    ],
  },
]

export default function HomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StoredProfile | null>(null)
  const [question, setQuestion] = useState("")
  const [energy, setEnergy] = useState(0)
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadProfile()
    if (!stored) {
      router.replace("/")
      return
    }
    setProfile(stored)
    setEnergy(getEnergyBalance())
  }, [router])

  function handleSubmit() {
    const q = question.trim()
    if (!q) return
    router.push(`/ask?q=${encodeURIComponent(q)}`)
  }

  function handleQuestionClick(text: string) {
    router.push(`/ask?q=${encodeURIComponent(text)}`)
  }

  function toggleCategory(id: string) {
    setOpenCategory(prev => (prev === id ? null : id))
  }

  if (!profile) return null

  const { sajuProfile } = profile
  const dayStemName = sajuProfile.dayStem

  return (
    <div className="flex flex-col px-4 pt-10 pb-8">
      {/* 인사 */}
      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        {dayStemName}일간님,
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        뭐가 고민이에요?
      </p>

      {/* 카테고리 카드 2x2 그��드 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {CATEGORIES.map(cat => {
          const isOpen = openCategory === cat.id
          return (
            <div key={cat.id} className="flex flex-col">
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                  isOpen
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold">{cat.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* 선택된 카테고리의 서브질문 */}
      {openCategory && (
        <div className="mb-6 space-y-2">
          {CATEGORIES.find(c => c.id === openCategory)?.questions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleQuestionClick(q)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99]"
            >
              <span>{q}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* 자유 입력 */}
      <div className="relative">
        <Textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="직접 물어보기..."
          className="min-h-[100px] resize-none pr-4 pb-12 text-base"
          rows={4}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!question.trim()}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          한수 받기
        </button>
      </div>

      {/* 기��� 뱃지 */}
      <div className="mt-4 flex justify-center">
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
          energy > 0 ? "bg-accent/10 text-accent-foreground" : "bg-destructive/10 text-destructive"
        }`}>
          <Zap className="h-3 w-3" />
          <span>기운 {energy}</span>
        </div>
      </div>
    </div>
  )
}
