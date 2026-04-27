"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp } from "lucide-react"

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  showSuggestions?: boolean
  suggestions?: string[]
  suggestionsLoading?: boolean
}

export default function MessageInput({ onSend, disabled, showSuggestions, suggestions = [], suggestionsLoading }: MessageInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }, [value])

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
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

        <div className="relative rounded-2xl border border-border bg-card shadow-md focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-lg transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="오늘 어떤 고민이 있나요?"
            disabled={disabled}
            rows={1}
            className="w-full min-h-[44px] resize-none bg-transparent px-4 py-3.5 pr-12 text-sm leading-normal placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="absolute bottom-3 right-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
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
