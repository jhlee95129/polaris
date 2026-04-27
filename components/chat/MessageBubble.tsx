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
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

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
  displayName?: string
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

/* AI 아바타 — ⭐ + "폴라리스" 라벨 */
function AiAvatar() {
  return (
    <div className="shrink-0 flex flex-col items-center gap-0.5">
      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30 shadow-sm">
        <span className="text-base leading-none">⭐</span>
      </div>
      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">폴라리스</span>
    </div>
  )
}

export default memo(function MessageBubble({ role, content, basis, ilgan, isStreaming, displayName }: MessageBubbleProps) {
  const isUser = role === "user"
  const [open, setOpen] = useState(false)

  if (isUser) {
    return (
      <div className="flex justify-end" style={{ animation: "bubbleIn 0.35s ease-out both" }}>
        <div className="flex items-start gap-2.5 max-w-[80%]">
          <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5">
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
          <AiAvatar />
          <div className="rounded-2xl rounded-bl-sm border border-border border-l-2 border-l-amber-300/50 dark:border-l-amber-600/30 bg-card px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        </div>

        {(showBasisButton || isStreaming) && (
          <div className="ml-10 mt-1.5">
            {isStreaming && !hasBasisData ? (
              <span className="text-xs text-muted-foreground/60 inline-flex items-center gap-1.5">
                <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
                근거 분석 중...
              </span>
            ) : basis ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="text-xs text-primary hover:text-primary/90 font-medium transition-colors inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/15 px-3.5 py-1.5 border border-primary/20">
                  <span>📖</span>
                  <span>사주적 근거 보기</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto !w-[92%] sm:!w-[520px] lg:!w-[560px] p-0">
                {/* 헤더 */}
                <SheetHeader className="px-6 pt-6 pb-5 border-b border-border bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20">
                  <SheetTitle className="flex items-center gap-2.5 text-lg">
                    <span className="text-xl">📊</span> 코칭 리포트
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
                    <p className="text-xs font-bold text-muted-foreground mb-1.5"><span className="text-lg align-middle mr-0.5">💬</span> 폴라리스 응답</p>
                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{content}</p>
                  </div>

                  {/* ── 1. 핵심 코칭 ── */}
                  {basis.coaching && (
                    <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/80 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-800/10 p-4">
                      <h3 className="text-xs font-bold flex items-center gap-1.5 mb-2 text-amber-800 dark:text-amber-200">
                        <span className="text-lg align-middle">🧭</span> 핵심 코칭
                      </h3>
                      <p className="text-sm leading-relaxed font-medium text-amber-900 dark:text-amber-100">{basis.coaching}</p>
                    </div>
                  )}

                  {/* ── 2. 해석 근거 ── */}
                  {basis.reasoning && (
                    <div className="rounded-2xl border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                      <h3 className="text-xs font-bold flex items-center gap-1.5 mb-2 text-blue-800 dark:text-blue-200">
                        <span className="text-lg align-middle">💡</span> 해석 근거
                      </h3>
                      <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">{basis.reasoning}</p>
                    </div>
                  )}

                  {/* ── 3. 참조한 기둥 ── */}
                  {basis.referenced_pillars && basis.referenced_pillars.length > 0 && (
                    <div className="rounded-2xl border border-purple-200/50 dark:border-purple-800/30 bg-purple-50/30 dark:bg-purple-950/20 p-4">
                      <h3 className="text-xs font-bold flex items-center gap-1.5 mb-2 text-purple-800 dark:text-purple-200">
                        <span className="text-lg align-middle">🏛️</span> 참조한 기둥
                      </h3>
                      <div className="space-y-2">
                        {basis.referenced_pillars.map(pName => {
                          const info = getReferencedPillarInfo(pName, basis, dayStem)
                          const pillarEmoji = PILLAR_EMOJI[pName] || "📍"
                          if (!info) {
                            return (
                              <div key={pName} className="flex items-center gap-2">
                                <span className="text-sm">{pillarEmoji}</span>
                                <span className="text-sm font-medium">{pName}</span>
                              </div>
                            )
                          }
                          return (
                            <div key={pName} className="rounded-xl bg-white/50 dark:bg-white/5 border border-border/50 p-3.5 flex items-center gap-3.5">
                              <span className="text-lg shrink-0">{pillarEmoji}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-2xl font-bold ${ELEMENT_COLORS[info.stem.element]}`}>
                                  {info.stem.hanja}
                                </span>
                                <span className={`text-2xl font-bold ${ELEMENT_COLORS[info.branch.element]}`}>
                                  {info.branch.hanja}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-semibold">{pName}</span>
                                  <span className="text-xs text-muted-foreground">{info.hangul}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${ELEMENT_BG[info.stem.element]} ${ELEMENT_COLORS[info.stem.element]}`}>
                                    {ELEMENT_EMOJI[info.stem.element]} {info.stem.element}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${ELEMENT_BG[info.branch.element]} ${ELEMENT_COLORS[info.branch.element]}`}>
                                    {ELEMENT_EMOJI[info.branch.element]} {info.branch.element}
                                  </span>
                                  {info.tenGod && (
                                    <span className="text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 bg-muted text-muted-foreground">
                                      ⭐ {info.tenGod}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── 4. 주목한 오행 ── */}
                  {basis.key_elements && basis.key_elements.length > 0 && (
                    <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
                      <h3 className="text-xs font-bold flex items-center gap-1.5 mb-2 text-emerald-800 dark:text-emerald-200">
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
                                <span className={`text-xs font-bold ${ELEMENT_COLORS[elKey] || "text-foreground"}`}>
                                  {elInfo?.name || el}
                                </span>
                              </div>
                              {elInfo && (
                                <p className="text-[11px] text-muted-foreground pl-6">{elInfo.nature}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── 5. 참조한 명리 지식 (RAG) ── */}
                  {basis.ilganChunk && (
                    <div className="rounded-2xl border border-orange-200/50 dark:border-orange-800/30 bg-orange-50/30 dark:bg-orange-950/20 p-4">
                      <h3 className="text-xs font-bold flex items-center gap-1.5 mb-2 text-orange-800 dark:text-orange-200">
                        <span className="text-lg align-middle">📖</span> 참조한 명리 지식
                      </h3>
                      <div className="space-y-2">
                        {basis.ilganChunk.split("\n\n---\n\n").map((chunk, i) => {
                          const titleMatch = chunk.match(/^## (.+)\n/)
                          const title = titleMatch ? titleMatch[1] : null
                          const body = title ? chunk.replace(/^## .+\n/, "") : chunk
                          return (
                            <div key={i} className={i > 0 ? "border-t border-border/50 pt-2" : ""}>
                              {title && (
                                <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                                  📄 {title}
                                </p>
                              )}
                              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {body}
                              </p>
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
