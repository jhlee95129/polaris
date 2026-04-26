"use client"

import { useState } from "react"
import type { BasisData } from "./MessageList"
import {
  STEM_MAP,
  BRANCH_MAP,
  ELEMENTS,
  ELEMENT_COLORS,
  ELEMENT_BG,
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
import {
  Star,
  BookOpen,
  Search,
  Inbox,
  Columns3,
  Sparkles,
  FileText,
  Link2,
  Compass,
  MapPin,
  TreePine,
  Flame,
  Mountain,
  Gem,
  Droplets,
  Moon,
  Sun,
  Clock,
  Waves,
  Briefcase,
  Heart,
  HeartPulse,
  Brain,
  type LucideIcon,
} from "lucide-react"

const ELEMENT_ICON: Record<Element, LucideIcon> = {
  목: TreePine,
  화: Flame,
  토: Mountain,
  금: Gem,
  수: Droplets,
}

const TOPIC_META: Record<string, { label: string; Icon: LucideIcon }> = {
  career: { label: "직업·진로", Icon: Briefcase },
  relationship: { label: "인간관계", Icon: Heart },
  health: { label: "건강", Icon: HeartPulse },
  mindset: { label: "마음가짐", Icon: Brain },
  general: { label: "전반", Icon: Sparkles },
}

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  basis?: BasisData
  ilgan?: string
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

const PILLAR_ICON: Record<string, LucideIcon> = {
  년주: Mountain,
  월주: Moon,
  일주: Sun,
  시주: Clock,
  대운: Waves,
}

function UserAvatar({ ilgan }: { ilgan?: string }) {
  const element = ilgan ? getIlganElement(ilgan) : null
  if (element) {
    const Icon = ELEMENT_ICON[element]
    return (
      <span className={`shrink-0 mb-0.5 ${ELEMENT_COLORS[element]}`}>
        <Icon className="h-5 w-5" />
      </span>
    )
  }
  return (
    <span className="shrink-0 mb-0.5 text-muted-foreground">
      <Star className="h-5 w-5" />
    </span>
  )
}

export default function MessageBubble({ role, content, basis, ilgan }: MessageBubbleProps) {
  const isUser = role === "user"
  const [open, setOpen] = useState(false)

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="rounded-2xl rounded-br-sm bg-primary/10 px-4 py-2.5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
          <UserAvatar ilgan={ilgan} />
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
          <span className="shrink-0 mb-0.5 text-primary">
            <Star className="h-5 w-5" />
          </span>
          <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        </div>

        {basis && (
          <div className="ml-8 mt-1">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  사주적 근거 보기
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Search className="h-4 w-4" /> 사주적 근거
                  </SheetTitle>
                  <SheetDescription>
                    이 응답에 사용된 사주적 근거입니다
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  {/* 빈 상태 */}
                  {!hasPerResponseData && !basis.ilganChunk && (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-2">
                      <Inbox className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">아직 구체적 근거가 없어요</p>
                      <p className="text-xs text-muted-foreground/60">새 대화부터 응답별 근거가 자동으로 생성됩니다</p>
                    </div>
                  )}

                  {/* 토픽 배지 */}
                  {basis.topic && (() => {
                    const meta = TOPIC_META[basis.topic]
                    const TopicIcon = meta?.Icon || Sparkles
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium inline-flex items-center gap-1.5">
                          <TopicIcon className="h-3.5 w-3.5" />
                          {meta?.label || basis.topic}
                        </span>
                      </div>
                    )
                  })()}

                  {/* ── 파트 1: 사주적 근거 ── */}
                  {(basis.reasoning || (basis.referenced_pillars && basis.referenced_pillars.length > 0) || (basis.key_elements && basis.key_elements.length > 0) || basis.ilganChunk) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Search className="h-4 w-4" />
                        <h3 className="text-sm font-bold">사주적 근거</h3>
                      </div>

                      {/* 해석 근거 */}
                      {basis.reasoning && (
                        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-4">
                          <p className="text-sm leading-relaxed">{basis.reasoning}</p>
                        </div>
                      )}

                      {/* 참조한 기둥 */}
                      {basis.referenced_pillars && basis.referenced_pillars.length > 0 && (
                        <section className="space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Columns3 className="h-3.5 w-3.5" /> 참조한 기둥
                          </h4>
                          <div className="space-y-1.5">
                            {basis.referenced_pillars.map(pName => {
                              const info = getReferencedPillarInfo(pName, basis, dayStem)
                              const PillarIcon = PILLAR_ICON[pName] || MapPin
                              if (!info) {
                                return (
                                  <div key={pName} className="rounded-lg border border-border bg-card p-3 flex items-center gap-2.5">
                                    <PillarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium">{pName}</span>
                                  </div>
                                )
                              }
                              return (
                                <div key={pName} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                                  <PillarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
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
                                      {(() => { const EIcon = ELEMENT_ICON[info.stem.element]; return (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${ELEMENT_BG[info.stem.element]} ${ELEMENT_COLORS[info.stem.element]}`}>
                                          <EIcon className="h-2.5 w-2.5" /> {info.stem.element}
                                        </span>
                                      )})()}
                                      {(() => { const EIcon = ELEMENT_ICON[info.branch.element]; return (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${ELEMENT_BG[info.branch.element]} ${ELEMENT_COLORS[info.branch.element]}`}>
                                          <EIcon className="h-2.5 w-2.5" /> {info.branch.element}
                                        </span>
                                      )})()}
                                      {info.tenGod && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 bg-muted text-muted-foreground">
                                          <Star className="h-2.5 w-2.5" /> {info.tenGod}
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
                        <section className="space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> 주목한 오행
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {basis.key_elements.map(el => {
                              const elKey = el as Element
                              const elInfo = ELEMENTS[elKey]
                              const ElIcon = ELEMENT_ICON[elKey] || Sparkles
                              return (
                                <div key={el} className={`rounded-xl border p-3 space-y-1 ${ELEMENT_BG[elKey] || "bg-muted"}`}>
                                  <div className="flex items-center gap-2">
                                    <ElIcon className={`h-5 w-5 ${ELEMENT_COLORS[elKey] || "text-foreground"}`} />
                                    <span className={`text-sm font-bold ${ELEMENT_COLORS[elKey] || "text-foreground"}`}>
                                      {elInfo?.name || el}
                                    </span>
                                  </div>
                                  {elInfo && (
                                    <p className="text-[11px] text-muted-foreground pl-7">{elInfo.nature}</p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </section>
                      )}

                      {/* RAG 검색 결과 */}
                      {basis.ilganChunk && (
                        <section className="space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" /> 참조한 명리 지식
                          </h4>
                          <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                            {basis.ilganChunk.split("\n\n---\n\n").map((chunk, i) => {
                              const titleMatch = chunk.match(/^## (.+)\n/)
                              const title = titleMatch ? titleMatch[1] : null
                              const body = title ? chunk.replace(/^## .+\n/, "") : chunk
                              return (
                                <div key={i} className={i > 0 ? "border-t border-border pt-3" : ""}>
                                  {title && (
                                    <p className="text-xs font-medium mb-1 flex items-center gap-1.5">
                                      <FileText className="h-3 w-3" /> {title}
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
                            <Link2 className="h-3 w-3" /> RAG — pgvector 벡터 검색으로 조회된 명리 지식
                          </p>
                        </section>
                      )}
                    </div>
                  )}

                  {/* ── 파트 2: 핵심 코칭 ── */}
                  {basis.coaching && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Compass className="h-4 w-4" />
                        <h3 className="text-sm font-bold">핵심 코칭</h3>
                      </div>
                      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/[0.03] p-4">
                        <p className="text-sm leading-relaxed font-medium">{basis.coaching}</p>
                      </div>
                    </div>
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
