"use client"

import { useEffect, useRef } from "react"
import MessageBubble from "./MessageBubble"
import { CHARACTERS, type CharacterId } from "@/lib/characters"

export interface BasisData {
  ilgan: string
  ilganChunk: string | null
  pillars: { yeon: string; wol: string; il: string; si: string | null }
  daeun: string | null
  // 응답별 고유 근거 (Claude가 생성)
  reasoning?: string
  coaching?: string
  referenced_pillars?: string[]
  key_elements?: string[]
  topic?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  basis?: BasisData
}

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming?: boolean
  ilgan?: string
  displayName?: string
  scrollTrigger?: number
  characterId?: CharacterId
}

export default function MessageList({ messages, isStreaming, ilgan, displayName, scrollTrigger, characterId = "seonbi" }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming, scrollTrigger])

  return (
    <div className="flex-1 overflow-y-auto p-4 star-pattern chat-room-ambient">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={`${msg.id}-${idx}`}
            role={msg.role}
            content={msg.content}
            basis={msg.basis}
            ilgan={ilgan}
            displayName={displayName}
            isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"}
            characterId={characterId}
          />
        ))}

        {/* 스트리밍 인디케이터 */}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start" style={{ animation: "bubbleIn 0.35s ease-out both" }}>
            <div className="flex items-start gap-2.5">
              {(() => {
                const char = CHARACTERS[characterId] || CHARACTERS.seonbi
                return (
                  <div className="shrink-0 flex flex-col items-center gap-0.5">
                    <div className={`flex items-center justify-center h-9 w-9 rounded-full ${char.colorClass.avatarBg} shadow-sm`}>
                      <span className="text-base leading-none">{char.emoji}</span>
                    </div>
                    <span className={`text-[10px] ${char.colorClass.nameText} font-medium`}>{char.name}</span>
                  </div>
                )
              })()}
              <div className="flex flex-col items-start gap-1.5">
                <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary/60" style={{ animation: "dotBounce 1.2s ease-in-out infinite", animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/60" style={{ animation: "dotBounce 1.2s ease-in-out infinite", animationDelay: "200ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/60" style={{ animation: "dotBounce 1.2s ease-in-out infinite", animationDelay: "400ms" }} />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground ml-1">분석중...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
