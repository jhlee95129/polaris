/* ── 어드민 대시보드 가상 데이터 ── */

/** 요약 카드 */
export const SUMMARY_STATS = [
  { label: "총 사용자", value: "1,247", change: "+12.3%", up: true },
  { label: "오늘 활성 사용자", value: "183", change: "+8.1%", up: true },
  { label: "총 상담 세션", value: "4,892", change: "+15.7%", up: true },
  { label: "총 메시지", value: "28,413", change: "+18.2%", up: true },
]

/** DAU / MAU 트렌드 (14일) */
export const DAU_MAU_TREND = [
  { date: "4/15", dau: 121, mau: 847 },
  { date: "4/16", dau: 134, mau: 862 },
  { date: "4/17", dau: 128, mau: 879 },
  { date: "4/18", dau: 145, mau: 901 },
  { date: "4/19", dau: 162, mau: 934 },
  { date: "4/20", dau: 158, mau: 958 },
  { date: "4/21", dau: 149, mau: 982 },
  { date: "4/22", dau: 155, mau: 1012 },
  { date: "4/23", dau: 168, mau: 1058 },
  { date: "4/24", dau: 161, mau: 1094 },
  { date: "4/25", dau: 175, mau: 1132 },
  { date: "4/26", dau: 182, mau: 1168 },
  { date: "4/27", dau: 171, mau: 1203 },
  { date: "4/28", dau: 183, mau: 1247 },
]

/** 1차 지표: 세션당 대화 턴 수 (7일) — 목표 > 4턴 */
export const DAILY_TURNS = [
  { date: "4/22", value: 3.2 },
  { date: "4/23", value: 4.1 },
  { date: "4/24", value: 3.8 },
  { date: "4/25", value: 4.5 },
  { date: "4/26", value: 5.1 },
  { date: "4/27", value: 4.7 },
  { date: "4/28", value: 4.9 },
]

/** 1차 지표: 첫 응답 이탈율 (7일) — 목표 < 40% */
export const DAILY_BOUNCE = [
  { date: "4/22", value: 45 },
  { date: "4/23", value: 42 },
  { date: "4/24", value: 39 },
  { date: "4/25", value: 37 },
  { date: "4/26", value: 35 },
  { date: "4/27", value: 33 },
  { date: "4/28", value: 31 },
]

/** 2차 지표: 리텐션 코호트 (D1~D30) */
export const RETENTION_COHORT = [
  { day: "D1", value: 62 },
  { day: "D3", value: 45 },
  { day: "D7", value: 28 },
  { day: "D14", value: 19 },
  { day: "D30", value: 12 },
]

/** 핵심 이벤트 전환율 — 가입 사용자 대비 */
export const KEY_EVENT_RATES = [
  { event: "첫 상담 시작", value: 78, count: 973 },
  { event: "사주 분석 조회", value: 65, count: 811 },
  { event: "복채 상점 방문", value: 42, count: 524 },
  { event: "캐릭터 변경", value: 31, count: 387 },
  { event: "대화 공유", value: 18, count: 225 },
]

/** 2차 지표: 복채 전환율 */
export const BOKCHAE_CONVERSION = [
  { name: "무료 사용", value: 72 },
  { name: "구매 전환", value: 28 },
]

/** 2차 지표: 공유율 (주간 트렌드) */
export const WEEKLY_SHARE = [
  { week: "W1", value: 3.2 },
  { week: "W2", value: 4.8 },
  { week: "W3", value: 6.1 },
  { week: "W4", value: 7.5 },
]

/** 캐릭터별 사용 분포 */
export const CHARACTER_DISTRIBUTION = [
  { name: "선비", value: 32, color: "#f59e0b" },
  { name: "무당", value: 24, color: "#a855f7" },
  { name: "장군", value: 18, color: "#ef4444" },
  { name: "선녀", value: 16, color: "#0ea5e9" },
  { name: "도깨비", value: 10, color: "#10b981" },
]

/** 시간대별 활성 사용자 */
export const HOURLY_ACTIVE = [
  { hour: "0시", value: 12 },
  { hour: "1시", value: 8 },
  { hour: "2시", value: 5 },
  { hour: "3시", value: 3 },
  { hour: "4시", value: 2 },
  { hour: "5시", value: 4 },
  { hour: "6시", value: 8 },
  { hour: "7시", value: 15 },
  { hour: "8시", value: 28 },
  { hour: "9시", value: 35 },
  { hour: "10시", value: 42 },
  { hour: "11시", value: 48 },
  { hour: "12시", value: 55 },
  { hour: "13시", value: 45 },
  { hour: "14시", value: 38 },
  { hour: "15시", value: 35 },
  { hour: "16시", value: 32 },
  { hour: "17시", value: 30 },
  { hour: "18시", value: 38 },
  { hour: "19시", value: 52 },
  { hour: "20시", value: 65 },
  { hour: "21시", value: 72 },
  { hour: "22시", value: 58 },
  { hour: "23시", value: 32 },
]
