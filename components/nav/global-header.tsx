"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getUserId, clearUser } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  emoji: string
  auth?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈", emoji: "🏠" },
  { href: "/chat", label: "상담", emoji: "💬", auth: true },
  { href: "/bokchae", label: "복주머니", emoji: "👜", auth: true },
  { href: "/mypage", label: "내 정보", emoji: "👤", auth: true },
]

export default function GlobalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [hasUser, setHasUser] = useState(false)

  useEffect(() => {
    setHasUser(!!getUserId())
  }, [pathname])

  function handleNavClick(href: string, auth?: boolean) {
    if (auth && !hasUser) {
      router.push("/onboarding")
      return
    }
    router.push(href)
  }

  function handleLogout() {
    if (confirm("로그아웃해요. 나중에 같은 닉네임으로 다시 로그인할 수 있어요.")) {
      clearUser()
      setHasUser(false)
      router.push("/")
    }
  }

  // 온보딩에서는 로고만
  if (pathname === "/onboarding") {
    return (
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center px-6 py-3">
          <button onClick={() => router.push("/")} className="flex items-center">
            <span className="text-lg font-bold tracking-tight font-[var(--font-logo)]">폴라리스</span>
          </button>
        </div>
      </header>
    )
  }

  // 상담 페이지에서는 헤더 배경을 사이드바와 동일하게
  const isChat = pathname === "/chat"
  const headerBg = isChat
    ? "bg-surface-dim/80 backdrop-blur-md"
    : "bg-background/80 backdrop-blur-md"

  // 로그인 시 "홈"은 대시보드로
  const navItems = NAV_ITEMS.map(item =>
    item.href === "/" && hasUser
      ? { ...item, href: "/dashboard", label: "대시보드" }
      : item
  )

  return (
    <header className={cn("sticky top-0 z-50 border-b border-border/50", headerBg)}>
      <div className="flex items-center justify-between px-6 py-3">
        {/* 로고 */}
        <button onClick={() => router.push(hasUser ? "/dashboard" : "/")} className="flex items-center">
          <span className="text-lg font-bold tracking-tight font-[var(--font-logo)]">폴라리스</span>
        </button>

        <div className="flex items-center gap-0.5">
          {/* 네비 메뉴 */}
          <nav className="flex items-center gap-0.5">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavClick(item.href, item.auth)}
                  className={isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <span className="md:mr-1 text-sm">{item.emoji}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              )
            })}
          </nav>

          {/* 구분선 */}
          <div className="mx-1 h-5 w-px bg-border" />

          {/* 로그인/로그아웃 */}
          {hasUser ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <span className="md:mr-1 text-sm">🚪</span>
              <span className="hidden md:inline">로그아웃</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => router.push("/onboarding")}>
              <span className="md:mr-1 text-sm">⭐</span>
              <span className="hidden md:inline">시작하기</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
