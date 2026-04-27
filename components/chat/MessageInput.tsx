"use client"

import { useState, useRef, useCallback } from "react"
import { ArrowUp, Plus, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TOPIC_CATEGORIES } from "@/lib/topic-data"

const QUICK_TOPICS = [
  { emoji: "☀️", label: "오늘 운세", message: "오늘 운세 봐줘" },
  { emoji: "💼", label: "오늘 업무", message: "오늘 업무운이 궁금해" },
  { emoji: "❤️", label: "오늘 연애", message: "오늘 연애운 어때?" },
  { emoji: "💰", label: "오늘 재물", message: "오늘 재물운 봐줘" },
  { emoji: "🤝", label: "오늘 대인", message: "오늘 대인관계운 알려줘" },
  { emoji: "🍀", label: "오늘 행운", message: "오늘 행운의 시간대가 궁금해" },
  { emoji: "⚠️", label: "오늘 주의", message: "오늘 조심할 점 알려줘" },
  { emoji: "🌙", label: "내일 미리보기", message: "내일 운세 미리 볼 수 있어?" },
]

const SELF_DISCOVERY = [
  { emoji: "🔥", label: "내 성격 깊이 보기", message: "내 사주로 본 성격의 장단점을 알려줘" },
  { emoji: "🧬", label: "타고난 재능", message: "내 사주에서 타고난 재능이나 적성이 뭐야?" },
  { emoji: "🔮", label: "올해의 흐름", message: "올해 나한테 어떤 흐름이 오고 있어?" },
  { emoji: "🤝", label: "인간관계 패턴", message: "내 사주로 본 인간관계 스타일이 궁금해" },
]

const BANNERS = [
  { emoji: "✨", label: "오늘의 한마디", desc: "오늘 하루, 어떤 기운이 감돌까요?", message: "오늘 운세 봐줘" },
  { emoji: "🧭", label: "나만의 상담", desc: "고민이 있다면, 사주로 방향을 찾아볼까요?", message: "요즘 고민이 있는데 사주로 방향을 찾고 싶어" },
  { emoji: "🪞", label: "나를 알아가는 시간", desc: "내 사주 속 숨은 강점을 확인해 볼까요?", message: "내 사주에서 가장 강한 기운이 뭐야? 성격이랑 어떻게 연결되는지 알려줘" },
]

interface MessageInputProps {
  onSend: (message: string) => void
  onTopicSelect?: (message: string) => void
  disabled?: boolean
  showSuggestions?: boolean
  suggestions?: string[]
  suggestionsLoading?: boolean
}

export default function MessageInput({ onSend, onTopicSelect, disabled, showSuggestions, suggestions = [], suggestionsLoading }: MessageInputProps) {
  const [value, setValue] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleInput = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    setValue(el.textContent || "")
  }, [])

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    if (editorRef.current) {
      editorRef.current.textContent = ""
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  function handleTopicClick(message: string) {
    if (!message) return
    setMenuOpen(false)
    onTopicSelect?.(message)
  }

  return (
    <div className="p-3 pb-6">
      <div className="mx-auto max-w-3xl">
        {/* AI 추천 질문 칩 */}
        {showSuggestions && suggestionsLoading && suggestions.length === 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {Array.from({ length: 7 }).map((_, idx) => (
              <span
                key={idx}
                className="inline-flex h-[30px] rounded-full border border-border/40 bg-muted/50 animate-pulse"
                style={{ width: `${60 + (idx % 3) * 24}px`, animationDelay: `${idx * 100}ms` }}
              />
            ))}
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5 max-h-[72px] overflow-hidden">
            {suggestions.map((q, idx) => (
              <button
                key={q}
                onClick={() => onSend(q)}
                disabled={disabled}
                className="inline-flex items-center rounded-full border border-border/60 bg-card hover:bg-primary/5 hover:border-primary/30 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors disabled:opacity-40"
                style={{ animation: "fadeInUp 0.3s ease-out both", animationDelay: `${idx * 60}ms` }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex items-center rounded-2xl border border-border bg-card shadow-md focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-lg transition-all duration-200 min-h-[52px]">
          {/* + 토픽 메뉴 버튼 */}
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                disabled={disabled}
                className="ml-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-30"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={12}
              className="w-[340px] sm:w-[400px] p-0 max-h-[60vh] overflow-y-auto"
            >
              {/* 빠른 상담 */}
              <div className="p-3 pb-2">
                <p className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">빠른 상담</p>
                <div className="space-y-1">
                  {BANNERS.map(b => (
                    <button
                      key={b.label}
                      onClick={() => handleTopicClick(b.message)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-muted active:scale-[0.98]"
                    >
                      <span className="text-lg shrink-0">{b.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{b.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug truncate">{b.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mx-3 border-t border-border/50" />

              {/* 오늘의 운세 */}
              <div className="p-3 pb-2">
                <p className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">오늘의 운세</p>
                <div className="grid grid-cols-4 gap-1">
                  {QUICK_TOPICS.map(item => (
                    <button
                      key={item.label}
                      onClick={() => handleTopicClick(item.message)}
                      className="rounded-xl p-2 text-center transition-all hover:bg-muted active:scale-95"
                    >
                      <span className="block text-lg mb-0.5">{item.emoji}</span>
                      <span className="text-[10px] font-medium text-foreground/80 leading-tight block">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mx-3 border-t border-border/50" />

              {/* 고민 상담 */}
              <div className="p-3 pt-2 space-y-3">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">고민 상담</p>
                {TOPIC_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <p className="px-1 text-[11px] font-medium text-muted-foreground mb-1">
                      {cat.label}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {cat.cards.map(card => (
                        card.message && (
                          <button
                            key={card.key}
                            onClick={() => handleTopicClick(card.message)}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-left transition-all hover:bg-muted active:scale-[0.98]"
                          >
                            <span className="text-sm shrink-0">{card.emoji}</span>
                            <span className="text-xs text-foreground/80 leading-snug">{card.prompt}</span>
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-3 border-t border-border/50" />

              {/* 자기 탐색 */}
              <div className="p-3 pt-2 pb-3">
                <p className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">자기 탐색</p>
                <div className="grid grid-cols-2 gap-1">
                  {SELF_DISCOVERY.map(item => (
                    <button
                      key={item.label}
                      onClick={() => handleTopicClick(item.message)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-left transition-all hover:bg-muted active:scale-[0.98]"
                    >
                      <span className="text-sm shrink-0">{item.emoji}</span>
                      <span className="text-xs text-foreground/80 leading-snug">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="relative flex-1 px-2 py-3 pr-12">
            {/* placeholder */}
            {!value && (
              <span className="pointer-events-none absolute inset-0 flex items-center px-2 text-sm text-muted-foreground/50">
                오늘 어떤 고민이 있나요?
              </span>
            )}
            <div
              ref={editorRef}
              contentEditable={!disabled}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              role="textbox"
              aria-placeholder="오늘 어떤 고민이 있나요?"
              className="text-sm leading-relaxed max-h-[160px] overflow-y-auto outline-none whitespace-pre-wrap break-words [&:empty]:min-h-[20px] disabled:opacity-50"
              style={disabled ? { opacity: 0.5, pointerEvents: "none" } : undefined}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
          폴라리스는 참고용 사주 해석을 제공하며, 전문 상담을 대체하지 않습니다.
        </p>
      </div>
    </div>
  )
}
