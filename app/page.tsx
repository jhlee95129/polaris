"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getUserId, setUserId, setPendingTopic } from "@/lib/storage"
import { TOPIC_CATEGORIES } from "@/lib/topic-data"
import {
  Star,
  ArrowRight,
  Brain,
  MessageCircle,
  ChevronDown,
  X,
  Check,
  BookOpen,
  Heart,
  Loader2,
  type LucideIcon,
} from "lucide-react"

/* ── 경쟁 비교표 데이터 ── */
const COMPETITORS = [
  { name: "운세 앱",     accuracy: true,  freeform: false, memory: false, accessible: true  },
  { name: "챗봇 서비스", accuracy: false, freeform: true,  memory: false, accessible: true  },
  { name: "점집 (오프라인)", accuracy: true,  freeform: true,  memory: true,  accessible: false },
]

/* ── Hero 배경 데코레이션 ── */
function HeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 중앙 방사 그라데이션 — 스포트라이트 */}
      <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_75/0.18)_0%,transparent_70%)]" />

      {/* 궤도 링 — 천체 운행 */}
      <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/14 dark:border-accent/18" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/8 dark:border-accent/12" />
      <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/5 dark:border-accent/8" />

      {/* 별 요소 — 반짝이는 도트 */}
      {[
        { top: "12%", left: "15%", size: 5, delay: 0 },
        { top: "8%",  left: "72%", size: 4, delay: 1.2 },
        { top: "25%", left: "85%", size: 6, delay: 0.5 },
        { top: "65%", left: "10%", size: 4, delay: 1.8 },
        { top: "78%", left: "80%", size: 5, delay: 0.8 },
        { top: "45%", left: "5%",  size: 4, delay: 2.2 },
        { top: "35%", left: "92%", size: 5, delay: 1.5 },
        { top: "88%", left: "25%", size: 4, delay: 0.3 },
        { top: "18%", left: "45%", size: 4, delay: 2.0 },
        { top: "72%", left: "55%", size: 5, delay: 1.0 },
        { top: "40%", left: "18%", size: 3, delay: 0.6 },
        { top: "55%", left: "88%", size: 4, delay: 1.6 },
      ].map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/35 dark:bg-accent/55"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animation: `twinkle 3s ease-in-out ${star.delay}s infinite, drift ${12 + i * 2}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      {/* 십자형 별 — 포인트 장식 */}
      {[
        { top: "20%", left: "22%", size: 28, delay: 0.7 },
        { top: "68%", left: "78%", size: 24, delay: 1.4 },
        { top: "15%", left: "80%", size: 20, delay: 2.1 },
        { top: "75%", left: "15%", size: 18, delay: 0.3 },
      ].map((s, i) => (
        <svg
          key={`cross-${i}`}
          className="absolute text-primary/18 dark:text-accent/30"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animation: `twinkle 4s ease-in-out ${s.delay}s infinite`,
          }}
          viewBox="0 0 16 16" fill="currentColor"
        >
          <path d="M8 0 L8.8 6.4 L16 8 L8.8 9.6 L8 16 L7.2 9.6 L0 8 L7.2 6.4 Z" />
        </svg>
      ))}
    </div>
  )
}

