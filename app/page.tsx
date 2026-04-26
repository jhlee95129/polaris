"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getUserId } from "@/lib/storage"
import {
  Star,
  ArrowRight,
  Brain,
  MessageCircle,
  Compass,
  CalendarDays,
  ScanSearch,
  MessagesSquare,
  ChevronDown,
} from "lucide-react"

/* ── 채팅 미리보기 Mock ── */
function ChatPreview() {
  return (
    <div className="mx-auto mt-12 w-full max-w-sm">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        {/* Mock 헤더 */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
          <Star className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">폴라리스</span>
        </div>

        {/* Mock 메시지 */}
        <div className="space-y-3 p-4">
          {/* 사용자 */}
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary/10 px-3.5 py-2">
              <p className="text-sm">요즘 이직할까 고민이야...</p>
            </div>
          </div>

          {/* 폴라리스 */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2">
              <p className="text-sm leading-relaxed">
                지은아, 지금 네 대운이 신금인데 편관의 기운이 강해. 직장에서 압박이 심한 시기거든. 근데 이걸 견디면 확실히 성장해.
                <br />
                <span className="mt-1 inline-block text-muted-foreground">
                  지금 당장 뛰쳐나가기보다, 정말 원하는 게 뭔지 먼저 정리해볼래?
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hasUser, setHasUser] = useState(false)

  useEffect(() => {
    setHasUser(!!getUserId())
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-svh bg-background" />
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {/* ── 배경 장식 ── */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-accent/[0.08] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[918px] px-5">
        {/* ════════════════════════════════════════
            Section 1: Hero
        ════════════════════════════════════════ */}
        <section className="flex min-h-[calc(100svh-57px)] flex-col items-center justify-center pb-8 pt-16 text-center">
          {/* 태그 */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 shadow-sm backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">길을 잃었을 때, 방향을 잡아주는 별</span>
          </div>

          {/* 메인 카피 */}
          <h1 className="text-4xl font-extrabold leading-snug tracking-tight sm:text-5xl sm:leading-snug">
            내 상황을 들어주고,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              사주로 방향을 찾아주는 친구.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            정해진 운명 보고서가 아니라,
            <br />
            네 고민을 사주 프레임으로 해석해주는 대화 상대.
          </p>

          {/* CTA */}
          <div className="mt-8 w-full max-w-xs space-y-3">
            <Button
              size="lg"
              className="w-full text-base shadow-md shadow-primary/20"
              onClick={() => router.push(hasUser ? "/chat" : "/onboarding")}
            >
              {hasUser ? "대화 이어가기" : "폴라리스한테 물어보기"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!hasUser && (
              <p className="text-xs text-muted-foreground">
                생년월일만 입력하면 바로 시작
              </p>
            )}
          </div>

          {/* 채팅 미리보기 */}
          <ChatPreview />

          {/* 스크롤 힌트 — 바운스 애니메이션 */}
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
            className="mt-10 flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="text-xs">더 알아보기</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </section>

        {/* ════════════════════════════════════════
            Section 2: 왜 폴라리스인가
        ════════════════════════════════════════ */}
        <section className="py-20">
          <h2 className="mb-2 text-center text-sm font-medium text-primary">
            왜 폴라리스인가
          </h2>
          <p className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            운세 보고서 말고,{" "}
            <span className="text-primary">대화 상대</span>
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Brain,
                title: "네 명식을 기억해",
                desc: "한 번 생년월일 알려주면 사주를 기억하고, 매번 너한테 맞는 이야기를 해줘.",
              },
              {
                icon: MessageCircle,
                title: "임의의 고민을 던져",
                desc: "카테고리 선택 없이, 지금 네 상황을 그냥 말해. 사주 프레임으로 해석해줄게.",
              },
              {
                icon: Compass,
                title: "방향을 같이 찾아",
                desc: "이직, 연애, 재물, 건강 — 답이 아니라 네 기운에 맞는 방향을 찾아줘.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            Section 3: 이렇게 써
        ════════════════════════════════════════ */}
        <section className="py-20">
          <h2 className="mb-2 text-center text-sm font-medium text-primary">
            이렇게 써
          </h2>
          <p className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            3단계면 끝
          </p>

          <div className="mx-auto max-w-md space-y-0">
            {[
              {
                icon: CalendarDays,
                step: "01",
                title: "생년월일 입력",
                desc: "양력/음력, 태어난 시간까지. 1분이면 돼.",
              },
              {
                icon: ScanSearch,
                step: "02",
                title: "명식 분석",
                desc: "만세력으로 사주팔자를 계산하고, 너만의 명식을 읽어줄게.",
              },
              {
                icon: MessagesSquare,
                step: "03",
                title: "편하게 대화",
                desc: "고민이 있을 때마다 와. 네 사주를 기억하고 있으니까.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  {i < 2 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-10">
                  <div className="mb-1 flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold">{s.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            Section 4: 하단 CTA
        ════════════════════════════════════════ */}
        <section className="py-20 text-center">
          <div className="rounded-2xl border border-border bg-card/70 p-8 backdrop-blur-sm sm:p-10">
            <Star className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {hasUser ? "다시 대화하러 갈까?" : "지금 폴라리스한테 물어봐"}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {hasUser ? "네 사주를 기억하고 있어." : "생년월일만 알려주면 바로 시작할 수 있어."}
            </p>
            <Button
              size="lg"
              className="mt-6 w-full max-w-xs text-base shadow-md shadow-primary/20"
              onClick={() => router.push(hasUser ? "/chat" : "/onboarding")}
            >
              {hasUser ? "대화 이어가기" : "시작하기"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="border-t border-border py-8 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            <span>폴라리스 — 길을 잃었을 때, 방향을 잡아주는 별</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
