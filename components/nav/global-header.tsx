"use client"

import { useState, useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getUserId, clearUser } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Home, MessageCircle, Coins, User, LogOut, Sparkles } from "lucide-react"

const NAV_ITEMS: { href: string; label: string; icon: ReactNode; auth?: boolean }[] = [
  { href: "/", label: "홈", icon: <Home className="h-4 w-4" /> },
  { href: "/chat", label: "상담", icon: <MessageCircle className="h-4 w-4" />, auth: true },
  { href: "/bokchae", label: "복채", icon: <Coins className="h-4 w-4" />, auth: true },
  { href: "/mypage", label: "내 정보", icon: <User className="h-4 w-4" />, auth: true },
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
    if (confirm("로그아웃하면 대화 기록에 접근할 수 없어요. 계속할까요?")) {
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-text.png" alt="폴라리스" className="h-4.5 w-auto dark:invert" />
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3">
        {/* 로고 */}
        <button onClick={() => router.push("/")} className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-text.png" alt="폴라리스" className="h-4.5 w-auto dark:invert" />
        </button>

        <div className="flex items-center gap-0.5">
          {/* 네비 메뉴 */}
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href
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
                  <span className="md:mr-1">{item.icon}</span>
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
              <LogOut className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">로그아웃</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => router.push("/onboarding")}>
              <Sparkles className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">시작하기</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
