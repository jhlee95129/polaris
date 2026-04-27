"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserId } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

/* ── 상점 패키지 데이터 ── */

const PACKAGES = [
  { id: "small", name: "소복주머니", count: 3, price: "₩1,000", emoji: "👜" },
  { id: "medium", name: "중복주머니", count: 5, price: "₩2,000", emoji: "👜👜" },
  { id: "large", name: "대복주머니", count: 10, price: "₩3,500", emoji: "👜👜👜" },
]

export default function BokjumoniStorePage() {
  const router = useRouter()
  const [bokjumoniCount, setBokjumoniCount] = useState<number | null>(null)
  const [lastCheckinDate, setLastCheckinDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const [userId, setLocalUserId] = useState<string | null>(null)
  const [checkinDone, setCheckinDone] = useState(false)

  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace("/")
      return
    }
    setLocalUserId(id)

    fetch(`/api/user?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setBokjumoniCount(data.user.bokjumoni_count ?? 0)
          setLastCheckinDate(data.user.last_checkin_date ?? null)
          // 오늘 이미 체크인했는지 확인
          const today = new Date().toISOString().slice(0, 10)
          if (data.user.last_checkin_date === today) {
            setCheckinDone(true)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function handleCheckin() {
    if (!userId || checkinDone) return
    setCheckinLoading(true)
    try {
      const res = await fetch("/api/bokjumoni/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (data.added) {
        setBokjumoniCount(data.count)
        setCheckinDone(true)
        toast.success("출석 체크인 완료! 복주머니 +1")
      } else {
        setCheckinDone(true)
        toast.info("오늘은 이미 체크인했어요")
      }
    } catch {
      toast.error("체크인에 실패했���요. 다시 시도해주세요.")
    }
    setCheckinLoading(false)
  }

  async function handlePurchase(packageId: string) {
    if (!userId) return
    setPurchaseLoading(packageId)
    try {
      const res = await fetch("/api/bokjumoni/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, package: packageId }),
      })
      const data = await res.json()
      if (data.count !== undefined) {
        const pkg = PACKAGES.find(p => p.id === packageId)
        setBokjumoniCount(data.count)
        toast.success(`${pkg?.name ?? "복주머니"} 구매 완료! +${data.added ?? pkg?.count}개`)
      }
    } catch {
      toast.error("구매에 실패했어요. 다시 시도해주세요.")
    }
    setPurchaseLoading(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100svh-49px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-8">
      {/* 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">👜 복주머니</h1>
        <p className="text-sm text-muted-foreground">
          상담에 필요한 복주머니를 충전해
        </p>
      </div>

      {/* 현재 잔량 */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
        <p className="text-5xl font-bold text-primary">{bokjumoniCount ?? 0}</p>
        <p className="text-sm text-muted-foreground">현재 복주머니</p>
      </div>

      {/* 출석 체크인 */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">📅 출석 체크인</h2>
            <p className="text-xs text-muted-foreground mt-0.5">매일 1회, 복주머니 +1</p>
          </div>
          <Button
            size="sm"
            onClick={handleCheckin}
            disabled={checkinDone || checkinLoading}
          >
            {checkinLoading ? "..." : checkinDone ? "완료" : "체크인"}
          </Button>
        </div>
      </div>

      {/* 상점 */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">🏪 상점</h2>
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-2.5 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            테스트 환경 — 실제 결제 없이 바로 충전돼요
          </p>
        </div>

        <div className="space-y-3">
          {PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pkg.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">복주머니 {pkg.count}개</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{pkg.price}</span>
                <Button
                  size="sm"
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchaseLoading === pkg.id}
                >
                  {purchaseLoading === pkg.id ? "..." : "구매하기"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 설명 */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">복주머니란?</p>
        <div className="flex items-start gap-2">
          <span>👜</span>
          <span>상담 메시지 1회에 복주머니 1개를 사용해</span>
        </div>
        <div className="flex items-start gap-2">
          <span>📅</span>
          <span>매일 출석 체크인하면 복주머니 1개 충전</span>
        </div>
        <div className="flex items-start gap-2">
          <span>🏪</span>
          <span>더 필요하면 상점에서 추가 구매 가능</span>
        </div>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        className="w-full"
        onClick={() => router.push("/chat")}
        disabled={(bokjumoniCount ?? 0) <= 0}
      >
        {(bokjumoniCount ?? 0) > 0 ? "상담하러 가기 →" : "복주머니를 충전해주세요"}
      </Button>
    </div>
  )
}
