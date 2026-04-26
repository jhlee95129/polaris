"use client"

import { useEffect, useRef } from "react"
import MessageBubble from "./MessageBubble"

export interface BasisData {
  ilgan: string
  ilganChunk: string | null
  pillars: { yeon: string; wol: string; il: string; si: string | null }
  daeun: string | null
  // 응답별 고유 근거 (Claude가 생성)
  reasoning?: string
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
}

export default function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} basis={msg.basis} />
        ))}

        {/* 스트리밍 인디케이터 */}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <span className="text-lg shrink-0 mb-0.5">⭐</span>
              <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
