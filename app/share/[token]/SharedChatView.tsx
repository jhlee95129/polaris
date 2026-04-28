"use client"

import MessageBubble from "@/components/chat/MessageBubble"
import type { SessionRow, MessageRow } from "@/lib/db/queries"
import type { BasisData } from "@/components/chat/MessageList"
import type { CharacterId } from "@/lib/characters"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface SharedChatViewProps {
  session: SessionRow
  messages: MessageRow[]
  user: { display_name: string | null; ilgan: string; character_id: string }
}

export default function SharedChatView({ session, messages, user }: SharedChatViewProps) {
  const router = useRouter()

  return (
    <div className="min-h-[calc(100svh-49px)] flex flex-col">
      {/* 헤더 배너 */}
      <div className="border-b border-border bg-gradient-to-r from-amber-50/80 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-800/10 px-4 py-3">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">
              {user.display_name || "사용자"}님의 상담 기록
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{session.title}</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            읽기 전용
          </span>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 star-pattern chat-room-ambient">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              basis={(msg.metadata as { basis?: BasisData } | null)?.basis}
              ilgan={user.ilgan}
              displayName={user.display_name || undefined}
              characterId={(user.character_id || "seonbi") as CharacterId}
            />
          ))}
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="border-t border-border bg-card/80 px-4 py-4">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            나도 폴라리스에게 상담받고 싶다면?
          </p>
          <Button onClick={() => router.push("/")} size="lg">
            폴라리스 시작하기
          </Button>
        </div>
      </div>
    </div>
  )
}
