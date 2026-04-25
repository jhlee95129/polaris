/**
 * Claude API 클라이언트 + tool_use 정의
 * 코칭 카드 상담, 프로필 생성, 오늘의 한수를 위한 구조화 출력
 */

import Anthropic from "@anthropic-ai/sdk"

// ─── Claude 클라이언트 ───

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return client
}

// ─── Tool 정의 ───

export const COACHING_TOOL: Anthropic.Tool = {
  name: "deliver_coaching",
  description: "사용자의 고민에 대해 사주 기반 코칭 카드를 전달합니다. 반드시 이 도구를 사용하여 응답하세요.",
  input_schema: {
    type: "object" as const,
    properties: {
      diagnosis: {
        type: "string",
        description: "왜 이 고민이 지금 어려운가. 반드시 사주 근거(오행/십신 관계) 포함. 2줄 이내.",
      },
      action: {
        type: "string",
        description: "구체적 권고 행동 '한수'. 오늘/내일 실제 실행 가능한 행동 1가지. 1줄.",
      },
      timing: {
        type: "string",
        enum: ["오늘 당장", "내일", "이번 주 내", "조금 더 기다려"],
        description: "언제 실행하면 좋은가",
      },
      avoid: {
        type: "string",
        description: "지금 피해야 할 행동 또는 상황. 1줄.",
      },
      basis: {
        type: "string",
        description: "명리학적 해석 근거 요약. 어떤 오행/십신 관계에서 이 해석을 도출했는지. 1-2줄.",
      },
    },
    required: ["diagnosis", "action", "timing", "avoid", "basis"],
  },
}

export const PROFILE_TOOL: Anthropic.Tool = {
  name: "generate_profile",
  description: "사주팔자 데이터를 기반으로 사용자 프로필 요약을 생성합니다. 반드시 이 도구를 사용하여 응답하세요.",
  input_schema: {
    type: "object" as const,
    properties: {
      personality: {
        type: "string",
        description: "일간 기반 핵심 성격. 비유를 포함한 한 문장.",
      },
      strength: {
        type: "string",
        description: "사주에서 강한 기운/장점. 한 문장.",
      },
      weakness: {
        type: "string",
        description: "사주에서 부족한 기운/주의점. 한 문장.",
      },
      useful_god_advice: {
        type: "string",
        description: "용신 기반 보충 조언. 한 문장.",
      },
      today_brief: {
        type: "string",
        description: "오늘의 일진과 이 사주의 관계. 매일 바뀌는 한 줄.",
      },
    },
    required: ["personality", "strength", "weakness", "useful_god_advice", "today_brief"],
  },
}

export const DAILY_ACTION_TOOL: Anthropic.Tool = {
  name: "deliver_daily_action",
  description: "오늘의 일진과 사용자 사주를 기반으로 오늘 실행할 구체적 행동을 추천합니다. 반드시 이 도구를 사용하여 응답하세요.",
  input_schema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        description: "오늘 실행할 구체적 행동 1개. 2-3문장으로 구체적이고 실행 가능하게.",
      },
      reason: {
        type: "string",
        description: "이 행동을 추천하는 사주 근거. 오행/십신 관계 포함. 1-2문장.",
      },
      element: {
        type: "string",
        enum: ["목", "화", "토", "금", "수"],
        description: "오늘의 핵심 오행 에너지",
      },
      timing: {
        type: "string",
        enum: ["아침", "점심", "저녁", "하루종일"],
        description: "행동 추천 시간대",
      },
      keyword: {
        type: "string",
        description: "오늘의 키워드. 2-3단어, 쉼표 구분.",
      },
    },
    required: ["action", "reason", "element", "timing", "keyword"],
  },
}

// ─── 응답 타입 ───

export interface CoachingCard {
  diagnosis: string
  action: string
  timing: "오늘 당장" | "내일" | "이번 주 내" | "조금 더 기다려"
  avoid: string
  basis: string
}

export interface ProfileSummary {
  personality: string
  strength: string
  weakness: string
  useful_god_advice: string
  today_brief: string
}

export interface DailyAction {
  action: string
  reason: string
  element: string
  timing: string
  keyword: string
}

// ─── API 호출 함수 ───

/**
 * 코칭 상담 API 호출
 * @returns CoachingCard 구조화 출력
 */
export async function getCoachingAdvice(
  systemPrompt: string,
  userQuestion: string
): Promise<CoachingCard> {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    tools: [COACHING_TOOL],
    tool_choice: { type: "tool", name: "deliver_coaching" },
    messages: [
      {
        role: "user",
        content: userQuestion,
      },
    ],
  })

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  )

  if (!toolUse || toolUse.name !== "deliver_coaching") {
    throw new Error("Claude가 코칭 카드를 생성하지 못했습니다")
  }

  return toolUse.input as CoachingCard
}

/**
 * 프로필 요약 생성 API 호출
 */
export async function getProfileSummary(
  systemPrompt: string
): Promise<ProfileSummary> {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    tools: [PROFILE_TOOL],
    tool_choice: { type: "tool", name: "generate_profile" },
    messages: [
      {
        role: "user",
        content: "내 사주 프로필을 분석해주세요.",
      },
    ],
  })

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  )

  if (!toolUse || toolUse.name !== "generate_profile") {
    throw new Error("Claude가 프로필을 생성하지 못했습니다")
  }

  return toolUse.input as ProfileSummary
}

/**
 * 오늘의 한수 생성 API 호출
 */
export async function getDailyAction(
  systemPrompt: string
): Promise<DailyAction> {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: systemPrompt,
    tools: [DAILY_ACTION_TOOL],
    tool_choice: { type: "tool", name: "deliver_daily_action" },
    messages: [
      {
        role: "user",
        content: "오늘 내가 할 수 있는 구체��인 행동 하나를 추천해주세요.",
      },
    ],
  })

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  )

  if (!toolUse || toolUse.name !== "deliver_daily_action") {
    throw new Error("Claude가 오늘의 한수를 생성하지 못했습니다")
  }

  return toolUse.input as DailyAction
}
