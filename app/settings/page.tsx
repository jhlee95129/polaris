"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserId } from "@/lib/storage"
import { CHARACTER_LIST } from "@/lib/characters"
import { CHARACTERS } from "@/lib/characters"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

interface UserBasic {
  id: string
  display_name: string | null
  character_id: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserBasic | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingId, setChangingId] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace("/onboarding")
      return
    }
    fetch(`/api/user?id=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) setUser({ id: data.user.id, display_name: data.user.display_name, character_id: data.user.character_id || "seonbi" })
        else router.replace("/onboarding")
      })
      .catch(() => router.replace("/onboarding"))
      .finally(() => setLoading(false))
  }, [router])

  async function handleCharacterChange(charId: string) {
    if (!user || changingId || user.character_id === charId) return
    setChangingId(charId)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, character_id: charId }),
      })
      if (!res.ok) throw new Error()
      setUser(prev => prev ? { ...prev, character_id: charId } : prev)
      const char = CHARACTERS[charId as keyof typeof CHARACTERS]
      toast.success(`${char.emoji} ${char.name}(으)로 변경했어요`)
    } catch {
      toast.error("캐릭터 변경에 실패했어요")
    } finally {
      setChangingId(null)
    }
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6 animate-pulse">
        {/* 헤더 */}
        <div className="h-7 w-16 rounded-lg bg-muted" />

        {/* 코칭 캐릭터 섹션 */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="h-6 w-36 rounded bg-muted" />
            <div className="h-3.5 w-56 rounded bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-4">
                <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 rounded bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                  <div className="h-3 w-48 rounded bg-muted" />
                  <div className="h-3 w-64 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 테마 섹션 */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="h-6 w-24 rounded bg-muted" />
            <div className="h-3.5 w-40 rounded bg-muted" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4">
                <div className="h-5 w-5 rounded bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* 헤더 */}
      <h1 className="text-xl font-bold">설정</h1>

      {/* 코칭 캐릭터 */}
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-lg">🎭 코칭 캐릭터</h2>
          <p className="text-xs text-muted-foreground mt-1">대화 스타일이 달라져요. 분석 내용은 동일합니다.</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {CHARACTER_LIST.map(char => {
            const isSelected = user.character_id === char.id
            return (
              <button
                key={char.id}
                onClick={() => handleCharacterChange(char.id)}
                disabled={!!changingId}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 transition-all text-left disabled:opacity-60",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <div className={`flex items-center justify-center h-12 w-12 rounded-full ${char.colorClass.avatarBg} shrink-0`}>
                  <span className="text-xl leading-none">{char.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isSelected ? char.colorClass.nameText : ""}`}>{char.name}</span>
                    <span className="text-xs text-muted-foreground">{char.identity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">{char.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 italic truncate">&ldquo;{char.sampleLine}&rdquo;</p>
                </div>
                {changingId === char.id ? (
                  <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : isSelected ? (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">사용 중</span>
                ) : null}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-muted-foreground/70">캐릭터를 변경하면 다음 메시지부터 바로 적용돼요.</p>
      </section>

      {/* 테마 */}
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-lg">🎨 테마</h2>
          <p className="text-xs text-muted-foreground mt-1">화면 밝기를 설정해요.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "light", label: "라이트", icon: Sun },
            { id: "dark", label: "다크", icon: Moon },
            { id: "system", label: "시스템", icon: Monitor },
          ] as const).map(opt => {
            const isSelected = theme === opt.id
            const Icon = opt.icon
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "")}>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
