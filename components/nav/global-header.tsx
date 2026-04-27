"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getUserId, clearUser } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Home, LayoutDashboard, MessageCircle, Store, UserRound, LogOut, Star, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  auth?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/chat", label: "상담", icon: MessageCircle, auth: true },
  { href: "/bokchae", label: "상점", icon: Store, auth: true },
  { href: "/mypage", label: "내 정보", icon: UserRound, auth: true },
]

export default function GlobalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [hasUser, setHasUser] = useState(false)
  const { theme, setTheme } = useTheme()

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
    clearUser()
    setHasUser(false)
    router.push("/")
  }

  // 온보딩에서는 로고만
  if (pathname === "/onboarding") {
    return (
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center px-6 py-3">
          <button onClick={() => router.push("/")} className="flex items-center">
            <span className="font-[family-name:var(--font-logo)] text-xl text-foreground" style={{ WebkitTextStroke: "1px currentColor" }}>폴라리스</span>
          </button>
        </div>
      </header>
    )
  }

  const headerBg = "bg-background/80 backdrop-blur-md"

  // 로그인 시 "홈"은 대시보드로
  const navItems = NAV_ITEMS.map(item =>
    item.href === "/" && hasUser
      ? { ...item, href: "/dashboard", label: "대시보드", icon: LayoutDashboard }
      : item
  )

  return (
    <header className={cn("sticky top-0 z-50 border-b border-border/50", headerBg)}>
      <div className="flex items-center justify-between px-6 py-3">
        {/* 로고 */}
        <button onClick={() => router.push(hasUser ? "/dashboard" : "/")} className="flex items-center">
          <span className="font-[family-name:var(--font-logo)] text-xl text-foreground" style={{ WebkitTextStroke: "1px currentColor" }}>폴라리스</span>
        </button>

        <div className="flex items-center gap-0.5">
          {/* 네비 메뉴 */}
          <nav className="flex items-center gap-0.5">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")
              const Icon = item.icon
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
                  <Icon className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              )
            })}
          </nav>

          {/* 테마 토글 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>

          {/* 구분선 */}
          <div className="mx-1 h-5 w-px bg-border" />

          {/* 로그인/로그아웃 */}
          {hasUser ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">로그아웃</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>로그아웃</AlertDialogTitle>
                  <AlertDialogDescription>
                    로그아웃해요. 나중에 같은 닉네임으로 다시 로그인할 수 있어요.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button size="sm" onClick={() => router.push("/onboarding")}>
              <Star className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">시작하기</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