/* ── Hero 사주 4기둥 미니 비주얼 ── */
function PillarMini() {
  const pillars = [
    { hanja: "時", label: "시주" },
    { hanja: "日", label: "일주" },
    { hanja: "月", label: "월주" },
    { hanja: "年", label: "년주" },
  ]
  return (
    <div className="flex items-center justify-center gap-2.5">
      {pillars.map((p, i) => (
        <div
          key={p.hanja}
          className="saju-card-border rounded-lg bg-card/80 px-3.5 py-3 text-center backdrop-blur-sm"
          style={{ animation: `fadeInUp 0.5s ease ${0.1 + i * 0.1}s both` }}
        >
          <p className="text-gold-gradient text-2xl font-bold">{p.hanja}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{p.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ── 확장 대화 데모 ── */
function ChatDemo() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="saju-card-border overflow-hidden rounded-2xl bg-card shadow-lg">
        {/* 채팅 헤더 */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
          <Star className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">폴라리스</span>
        </div>

        <div className="space-y-3 p-4">
          {/* 유저 1 */}
          <div className="flex justify-end" style={{ animation: "fadeInUp 0.5s ease 0.2s both" }}>
            <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary/10 px-3.5 py-2">
              <p className="text-sm">요즘 이직할까 고민이야...</p>
            </div>
          </div>

          {/* 폴라리스 1 */}
          <div className="flex justify-start" style={{ animation: "fadeInUp 0.5s ease 0.5s both" }}>
            <div className="max-w-[85%] space-y-1.5">
              <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2">
                <p className="text-sm leading-relaxed">
                  지은아, 지금 네 대운이 신금 흐름이라 직장에서 압박감이 꽤 클 시기야.
                  편관의 기운이 강해서 윗사람과 부딪히기 쉽거든.
                  <br />
                  <span className="mt-1 inline-block text-muted-foreground">
                    지금 당장 뛰쳐나가기보다, 정말 원하는 게 뭔지 먼저 정리해볼래?
                  </span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                <BookOpen className="h-3 w-3" /> 상세 분석 보기
              </span>
            </div>
          </div>

          {/* 유저 2 */}
          <div className="flex justify-end" style={{ animation: "fadeInUp 0.5s ease 0.8s both" }}>
            <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary/10 px-3.5 py-2">
              <p className="text-sm">사실 팀장이랑 매일 부딪혀...</p>
            </div>
          </div>

          {/* 폴라리스 2 */}
          <div className="flex justify-start" style={{ animation: "fadeInUp 0.5s ease 1.1s both" }}>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2">
              <p className="text-sm leading-relaxed">
                그 답답함 충분히 이해해. 네 일간이 병화라 솔직하고 직선적인데,
                편관 시기엔 그게 오히려 더 충돌하기 쉬워.
                <span className="mt-1 inline-block text-muted-foreground">
                  팀장이랑 부딪힐 때 제일 힘든 상황이 뭐야?
                </span>
              </p>
            </div>
          </div>

          {/* 시간 구분선 */}
          <div
            className="flex items-center gap-3 py-1"
            style={{ animation: "fadeInUp 0.5s ease 1.4s both" }}
          >
            <div className="h-px flex-1 border-t border-dashed border-border" />
            <span className="text-[11px] text-muted-foreground">3일 후</span>
            <div className="h-px flex-1 border-t border-dashed border-border" />
          </div>

          {/* 폴라리스 3 — 기억 */}
          <div className="flex justify-start" style={{ animation: "fadeInUp 0.5s ease 1.7s both" }}>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-primary/20 bg-primary/[0.03] px-3.5 py-2">
              <p className="text-sm leading-relaxed">
                지은아, 지난번 팀장 얘기 어떻게 됐어?
                혹시 그 후로 달라진 거 있어?
              </p>
            </div>
          </div>
        </div>

        {/* 주석 */}
        <div className="border-t border-border bg-muted/20 px-4 py-2">
          <p className="text-center text-[11px] text-primary">
            지난 대화를 기억하고 먼저 물어봐줘
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── 메인 랜딩 페이지 ── */
export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hasUser, setHasUser] = useState(false)
  const [nicknameInput, setNicknameInput] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState("")

  useEffect(() => {
    const uid = getUserId()
    if (uid) {
      router.replace("/dashboard")
      return
    }
    setHasUser(false)
    setMounted(true)
  }, [router])

  function handleTopicClick(message: string) {
    if (message) setPendingTopic(message)
    router.push(hasUser ? "/chat" : "/onboarding")
  }

  async function handleNicknameLogin() {
    const name = nicknameInput.trim()
    if (!name) return
    setLookupLoading(true)
    setLookupError("")
    try {
      const res = await fetch(`/api/user/lookup?name=${encodeURIComponent(name)}`)
      const data = await res.json()
      if (data.found) {
        setUserId(data.user_id)
        router.push("/dashboard")
      } else {
        router.push(`/onboarding?nickname=${encodeURIComponent(name)}`)
      }
    } catch {
      setLookupError("연결에 실패했어요. 다시 시도해주세요.")
    }
    setLookupLoading(false)
  }

  if (!mounted) {
    return <div className="min-h-svh bg-background" />
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {/* ── 배경 장식 ── */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/[0.09] blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-accent/[0.10] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-primary/[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[918px] px-5">

        {/* ═══════════════════════════════════════════
            S1: Hero — 5초 안에 "사주 서비스" 인식
        ═══════════════════════════════════════════ */}
        <section className="star-pattern relative flex min-h-[calc(100svh-57px)] flex-col items-center justify-center pb-8 pt-16 text-center">
          <HeroDecoration />

          {/* 배지 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 shadow-sm backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">사주 기반 대화형 코칭 서비스</span>
          </div>

          {/* 사주 4기둥 미니 비주얼 */}
          <div className="mb-8">
            <PillarMini />
          </div>

          {/* 헤드라인 */}
          {hasUser ? (
            <h1 className="text-4xl font-extrabold leading-snug tracking-tight sm:text-5xl sm:leading-snug">
              <span className="text-gold-gradient">다시 와줬네.</span>
            </h1>
          ) : (
            <h1 className="text-4xl font-extrabold leading-snug tracking-tight sm:text-5xl sm:leading-snug">
              운세 보고서를 넘어서,
              <br />
              <span className="text-gold-gradient">대화로 코칭하는 사주.</span>
            </h1>
          )}

          {/* 핵심 차별점 */}
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {hasUser
              ? "네 사주를 기억하고 있어. 이어서 얘기하자."
              : <>
                  <span>보고서가 아닌, 대화로 코칭</span>
                  <span className="text-border">·</span>
                  <span>지난 대화를 기억하는 상담</span>
                  <span className="text-border">·</span>
                  <span>모든 답변에 사주 근거 공개</span>
                </>
            }
          </p>

          {/* CTA — 닉네임 입력 */}
          <div className="mt-8 w-full max-w-sm space-y-3">
            <div className="flex gap-2 rounded-2xl border border-border bg-card/90 p-2 shadow-lg shadow-primary/10 backdrop-blur-sm">
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNicknameLogin()}
                className="flex-1 rounded-xl bg-transparent px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <Button
                size="lg"
                className="shrink-0 rounded-xl shadow-md shadow-primary/20"
                onClick={handleNicknameLogin}
                disabled={lookupLoading || !nicknameInput.trim()}
              >
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>시작</span><ArrowRight className="ml-1 h-4 w-4" /></>}
              </Button>
            </div>
            {lookupError && (
              <p className="text-xs text-destructive">{lookupError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              기존 닉네임이면 바로 로그인, 처음이면 간편 가입
            </p>
          </div>

          {/* 스크롤 유도 */}
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
            className="mt-12 flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="text-xs">더 알아보기</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </section>

        {/* ═══════════════════════════════════════════
            S2: 경쟁 비교표
        ═══════════════════════════════════════════ */}
        <section className="py-20">
          <h2 className="mb-2 text-center text-sm font-medium text-primary">
            왜 지금까지 없었을까?
          </h2>
          <p className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            사주 서비스,{" "}
            <span className="text-gold-gradient">뭐가 부족했을까?</span>
          </p>

          <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground" />
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">명식 정확</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">자유 대화</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">맥락 기억</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">접근성</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map(c => (
                  <tr key={c.name} className="border-b border-border/50">
                    <td className="px-4 py-3 text-muted-foreground">{c.name}</td>
                    <td className="px-3 py-3 text-center">{c.accuracy ? <Check className="mx-auto h-4 w-4 text-primary" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />}</td>
                    <td className="px-3 py-3 text-center">{c.freeform ? <Check className="mx-auto h-4 w-4 text-primary" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />}</td>
                    <td className="px-3 py-3 text-center">{c.memory ? <Check className="mx-auto h-4 w-4 text-primary" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />}</td>
                    <td className="px-3 py-3 text-center">{c.accessible ? <Check className="mx-auto h-4 w-4 text-primary" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />}</td>
                  </tr>
                ))}
                {/* 폴라리스 — 강조 행 */}
                <tr className="bg-primary/8">
                  <td className="px-4 py-3 font-semibold text-primary">폴라리스</td>
                  <td className="px-3 py-3 text-center"><Check className="mx-auto h-4 w-4 text-primary" /></td>
                  <td className="px-3 py-3 text-center"><Check className="mx-auto h-4 w-4 text-primary" /></td>
                  <td className="px-3 py-3 text-center"><Check className="mx-auto h-4 w-4 text-primary" /></td>
                  <td className="px-3 py-3 text-center"><Check className="mx-auto h-4 w-4 text-primary" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            지금까지 없었던{" "}
            <span className="font-medium text-foreground">새로운 사주 서비스</span>
          </p>
        </section>

        {/* ═══════════════════════════════════════════
            S3: 대화 데모
        ═══════════════════════════════════════════ */}
        <section className="py-20">
          <h2 className="mb-2 text-center text-sm font-medium text-primary">
            이렇게 대화해
          </h2>
          <p className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            운세 보고서가 아니라,{" "}
            <span className="text-gold-gradient">대화</span>
          </p>

          <ChatDemo />
        </section>

        {/* ═══════════════════════════════════════════
            S4: 차별화 — 왜 폴라리스?
        ═══════════════════════════════════════════ */}
        <section className="py-20">
          <h2 className="mb-2 text-center text-sm font-medium text-primary">
            나만의 사주 라이프 코치
          </h2>
          <p className="mb-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            언제든 곁에 있는{" "}
            <span className="text-gold-gradient">나만의 친구</span>
          </p>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            점쟁이가 아닌, 네 사주를 아는 라이프 코치
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: MessageCircle,
                title: "보고서가 아닌 대화",
                tag: "실시간 대화",
                desc: "5000자짜리 운세 보고서 대신, 네 상황을 듣고 대화로 코칭해줘. \"조심하세요\" 같은 모호한 말 없이, 지금 할 수 있는 행동을 알려줘.",
              },
              {
                icon: Brain,
                title: "올수록 나를 더 잘 알아",
                tag: "대화 기록 자동 저장",
                desc: "지난번 이직 고민, 연인과의 싸움 — 다 기억해. 대화가 쌓일수록 네 상황을 더 깊이 이해하고, 더 정확한 코칭을 해줄 수 있어.",
              },
              {
                icon: BookOpen,
                title: "근거 없는 말은 안 해",
                tag: "사주 근거 투명 공개",
                desc: "모든 코칭에 어떤 사주 요소를 근거로 했는지 확인할 수 있어. 일간·십신·대운 흐름까지, 블랙박스가 아닌 투명한 상담.",
              },
              {
                icon: Heart,
                title: "판단 없이, 네 편에서",
                tag: "공감 기반 코칭",
                desc: "정답을 강요하지 않아. 네 감정을 먼저 받아주고, 사주 흐름에 맞는 방향을 함께 찾아가는 따뜻한 코치.",
              },
            ].map(f => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mb-1.5 flex items-center gap-2">
                  <h3 className="text-base font-semibold">{f.title}</h3>
                </div>
                <span className="mb-2 inline-block rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-primary">{f.tag}</span>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            S6: 프로세스 — 시작은 간단해
        ═══════════════════════════════════════════ */}
        <section className="py-20">
          <h2 className="mb-2 text-center text-sm font-medium text-primary">
            이렇게 시작해
          </h2>
          <p className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            시작은{" "}
            <span className="text-gold-gradient">간단해</span>
          </p>

          <div className="mx-auto max-w-md space-y-0">
            {[
              {
                step: "01",
                title: "생년월일 알려주기",
                desc: "양력이든 음력이든, 1분이면 돼.",
              },
              {
                step: "02",
                title: "사주 분석",
                desc: "만세력으로 네 사주팔자를 계산해.",
              },
              {
                step: "03",
                title: "고민 털어놓기",
                desc: "그 다음부터는 친구한테 말하듯이 편하게.",
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
                  <h3 className="mb-1 text-base font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      {/* ═══════════════════════════════════════════
          CTA 영역 — 설명과 구분되는 액션 존
      ═══════════════════════════════════════════ */}
      </div>
      <div className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-[918px] px-5">
          <section className="pt-16 pb-6">
            <p className="mb-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              고민 하나{" "}
              <span className="text-gold-gradient">골라봐</span>
            </p>
            <p className="mb-10 text-center text-sm text-muted-foreground">
              누르면 바로 상담이 시작돼
            </p>

            <div className="space-y-8">
              {TOPIC_CATEGORIES.map(category => (
                <div key={category.label}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-base">{category.emoji}</span>
                    <h3 className="text-sm font-semibold">{category.label}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                    {category.cards.map(card => (
                      <button
                        key={card.key}
                        onClick={() => handleTopicClick(card.message)}
                        className={cn(
                          "group cursor-pointer rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-1 active:scale-[0.97]",
                          card.key === "free"
                            ? "border border-dashed border-border bg-card hover:border-primary/40"
                            : card.bg,
                        )}
                      >
                        <span className="mb-2 block text-3xl drop-shadow-sm">{card.emoji}</span>
                        <p className="text-[13px] font-medium leading-snug text-foreground">{card.prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              닉네임만 입력하면 바로 시작할 수 있어.
            </p>
            <div className="mx-auto mt-4 flex max-w-xs gap-2">
              <input
                type="text"
                placeholder="닉네임"
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNicknameLogin()}
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button
                size="lg"
                className="shrink-0 shadow-md shadow-primary/20"
                onClick={handleNicknameLogin}
                disabled={lookupLoading || !nicknameInput.trim()}
              >
                시작
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </section>
        </div>
      </div>
      <div className="mx-auto max-w-[918px] px-5">

        {/* 푸터 */}
        <footer className="border-t border-border py-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            <span>폴라리스 — 길을 잃었을 때, 방향을 잡아주는 별</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
