"use client"

import { useState, useEffect } from "react"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"
import {
  SUMMARY_STATS, DAU_MAU_TREND, DAILY_TURNS, DAILY_BOUNCE,
  RETENTION_COHORT, KEY_EVENT_RATES, BOKCHAE_CONVERSION,
  WEEKLY_SHARE, CHARACTER_DISTRIBUTION, HOURLY_ACTIVE,
} from "@/lib/admin-mock-data"
import { TrendingUp, TrendingDown, Users, MessageCircle, Calendar, Zap, BarChart3, Repeat, Target } from "lucide-react"
import { useTheme } from "next-themes"

const SUMMARY_ICONS = [Users, Zap, MessageCircle, Calendar]

/* ── 차트 고정 팔레트 (라이트/다크 모두 가시) ── */
const P = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  red: "#ef4444",
  amber: "#f59e0b",
  slate: "#94a3b8",
}

/* ── 테마 연동: 축·그리드 등 크롬만 ── */
function useChrome() {
  const { resolvedTheme } = useTheme()
  const [chrome, setChrome] = useState({ muted: "#737373", border: "#e5e7eb" })

  useEffect(() => {
    const s = getComputedStyle(document.documentElement)
    setChrome({
      muted: s.getPropertyValue("--muted-foreground").trim() || "#737373",
      border: s.getPropertyValue("--border").trim() || "#e5e7eb",
    })
  }, [resolvedTheme])

  return chrome
}

/* ── 카드 래퍼 ── */
function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

