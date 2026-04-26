/**
 * RAG 파이프라인
 * ilgan-characteristics.md 전용 — 일간 해석 grounding
 *
 * 흐름: 일간 키워드 → OpenAI 임베딩 → Supabase pgvector 검색 → Top-1 반환
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

// ─── 사주 지식 검색 (컨텍스트 기반) ───

/**
 * 사용자 일간 + 대화 내용 기반으로 관련 사주 지식을 RAG에서 검색
 * @param ilgan 사용자 일간 (예: "병화")
 * @param userMessage 사용자의 현재 질문/메시지 (없으면 일간 특성만 검색)
 * @returns 관련 사주 지식 텍스트 배열 (최대 3개)
 */
export async function searchSajuKnowledge(ilgan: string, userMessage?: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return ""
  }

  try {
    // 쿼리: 사용자 메시지가 있으면 일간 + 메시지 결합, 없으면 일간 특성만
    const query = userMessage
      ? `${ilgan} 사주 ${userMessage}`
      : `${ilgan} 일간 특성`

    const embedding = await generateEmbedding(query)

    const { getServerSupabase } = await import("./supabase/server")
    const supabase = getServerSupabase()

    const { data, error } = await supabase.rpc("match_saju_knowledge", {
      query_embedding: embedding,
      match_threshold: 0.25,
      match_count: 3,
    })

    if (error || !data || data.length === 0) {
      return ""
    }

    return (data as Array<{ content: string }>).map(d => d.content).join("\n\n---\n\n")
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
