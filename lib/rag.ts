/**
 * RAG 파이프라인
 * 사주 명리학 지식 검색 — 주제별 + 일간별 2-track 검색
 *
 * 흐름: (1) 메시지 기반 주제 검색 + (2) 일간 맥락 검색 → 병합·중복 제거 → 반환
 */

import OpenAI from "openai"

const EMBEDDING_MODEL = "text-embedding-3-large"

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  return openaiClient
}

// ─── 임베딩 생성 ───

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI()
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: 2000,
  })
  return response.data[0].embedding
}

// ─── 사주 지식 검색 (2-track: 주제 + 일간) ───

type MatchRow = { id: string; content: string; similarity: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function vectorSearch(
  supabase: any,
  query: string,
  count: number,
  threshold = 0.3,
): Promise<MatchRow[]> {
  const embedding = await generateEmbedding(query)
  const { data, error } = await supabase.rpc("match_saju_knowledge", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: count,
  })
  if (error || !data) return []
  return data as MatchRow[]
}

/**
 * 2-track 검색으로 주제 다양성 보장
 * Track 1: 메시지 주제 중심 (일간 없이) → 대운/합충/격국 등 주제별 지식 매칭
 * Track 2: 일간 + 메시지 → 일간 맞춤 해석
 * 결과를 병합·중복 제거하여 반환 (최대 3개)
 */
export async function searchSajuKnowledge(ilgan: string, userMessage?: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return ""
  }

  try {
    const { getServerSupabase } = await import("./supabase/server")
    const supabase = getServerSupabase()

    if (!userMessage) {
      // 메시지 없으면 일간 특성만 검색
      const results = await vectorSearch(supabase, `${ilgan} 일간 특성 성격`, 2)
      return results.map(d => d.content).join("\n\n---\n\n")
    }

    // Track 1: 주제 중심 (일간 바이어스 제거) — 대운, 합충, 격국, 코칭 등 주제별 지식
    // Track 2: 일간 맞춤 — 사용자 일간에 특화된 해석
    const [topicResults, ilganResults] = await Promise.all([
      vectorSearch(supabase, `사주 명리 ${userMessage}`, 3, 0.3),
      vectorSearch(supabase, `${ilgan} ${userMessage}`, 2, 0.3),
    ])

    // 병합 + 중복 제거 (content 기준)
    const seen = new Set<string>()
    const merged: MatchRow[] = []

    // 주제 결과 우선, 그 다음 일간 결과
    for (const row of [...topicResults, ...ilganResults]) {
      if (!seen.has(row.content) && merged.length < 3) {
        seen.add(row.content)
        merged.push(row)
      }
    }

    if (merged.length === 0) return ""
    return merged.map(d => d.content).join("\n\n---\n\n")
  } catch (error) {
    console.error("RAG 검색 실패:", error)
    return ""
  }
}

/** @deprecated searchSajuKnowledge 사용 권장 */
export async function searchIlganCharacteristics(ilgan: string): Promise<string> {
  return searchSajuKnowledge(ilgan)
}

// ─── 청킹 유틸 (임베딩 스크립트용) ───

export interface Chunk {
  sourceFile: string
  content: string
  metadata: Record<string, string>
}

/**
 * 마크다운을 ## 헤더 기준으로 chunk 분할
 * [출처] 라인을 파싱하여 metadata.source로 분리
 */
export function chunkByHeaders(
  text: string,
  sourceFile: string
): Chunk[] {
  const sections = text.split(/^## /m).filter(Boolean)
  const chunks: Chunk[] = []

  for (const section of sections) {
    const lines = section.split("\n")
    const title = lines[0]?.trim() || ""
    let body = lines.slice(1).join("\n").trim()

    if (!body) continue

    // [출처] 라인 파싱
    const metadata: Record<string, string> = {}
    const sourceMatch = body.match(/\[출처\]\s*(.+)$/m)
    if (sourceMatch) {
      metadata.source = sourceMatch[1].trim()
      body = body.replace(/\[출처\]\s*.+$/m, "").trim()
    }

    // 일간 이름 추출 (제목에서)
    const ilganMatch = title.match(/^(.+?)\s*[—\-\(]/)
    if (ilganMatch) {
      metadata.ilgan = ilganMatch[1].trim()
    } else {
      metadata.ilgan = title
    }

    chunks.push({
      sourceFile,
      content: `## ${title}\n${body}`,
      metadata,
    })
  }

  return chunks
}
