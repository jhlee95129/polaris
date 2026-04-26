"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Star, Trash2 } from "lucide-react"
import { clearUser } from "@/lib/storage"

interface SajuSidebarProps {
  sajuSummary: string | null
  displayName: string | null
  pillars: {
    yeon: string
    wol: string
    il: string
    si: string | null
  }
  onReset: () => void
}

export default function SajuSidebar({ sajuSummary, displayName, pillars, onReset }: SajuSidebarProps) {
  const [expanded, setExpanded] = useState(false)

  function handleReset() {
    if (confirm("대화 기록을 모두 지우고 새로 시작할까요?")) {
      clearUser()
      onReset()
    }
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-card/50 p-4">
      {/* 로고 */}
      <div className="flex items-center gap-2 mb-6">
        <Star className="h-5 w-5 text-primary" />
        <span className="font-bold text-primary">폴라리스</span>
      </div>

      {/* 사용자 이름 */}
      {displayName && (
        <p className="text-sm font-medium mb-2">{displayName}</p>
      )}

      {/* 요약 */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        {sajuSummary || "명식 분석 중..."}
      </p>

      {/* 4기둥 펼침 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        내 명식 상세
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-4 gap-2 text-center mb-4 p-3 rounded-lg bg-background/50 border border-border">
          {[
            { label: "년주", value: pillars.yeon },
            { label: "월주", value: pillars.wol },
            { label: "일주", value: pillars.il },
            { label: "시주", value: pillars.si || "—" },
          ].map(p => (
            <div key={p.label} className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{p.label}</p>
              <p className="text-sm font-medium">{p.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 하단 */}
      <div className="mt-auto">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
          onClick={handleReset}
        >
          <Trash2 className="h-3 w-3 mr-1.5" />
          기억을 지우고 새로 시작
        </Button>
      </div>
    </div>
  )
}
