import Link from "next/link"
import { Sparkles } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* 브랜드 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-base font-bold text-primary">한수</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              AI 사주 라이프 코치. 사주로 읽는 오늘의 한수를 받아보세요.
            </p>
          </div>

          {/* 링크 */}
          <div className="flex gap-10 text-xs">
            <div className="space-y-2">
              <p className="font-medium text-foreground">서비스</p>
              <nav className="flex flex-col gap-1.5">
                <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors">오늘</Link>
                <Link href="/ask" className="text-muted-foreground hover:text-foreground transition-colors">상담</Link>
                <Link href="/my" className="text-muted-foreground hover:text-foreground transition-colors">나</Link>
              </nav>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">안내</p>
              <nav className="flex flex-col gap-1.5">
                <span className="text-muted-foreground">이용약관</span>
                <span className="text-muted-foreground">개인정보처리방침</span>
              </nav>
            </div>
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-8 flex flex-col gap-2 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} 한수. 본 서비스의 상담 내용은 참고 목적이며, 전문 상담을 대체하지 않습니다.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Powered by Claude AI &middot; 뤼튼 Product Engineer 과제
          </p>
        </div>
      </div>
    </footer>
  )
}
