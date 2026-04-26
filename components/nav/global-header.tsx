"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function GlobalHeader() {
  const pathname = usePathname()
  const router = useRouter()

  // 채팅 페이지에서는 헤더를 숨김 (자체 사이드바/헤더 사용)
  if (pathname === "/chat") return null

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[918px] items-center justify-between px-5 py-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-text.png"
            alt="폴라리스"
            className="h-6 w-auto dark:invert"
          />
        </button>

        {/* 랜딩/온보딩에서만 CTA 표시 */}
        {(pathname === "/" || pathname === "/onboarding") && (
          <Button size="sm" onClick={() => router.push("/onboarding")}>
            시작하기
          </Button>
        )}
      </div>
    </header>
  )
}
