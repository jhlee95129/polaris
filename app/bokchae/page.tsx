"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserId, getEnergy, MAX_ENERGY } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Info } from "lucide-react"

export default function BokChaePage() {
  const router = useRouter()
  const [energy, setEnergy] = useState(MAX_ENERGY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace("/onboarding")
      return
    }
    const state = getEnergy()
    setEnergy(state.count)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100svh-49px)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[918px] px-5 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">복채</h1>
        <p className="text-sm text-muted-foreground">
          상담에 필요한 복채를 확인해
        </p>
      </div>

      {/* 복채 현황 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-4">
            {/* 복채 아이콘 */}
            <div className="flex items-center gap-3">
              {Array.from({ length: MAX_ENERGY }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                    i < energy
                      ? "bg-amber-100 dark:bg-amber-900/30"
                      : "bg-muted"
                  }`}
                >
                  <span className={`text-2xl ${i < energy ? "" : "opacity-30 grayscale"}`}>
                    🪙
                  </span>
                </div>
              ))}
            </div>

            {/* 숫자 */}
            <div className="text-center">
              <p className="text-3xl font-bold">
                <span className="text-primary">{energy}</span>
                <span className="text-muted-foreground text-lg"> / {MAX_ENERGY}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">오늘 남은 복채</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 설명 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            복채란?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5 shrink-0">🪙</span>
            <span>상담 1회에 복채 1개를 사용해</span>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>매일 자정에 {MAX_ENERGY}개 충전돼</span>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="pt-2">
        {energy > 0 ? (
          <Button
            size="lg"
            className="w-full text-base"
            onClick={() => router.push("/chat")}
          >
            상담하러 가기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              오늘 복채를 다 써버렸어. 내일 다시 충전돼!
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => router.push("/")}
            >
              홈으로 돌아가기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
