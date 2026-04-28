"use client"

import { useState, memo } from "react"
import type { BasisData } from "./MessageList"
import {
  STEM_MAP,
  BRANCH_MAP,
  ELEMENTS,
  ELEMENT_COLORS,
  ELEMENT_BG,
  ELEMENT_EMOJI,
  PILLAR_EMOJI,
  calculateTenGod,
  pillarToHanja,
  getIlganElement,
  type Element,
} from "@/lib/saju-data"
import { CHARACTERS, type CharacterId } from "@/lib/characters"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

/** 경량 인라인 마크다운 → ReactNode 변환 */
function renderInlineMarkdown(text: string) {
  const lines = text.split("\n")
  const result: React.ReactNode[] = []

  lines.forEach((line, li) => {
    if (li > 0) result.push("\n")
    // ### / ## 헤딩 → bold 텍스트로 변환
    const heading = line.match(/^#{2,3}\s+(.+)$/)
    if (heading) { result.push(<strong key={`h${li}`} className="text-xs font-semibold text-foreground/80">{heading[1]}</strong>); return }

    // 인라인: **bold**, *italic*, [text](url)
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/)
    parts.forEach((seg, si) => {
      const k = `${li}-${si}`
      const bold = seg.match(/^\*\*(.+)\*\*$/)
      if (bold) { result.push(<strong key={k} className="font-semibold text-foreground/90">{bold[1]}</strong>); return }
      const italic = seg.match(/^\*(.+)\*$/)
      if (italic) { result.push(<em key={k}>{italic[1]}</em>); return }
      const link = seg.match(/^\[(.+)\]\((.+)\)$/)
      if (link) { result.push(<a key={k} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link[1]}</a>); return }
      result.push(seg)
    })
  })
  return result
}

