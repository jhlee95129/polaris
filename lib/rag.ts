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

// ─── 일간 특성 검색 (Top-1) ───

/**
 * 사용자 일간에 해당하는 일간 특성 chunk를 RAG에서 검색
 * @returns 일간 특성 텍스트 (없으면 빈 문자열)
 */
export async function searchIlganCharacteristics(ilgan: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return ""
  }

  try {
    const query = `${ilgan} 일간 특성`
    const embedding = await generateEmbedding(query)

    const { getServerSupabase } = await import("./supabase/server")
    const supabase = getServerSupabase()

    const { data, error } = await supabase.rpc("match_saju_knowledge", {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 1,
    })

    if (error || !data || data.length === 0) {
      return ""
    }

    return data[0].content as string
  } catch (error) {
    console.error("RAG 검색 실패:", error)
    return ""
  }
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
