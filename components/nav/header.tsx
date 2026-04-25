"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-[52px] max-w-[724px] items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/home" className="flex items-center gap-1.5">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight text-primary">한수</span>
        </Link>

        {/* 나 페이지 링크 */}
        <Link
          href="/my"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            pathname === "/my"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <User className="h-4.5 w-4.5" />
        </Link>
      </div>
    </header>
  )
}