/** RAG 청크 카테고리 자동 감지 */
const CHUNK_CATEGORIES: Array<{ pattern: RegExp; label: string; color: string; bgClass: string }> = [
  { pattern: /대운|세운|大運/, label: "대운 해석", color: "text-violet-700 dark:text-violet-300", bgClass: "bg-violet-50/60 dark:bg-violet-950/20 border-violet-200/50 dark:border-violet-800/30" },
  { pattern: /합|충|형|파|해|삼합|육합|방합/, label: "합충형파해", color: "text-rose-700 dark:text-rose-300", bgClass: "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30" },
  { pattern: /격국|격$|종격|건록|양인/, label: "격국 분석", color: "text-cyan-700 dark:text-cyan-300", bgClass: "bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-200/50 dark:border-cyan-800/30" },
  { pattern: /궁|연주|월주|일주|시주/, label: "궁위 해석", color: "text-emerald-700 dark:text-emerald-300", bgClass: "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30" },
  { pattern: /직업|진로|연애|관계|건강|재물|마음/, label: "상황별 코칭", color: "text-amber-700 dark:text-amber-300", bgClass: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30" },
  { pattern: /오행|목|화|토|금|수/, label: "오행 관계", color: "text-teal-700 dark:text-teal-300", bgClass: "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200/50 dark:border-teal-800/30" },
  { pattern: /십신|비견|겁재|식신|상관|편재|정재|편관|정관|편인|정인/, label: "십신 분석", color: "text-blue-700 dark:text-blue-300", bgClass: "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30" },
]

const DEFAULT_CHUNK_CAT = { label: "명리 지식", color: "text-orange-700 dark:text-orange-300", bgClass: "bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-800/30" }

/** 십신별 이모지 */
const TEN_GOD_EMOJI: Record<string, string> = {
  비견: "🤝", 겁재: "⚔️",
  식신: "🍀", 상관: "💡",
  편재: "💰", 정재: "🏦",
  편관: "🛡️", 정관: "👔",
  편인: "📚", 정인: "🎓",
}

function getTenGodEmoji(tenGod: string): string {
  return TEN_GOD_EMOJI[tenGod] || "⭐"
}

function detectChunkCategory(title: string, body: string) {
  const text = `${title} ${body.slice(0, 100)}`
  return CHUNK_CATEGORIES.find(c => c.pattern.test(text)) || DEFAULT_CHUNK_CAT
}

/** 코칭 포인트를 분리하여 하이라이트 ("코칭 원칙:" / "코칭:" 모두 처리) */
function splitCoachingPoint(body: string): { main: string; coaching: string | null } {
  const coachingMatch = body.match(/코칭(?:\s*원칙)?:\s*"([\s\S]+?)"/)
  if (coachingMatch) {
    const main = body.slice(0, coachingMatch.index).trim()
    return { main, coaching: coachingMatch[1] }
  }
  const altMatch = body.match(/코칭(?:\s*원칙)?:\s*(.+?)$/m)
  if (altMatch) {
    const main = body.slice(0, altMatch.index).trim()
    return { main, coaching: altMatch[1].replace(/^"|"$/g, "") }
  }
  return { main: body, coaching: null }
}

/** RAG 지식 청크 카드 */
function KnowledgeChunkCard({ chunk }: { chunk: string }) {
  const titleMatch = chunk.match(/^## (.+)\n/)
  const title = titleMatch ? titleMatch[1] : null
  const rawBody = title ? chunk.replace(/^## .+\n/, "") : chunk
  const category = detectChunkCategory(title || "", rawBody)
  const { main, coaching } = splitCoachingPoint(rawBody)

  return (
    <div className={`rounded-2xl border ${category.bgClass} p-4`}>
      <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2">
        <span className={category.color}>{category.label}</span>
        {title && <span className="text-foreground/60">·</span>}
        {title && <span className="font-semibold text-foreground/70">{title}</span>}
      </h3>
      <p className="text-sm leading-relaxed text-foreground/70 whitespace-pre-wrap">
        {renderInlineMarkdown(main)}
      </p>
      {coaching && (
        <div className="rounded-lg bg-white/60 dark:bg-white/5 border border-border/30 px-3 py-2.5 mt-2">
          <p className="text-sm font-bold tracking-wide text-amber-600 dark:text-amber-400 mb-1">🧭 코칭 포인트</p>
          <p className="text-sm leading-relaxed font-medium text-foreground/80 italic">
            &ldquo;{coaching}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}

const TOPIC_META: Record<string, { label: string; emoji: string }> = {
  career: { label: "직업·진로", emoji: "💼" },
  relationship: { label: "인간관계", emoji: "🤝" },
  love: { label: "연애·결혼", emoji: "💕" },
  family: { label: "가족", emoji: "👨‍👩‍👧‍👦" },
  health: { label: "건강", emoji: "💪" },
  finance: { label: "재정·금전", emoji: "💰" },
  education: { label: "학업·시험", emoji: "📚" },
  mindset: { label: "마음가짐", emoji: "🧘" },
  timing: { label: "시기·타이밍", emoji: "⏳" },
  general: { label: "전반", emoji: "✨" },
}

const DEFAULT_TOPIC = { label: "기타", emoji: "💬" }

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  basis?: BasisData
  ilgan?: string
  isStreaming?: boolean
  isAnalyzing?: boolean
  displayName?: string
  characterId?: CharacterId
  isBokchaeMessage?: boolean
  onBokchaeOpen?: () => void
}

function getReferencedPillarInfo(
  pillarName: string,
  basis: BasisData,
  dayStem?: string,
) {
  const pillarMap: Record<string, string | null | undefined> = {
    년주: basis.pillars.yeon,
    월주: basis.pillars.wol,
    일주: basis.pillars.il,
    시주: basis.pillars.si,
    대운: basis.daeun,
  }
  const value = pillarMap[pillarName]
  if (!value || value.length < 2) return null

  const stem = STEM_MAP[value[0]]
  const branch = BRANCH_MAP[value[1]]
  if (!stem || !branch) return null

  let tenGod: string | null = null
  if (dayStem && value[0] !== dayStem) {
    try { tenGod = calculateTenGod(dayStem, value[0]) } catch { /* skip */ }
  }

  return { hangul: value, hanja: pillarToHanja(value), stem, branch, tenGod }
}

/* 사용자 아바타 — 오행 이모지 + 닉네임 라벨 */
function UserAvatar({ ilgan, displayName }: { ilgan?: string; displayName?: string }) {
  const element = ilgan ? getIlganElement(ilgan) : null
  const emoji = element ? ELEMENT_EMOJI[element] : "👤"
  return (
    <div className="shrink-0 flex flex-col items-center gap-0.5">
      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 border border-primary/20">
        <span className="text-base leading-none">{emoji}</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[60px]">
        {displayName || "나"}
      </span>
    </div>
  )
}

/* AI 아바타 — 캐릭터별 이모지 + 이름 + 말하기 애니메이션 */
function AiAvatar({ characterId = "seonbi", speaking }: { characterId?: CharacterId; speaking?: boolean }) {
  const char = CHARACTERS[characterId] || CHARACTERS.seonbi
  return (
    <div className="shrink-0 flex flex-col items-center gap-0.5">
      <div className={`flex items-center justify-center h-9 w-9 rounded-full ${char.colorClass.avatarBg} shadow-sm transition-transform duration-300 ${speaking ? "avatar-speaking" : ""}`}>
        <span className={`text-base leading-none transition-transform duration-300 ${speaking ? "scale-110" : ""}`}>{char.emoji}</span>
      </div>
      <span className={`text-[10px] ${char.colorClass.nameText} font-medium`}>{char.name}</span>
    </div>
  )
}

export default memo(function MessageBubble({ role, content, basis, ilgan, isStreaming, isAnalyzing, displayName, characterId, isBokchaeMessage, onBokchaeOpen }: MessageBubbleProps) {
  const isUser = role === "user"
  const [open, setOpen] = useState(false)

  if (isUser) {
    return (
      <div className="flex justify-end" style={{ animation: "bubbleIn 0.35s ease-out both" }}>
        <div className="flex items-start gap-2.5 max-w-[80%]">
          <div className="rounded-2xl rounded-br-sm bg-primary text-white px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
          <UserAvatar ilgan={ilgan} displayName={displayName} />
        </div>
      </div>
    )
  }

  const dayStem = basis?.ilgan?.[0]
  const hasPerResponseData = basis?.reasoning || basis?.referenced_pillars?.length || basis?.key_elements?.length
  const hasBasisData = hasPerResponseData || basis?.coaching || basis?.ilganChunk
  // 도구가 실제로 생성한 근거가 있을 때만 버튼 표시
  const showBasisButton = !!hasBasisData

  return (
    <div className="flex justify-start" style={{ animation: "bubbleIn 0.35s ease-out both" }}>
      <div className="max-w-[80%]">
        <div className="flex items-start gap-2.5">
          <AiAvatar characterId={characterId} speaking={isStreaming && !isAnalyzing} />
          <div className={`rounded-2xl rounded-bl-sm border border-border border-l-2 bg-card px-4 py-2.5 shadow-sm ${(CHARACTERS[characterId || "seonbi"] || CHARACTERS.seonbi).colorClass.borderLeft}`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {renderInlineMarkdown(content)}
            </p>
          </div>
        </div>

        {/* 복채 구입 버튼 */}
        {isBokchaeMessage && (
          <div className="ml-10 mt-1.5">
            <button
              onClick={onBokchaeOpen}
              className="group text-xs font-medium transition-all inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 hover:from-amber-600 hover:to-orange-600 dark:hover:from-amber-500 dark:hover:to-orange-500 px-3.5 py-2.5 text-white border border-amber-400/60 dark:border-amber-500/40 shadow-md hover:shadow-lg active:scale-[0.97]"
            >
              <span className="flex items-center justify-center h-5 w-5 rounded-lg bg-white/20 border border-white/30 transition-transform group-hover:scale-110">
                <span className="text-sm leading-none">💰</span>
              </span>
              <span className="font-semibold">복채 충전하기</span>
              <svg className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}

        {/* 상세 분석 / 분석 중 */}
        {!isBokchaeMessage && (showBasisButton || isAnalyzing) && (
          <div className="ml-10 mt-1.5">
            {isAnalyzing && !hasBasisData ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-900/20 px-3 py-2 shadow-sm" style={{ animation: "fadeInUp 0.3s ease-out both" }}>
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/40" />
                  <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700">
                    <span className="h-2.5 w-2.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </span>
                </span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">사주 근거 분석 중...</span>
              </div>
            ) : basis ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="group text-xs font-medium transition-all inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/40 dark:hover:to-orange-900/40 px-3.5 py-2 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm hover:shadow-md active:scale-[0.98]">
                  <span className="flex items-center justify-center h-5 w-5 rounded-lg bg-amber-100 dark:bg-amber-900/60 border border-amber-200/80 dark:border-amber-700/60 transition-transform group-hover:scale-110">
                    <svg className="h-3 w-3 text-amber-600 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  </span>
                  <span className="font-semibold">상세 분석 보기</span>
                  <svg className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto !w-[92%] sm:!w-[520px] lg:!w-[560px] p-0">
                {/* 헤더 */}
                <SheetHeader className="px-6 pt-6 pb-5 border-b border-border bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20">
                  <SheetTitle className="flex items-center gap-2.5 text-lg">
                    <span className="text-xl">📊</span> 상세 분석
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    이 응답의 명리학적 분석 근거와 코칭 내용
                  </SheetDescription>
                  {basis.topic && (() => {
                    const meta = TOPIC_META[basis.topic] || DEFAULT_TOPIC
                    return (
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold w-fit mt-1">
                        {meta.emoji} {meta.label}
                      </span>
                    )
                  })()}
                </SheetHeader>

                <div className="p-4 space-y-3">
                  {/* ── 원본 응답 ── */}
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-sm font-bold text-muted-foreground mb-1.5"><span className="text-lg align-middle mr-0.5">💬</span> {(CHARACTERS[characterId || "seonbi"] || CHARACTERS.seonbi).name} 응답</p>
                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{content}</p>
                  </div>

                  {/* ── 1. 핵심 코칭 ── */}
                  {basis.coaching && (
                    <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/80 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-800/10 p-4">
                      <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2 text-amber-800 dark:text-amber-200">
                        <span className="text-lg align-middle">🧭</span> 핵심 코칭
                      </h3>
                      <p className="text-sm leading-relaxed font-medium text-amber-900 dark:text-amber-100">{basis.coaching}</p>
                    </div>
                  )}

                  {/* ── 2. 해석 근거 ── */}
                  {basis.reasoning && (
                    <div className="rounded-2xl border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                      <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2 text-blue-800 dark:text-blue-200">
                        <span className="text-lg align-middle">💡</span> 해석 근거
                      </h3>
                      <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">{basis.reasoning}</p>
                    </div>
                  )}

                  {/* ── 3. 참조한 명리 지식 (RAG) ── */}
                  {basis.ilganChunk && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-muted-foreground/60 px-1">참조한 명리 지식</h3>
                      {basis.ilganChunk.split("\n\n---\n\n").map((chunk, i) => (
                        <KnowledgeChunkCard key={i} chunk={chunk} />
                      ))}
                    </div>
                  )}

                  {/* ── 4. 참조한 기둥 ── */}
                  {basis.referenced_pillars && basis.referenced_pillars.length > 0 && (
                    <div className="rounded-2xl border border-purple-200/50 dark:border-purple-800/30 bg-purple-50/30 dark:bg-purple-950/20 p-4">
                      <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2 text-purple-800 dark:text-purple-200">
                        <span className="text-lg align-middle">🏛️</span> 참조한 기둥
                      </h3>
                      <div className="space-y-2">
                        {basis.referenced_pillars.map(pName => {
                          const info = getReferencedPillarInfo(pName, basis, dayStem)
                          const pillarEmoji = PILLAR_EMOJI[pName] || "📍"
                          if (!info) {
                            return (
                              <div key={pName} className="flex items-center gap-2 rounded-xl bg-white/50 dark:bg-white/5 border border-border/50 px-4 py-3">
                                <span className="text-lg">{pillarEmoji}</span>
                                <span className="text-base font-semibold">{pName}</span>
                              </div>
                            )
                          }
                          return (
                            <div key={pName} className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-white/5 border border-border/50 px-4 py-3">
                              <span className="text-lg shrink-0">{pillarEmoji}</span>
                              <span className="text-sm font-semibold shrink-0">{pName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xl font-bold ${ELEMENT_COLORS[info.stem.element]}`}>{info.stem.hanja}</span>
                                <span className={`text-xl font-bold ${ELEMENT_COLORS[info.branch.element]}`}>{info.branch.hanja}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{info.hangul}</span>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <span className={`text-sm px-2 py-1 rounded-full ${ELEMENT_BG[info.stem.element]} ${ELEMENT_COLORS[info.stem.element]}`}>
                                  {ELEMENT_EMOJI[info.stem.element]} {info.stem.element}
                                </span>
                                <span className={`text-sm px-2 py-1 rounded-full ${ELEMENT_BG[info.branch.element]} ${ELEMENT_COLORS[info.branch.element]}`}>
                                  {ELEMENT_EMOJI[info.branch.element]} {info.branch.element}
                                </span>
                                {info.tenGod && (
                                  <span className="text-sm px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                    {getTenGodEmoji(info.tenGod)} {info.tenGod}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── 5. 주목한 오행 ── */}
                  {basis.key_elements && basis.key_elements.length > 0 && (
                    <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
                      <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2 text-emerald-800 dark:text-emerald-200">
                        <span className="text-lg align-middle">✨</span> 주목한 오행
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {basis.key_elements.map(el => {
                          const elKey = el as Element
                          const elInfo = ELEMENTS[elKey]
                          return (
                            <div key={el} className={`rounded-xl border p-3 space-y-1 ${ELEMENT_BG[elKey] || "bg-muted"}`}>
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{ELEMENT_EMOJI[elKey] || "✨"}</span>
                                <span className={`text-sm font-bold ${ELEMENT_COLORS[elKey] || "text-foreground"}`}>
                                  {elInfo?.name || el}
                                </span>
                              </div>
                              {elInfo && (
                                <p className="text-sm text-muted-foreground pl-6">{elInfo.nature}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 빈 상태 */}
                  {!hasPerResponseData && !basis.ilganChunk && !basis.coaching && (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-2">
                      <p className="text-2xl">📭</p>
                      <p className="text-sm font-medium text-muted-foreground">아직 구체적 근거가 없어요</p>
                      <p className="text-xs text-muted-foreground/60">사주 해석이 포함된 응답부터 근거가 자동 생성됩니다</p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
})