/* ── 커스텀 툴팁 ── */
function CustomTooltip({ active, payload, label, suffix = "" }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold">
          {p.name && payload.length > 1 ? `${p.name}: ` : ""}{p.value}{suffix}
        </p>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const cr = useChrome()
  const tick = { fontSize: 11, fill: cr.muted }
  const tickSm = { fontSize: 9, fill: cr.muted }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">어드민 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">
          성공 지표 기반 · 가상 데이터로 시각화
        </p>
      </div>

      {/* ═══ 요약 카드 ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SUMMARY_STATS.map((stat, i) => {
          const Icon = SUMMARY_ICONS[i]
          return (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.up ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${stat.up ? "text-emerald-500" : "text-red-500"}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs 지난주</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ DAU / MAU ═══ */}
      <ChartCard title="DAU / MAU 트렌드" description="일별 활성 사용자(DAU) · 월간 활성 사용자(MAU) · 14일 추이">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DAU_MAU_TREND}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={P.indigo} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={P.indigo} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={P.violet} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={P.violet} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={cr.border} />
              <XAxis dataKey="date" tick={tick} stroke={cr.muted} />
              <YAxis yAxisId="dau" tick={tick} stroke={cr.muted} unit="명" />
              <YAxis yAxisId="mau" orientation="right" tick={tick} stroke={P.violet} unit="명" />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md space-y-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold">DAU: {payload[0]?.value}명</p>
                    <p className="text-sm font-semibold text-purple-500">MAU: {payload[1]?.value}명</p>
                  </div>
                )
              }} />
              <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value === "dau" ? "DAU" : "MAU"}</span>} />
              <Area yAxisId="dau" type="monotone" dataKey="dau" stroke={P.indigo} fill="url(#dauGrad)" strokeWidth={2} />
              <Area yAxisId="mau" type="monotone" dataKey="mau" stroke={P.violet} fill="url(#mauGrad)" strokeWidth={2} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* ═══ 인게이지먼트 ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-bold">인게이지먼트</h2>
            <p className="text-xs text-muted-foreground mt-0.5">세션 깊이와 첫 인상 효과</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* 세션당 대화 턴 수 */}
          <ChartCard title="세션당 대화 턴 수" description="목표 > 4턴 · '대화가 되었는가?'">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DAILY_TURNS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cr.border} />
                  <XAxis dataKey="date" tick={tick} stroke={cr.muted} />
                  <YAxis tick={tick} stroke={cr.muted} domain={[0, 7]} unit="턴" />
                  <Tooltip content={<CustomTooltip suffix="턴" />} />
                  <ReferenceLine y={4} stroke={P.amber} strokeDasharray="4 4" label={{ value: "목표 4턴", position: "insideTopRight", fontSize: 10, fill: P.amber }} />
                  <Bar dataKey="value" fill={P.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* 첫 응답 이탈율 */}
          <ChartCard title="첫 응답 이탈율" description="목표 < 40% · '첫 인상이 작동하는가?'">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DAILY_BOUNCE}>
                  <defs>
                    <linearGradient id="bounceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.red} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={P.red} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={cr.border} />
                  <XAxis dataKey="date" tick={tick} stroke={cr.muted} />
                  <YAxis tick={tick} stroke={cr.muted} domain={[0, 60]} unit="%" />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <ReferenceLine y={40} stroke={P.amber} strokeDasharray="4 4" label={{ value: "목표 40%", position: "insideTopRight", fontSize: 10, fill: P.amber }} />
                  <Area type="monotone" dataKey="value" stroke={P.red} fill="url(#bounceGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* ═══ 성장 ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-bold">성장</h2>
            <p className="text-xs text-muted-foreground mt-0.5">리텐션, 전환, 바이럴</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 리텐션 코호트 */}
          <ChartCard title="리텐션 코호트" description="가입 후 경과일별 잔존율">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={RETENTION_COHORT}>
                  <defs>
                    <linearGradient id="cohortGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.indigo} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={P.indigo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={cr.border} />
                  <XAxis dataKey="day" tick={tick} stroke={cr.muted} />
                  <YAxis tick={tick} stroke={cr.muted} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Area type="monotone" dataKey="value" stroke={P.indigo} fill="url(#cohortGrad)" strokeWidth={2} dot={{ r: 4, fill: P.indigo }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* 핵심 이벤트 전환율 */}
          <ChartCard title="핵심 이벤트 전환율" description="가입 사용자 대비 이벤트 수행 비율">
            <div className="space-y-2">
              {KEY_EVENT_RATES.map(item => (
                <div key={item.event} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.event}</span>
                    <span className="font-medium">{item.value}% <span className="text-muted-foreground">({item.count}명)</span></span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.value >= 50 ? "bg-primary" : item.value >= 30 ? "bg-amber-500" : "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* 복채 전환율 */}
          <ChartCard title="복채 전환율" description="무료 사용 vs 구매 전환">
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={BOKCHAE_CONVERSION}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill={P.slate} />
                    <Cell fill={P.indigo} />
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
                        <p className="text-xs text-muted-foreground">{String(d.name)}</p>
                        <p className="text-sm font-semibold">{d.value}%</p>
                      </div>
                    )
                  }} />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-xs text-muted-foreground">{String(value)}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* 공유율 */}
          <ChartCard title="공유율 (주간 트렌드)" description="대화 공유 링크 생성 비율">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={WEEKLY_SHARE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cr.border} />
                  <XAxis dataKey="week" tick={tick} stroke={cr.muted} />
                  <YAxis tick={tick} stroke={cr.muted} unit="%" domain={[0, 10]} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Line type="monotone" dataKey="value" stroke={P.indigo} strokeWidth={2} dot={{ r: 4, fill: P.indigo }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* ═══ 사용 패턴 ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-bold">사용 패턴</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 캐릭터별 사용 분포 */}
          <ChartCard title="캐릭터별 사용 분포" description="코칭 캐릭터 선택 비율">
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CHARACTER_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value, x, y, textAnchor }) => (
                      <text x={x} y={y} textAnchor={textAnchor} fill={cr.muted} fontSize={11}>{`${name ?? ""} ${value}%`}</text>
                    )}
                  >
                    {CHARACTER_DISTRIBUTION.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
                        <p className="text-xs text-muted-foreground">{String(d.name)}</p>
                        <p className="text-sm font-semibold">{d.value}%</p>
                      </div>
                    )
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* 시간대별 활성 사용자 */}
          <ChartCard title="시간대별 활성 사용자" description="24시간 사용 패턴">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_ACTIVE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cr.border} />
                  <XAxis dataKey="hour" tick={tickSm} stroke={cr.muted} interval={2} />
                  <YAxis tick={tick} stroke={cr.muted} unit="명" />
                  <Tooltip content={<CustomTooltip suffix="명" />} />
                  <Bar dataKey="value" fill={P.indigo} radius={[2, 2, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </section>
    </div>
  )
}
