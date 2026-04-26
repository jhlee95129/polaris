"use client"

import { useState } from "react"
import type { BasisData } from "./MessageList"
import {
  STEM_MAP,
  BRANCH_MAP,
  ELEMENTS,
  calculateTenGod,
  pillarToHanja,
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

const ELEMENT_COLORS: Record<Element, string> = {
  목: "text-green-600 dark:text-green-400",
  화: "text-red-500 dark:text-red-400",
  토: "text-amber-600 dark:text-amber-400",
  금: "text-slate-500 dark:text-slate-300",
  수: "text-blue-500 dark:text-blue-400",
}

const ELEMENT_BG: Record<Element, string> = {
  목: "bg-green-500/10",
  화: "bg-red-500/10",
  토: "bg-amber-500/10",
  금: "bg-slate-500/10",
  수: "bg-blue-500/10",
}

const ELEMENT_EMOJI: Record<Element, string> = {
  목: "🌳",
  화: "🔥",
  토: "⛰️",
  금: "⚔️",
  수: "💧",
}

const TOPIC_META: Record<string, { label: string; emoji: string }> = {
  career: { label: "직업·진로", emoji: "💼" },
  relationship: { label: "인간관계", emoji: "💕" },
  health: { label: "건강", emoji: "🏥" },
  mindset: { label: "마음가짐", emoji: "🧘" },
  general: { label: "전반", emoji: "🔮" },
}

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  basis?: BasisData
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

const PILLAR_EMOJI: Record<string, string> = {
  년주: "🏔️",
  월주: "🌙",
  일주: "☀️",
  시주: "🕐",
  대운: "🌊",
}

export default function MessageBubble({ role, content, basis }: MessageBubbleProps) {
  const isUser = role === "user"
  const [open, setOpen] = useState(false)

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="rounded-2xl rounded-br-sm bg-primary/10 px-4 py-2.5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
          <span className="text-lg shrink-0 mb-0.5">🙋</span>
        </div>
      </div>
    )
  }

  const dayStem = basis?.ilgan?.[0]
  const hasPerResponseData = basis?.reasoning || basis?.referenced_pillars?.length || basis?.key_elements?.length

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex items-end gap-2">
          <span className="text-lg shrink-0 mb-0.5">⭐</span>
          <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        </div>

        {basis && (
          <div className="ml-8 mt-1">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  📖 사주 근거 보기
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <span>🔍</span> 이 응답의 사주 근거
                  </SheetTitle>
                  <SheetDescription>
                    폴라리스가 이 응답을 만든 명리학적 맥락입니다
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 px-4 pb-6">
                  {/* 빈 상태 */}
                  {!hasPerResponseData && !basis.ilganChunk && (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-2">
                      <span className="text-3xl">📭</span>
                      <p className="text-sm text-muted-foreground">아직 구체적 근거가 없어요</p>
                      <p className="text-xs text-muted-foreground/60">새 대화부터 응답별 근거가 자동으로 생성됩니다</p>
                    </div>
                  )}

                  {/* 토픽 배지 */}
                  {basis.topic && (() => {
                    const meta = TOPIC_META[basis.topic]
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium inline-flex items-center gap-1.5">
                          <span>{meta?.emoji || "🔮"}</span>
                          {meta?.label || basis.topic}
                        </span>
                      </div>
                    )
                  })()}

                  {/* 해석 근거 — 메인 카드 */}
                  {basis.reasoning && (
                    <section className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">💡</span>
                        <h3 className="text-sm font-semibold">해석 근거</h3>
                      </div>
                      <p className="text-sm leading-relaxed pl-7">{basis.reasoning}</p>
                    </section>
                  )}

                  {/* 참조한 기둥 */}
                  {basis.referenced_pillars && basis.referenced_pillars.length > 0 && (
                    <section className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏛️</span>
                        <h3 className="text-sm font-semibold">참조한 기둥</h3>
                      </div>
                      <div className="space-y-1.5">
                        {basis.referenced_pillars.map(pName => {
                          const info = getReferencedPillarInfo(pName, basis, dayStem)
                          const emoji = PILLAR_EMOJI[pName] || "📍"
                          if (!info) {
                            return (
                              <div key={pName} className="rounded-lg border border-border bg-card p-3 flex items-center gap-2.5">
                                <span className="text-sm">{emoji}</span>
                                <span className="text-xs font-medium">{pName}</span>
                              </div>
                            )
                          }
                          return (
                            <div key={pName} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                              <span className="text-sm shrink-0">{emoji}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-lg font-bold ${ELEMENT_COLORS[info.stem.element]}`}>
                                  {info.stem.hanja}
                                </span>
                                <span className={`text-lg font-bold ${ELEMENT_COLORS[info.branch.element]}`}>
                                  {info.branch.hanja}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-medium">{pName}</span>
                                  <span className="text-[11px] text-muted-foreground">{info.hangul}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ELEMENT_BG[info.stem.element]} ${ELEMENT_COLORS[info.stem.element]}`}>
                                    {ELEMENT_EMOJI[info.stem.element]} {info.stem.element}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ELEMENT_BG[info.branch.element]} ${ELEMENT_COLORS[info.branch.element]}`}>
                                    {ELEMENT_EMOJI[info.branch.element]} {info.branch.element}
                                  </span>
                                  {info.tenGod && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                      ⭐ {info.tenGod}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* 주목한 오행 */}
                  {basis.key_elements && basis.key_elements.length > 0 && (
                    <section className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">✨</span>
                        <h3 className="text-sm font-semibold">주목한 오행</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {basis.key_elements.map(el => {
                          const elKey = el as Element
                          const elInfo = ELEMENTS[elKey]
                          const emoji = ELEMENT_EMOJI[elKey] || "🔮"
                          return (
                            <div key={el} className={`rounded-xl border p-3 space-y-1 ${ELEMENT_BG[elKey] || "bg-muted"}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{emoji}</span>
                                <span className={`text-sm font-bold ${ELEMENT_COLORS[elKey] || "text-foreground"}`}>
                                  {elInfo?.name || el}
                                </span>
                              </div>
                              {elInfo && (
                                <p className="text-[11px] text-muted-foreground pl-8">{elInfo.nature}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* RAG 검색 결과 */}
                  {basis.ilganChunk && (
                    <section className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📚</span>
                        <h3 className="text-sm font-semibold">참조한 명리 지식</h3>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                        {basis.ilganChunk.split("\n\n---\n\n").map((chunk, i) => {
                          const titleMatch = chunk.match(/^## (.+)\n/)
                          const title = titleMatch ? titleMatch[1] : null
                          const body = title ? chunk.replace(/^## .+\n/, "") : chunk
                          return (
                            <div key={i} className={i > 0 ? "border-t border-border pt-3" : ""}>
                              {title && (
                                <p className="text-xs font-medium mb-1 flex items-center gap-1.5">
                                  <span className="text-[10px]">📄</span> {title}
                                </p>
                              )}
                              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {body.length > 300 ? body.slice(0, 300) + "..." : body}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                        <span>🔗</span> RAG — pgvector 벡터 검색으로 조회된 명리 지식
                      </p>
                    </section>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </div>
  )
}
