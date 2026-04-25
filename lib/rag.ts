/**
 * RAG 파이프라인
 * 명리학 지식 텍스트를 벡터 검색하여 Claude 프롬프트에 주입
 *
 * 흐름: 사용자 질문 + 사주 키워드 → OpenAI 임베딩 → Supabase pgvector 검색 → Top-K 결과 반환
 */

import OpenAI from "openai"

const EMBEDDING_MODEL = "text-embedding-3-large"
const MATCH_THRESHOLD = 0.3
const MATCH_COUNT = 5

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

// ─── 벡터 검색 ───

export interface SearchResult {
  id: number
  category: string
  title: string
  content: string
  similarity: number
}

/**
 * Supabase pgvector에서 관련 명리학 지식 검색
 * 환경변수가 없으면 빈 배열 반환 (graceful degradation)
 */
export async function searchKnowledge(
  query: string,
  additionalKeywords?: string[]
): Promise<SearchResult[]> {
  // Supabase/OpenAI 미설정 시 빈 배열 반환
  if (!process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return []
  }

  try {
    // 검색 쿼리 구성 (질문 + 사주 키워드)
    const searchText = additionalKeywords
      ? `${query} ${additionalKeywords.join(" ")}`
      : query

    // 임베딩 생성
    const embedding = await generateEmbedding(searchText)

    // Supabase에서 벡터 검색
    const { getServerSupabase } = await import("./supabase/server")
    const supabase = getServerSupabase()

    const { data, error } = await supabase.rpc("match_saju_knowledge", {
      query_embedding: embedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: MATCH_COUNT,
    })

    if (error) {
      console.error("벡터 검색 오류:", error)
      return []
    }

    return (data ?? []) as SearchResult[]
  } catch (error) {
    console.error("RAG 검색 실패:", error)
    return []
  }
}

// ─── 컨텍스트 포맷팅 ───

/**
 * 검색 결과를 Claude 프롬프트에 주입할 형태로 포맷팅
 */
export function formatRAGContext(results: SearchResult[]): string {
  if (results.length === 0) return ""

  const formatted = results.map((r, i) =>
    `[${i + 1}] (${r.category}) ${r.title}\n${r.content}`
  ).join("\n\n")

  return `[검색된 명리학 전문 지식 — 아래 내용을 참고하여 답변하세요]\n\n${formatted}`
}

// ─── 청킹 유틸 (임베딩 스크립트용) ───

export interface Chunk {
  category: string
  title: string
  content: string
  sourceDocument: string
  chunkIndex: number
}

/**
 * 텍스트를 청크로 분할
 * 500토큰 ≈ 1000자(한국어) 기준, 100자 오버랩
 */
export function chunkText(
  text: string,
  category: string,
  sourceDocument: string,
  chunkSize: number = 1000,
  overlap: number = 100
): Chunk[] {
  const chunks: Chunk[] = []

  // 섹션 단위로 먼저 분할 (## 헤더 기준)
  const sections = text.split(/^## /m).filter(Boolean)

  let chunkIndex = 0

  for (const section of sections) {
    const lines = section.split("\n")
    const title = lines[0]?.trim() || "일반"
    const body = lines.slice(1).join("\n").trim()

    if (body.length <= chunkSize) {
      // 섹션이 청크 크기 이하면 그대로 사용
      if (body.length > 0) {
        chunks.push({
          category,
          title,
          content: body,
          sourceDocument,
          chunkIndex: chunkIndex++,
        })
      }
    } else {
      // 섹션이 크면 문단 단위로 분할
      const paragraphs = body.split(/\n\n+/)
      let current = ""

      for (const para of paragraphs) {
        if ((current + para).length > chunkSize && current.length > 0) {
          chunks.push({
            category,
            title,
            content: current.trim(),
            sourceDocument,
            chunkIndex: chunkIndex++,
          })
          // 오버랩: 마지막 overlap 글자를 다음 청크에 포함
          current = current.slice(-overlap) + "\n\n" + para
        } else {
          current += (current ? "\n\n" : "") + para
        }
      }

      if (current.trim()) {
        chunks.push({
          category,
          title,
          content: current.trim(),
          sourceDocument,
          chunkIndex: chunkIndex++,
        })
      }
    }
  }

  return chunks
}
