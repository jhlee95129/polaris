/**
 * 명리학 텍스트 → 청킹 → OpenAI 임베딩 → Supabase pgvector 저장
 *
 * 실행: npx tsx scripts/embed-knowledge.ts
 *
 * 필요 환경변수:
 * - OPENAI_API_KEY
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SECRET_KEY
 */

import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"
import { chunkText } from "../lib/rag"

const KNOWLEDGE_DIR = join(process.cwd(), "data", "saju-knowledge")
const EMBEDDING_MODEL = "text-embedding-3-large"

// 파일명 → 카테고리 매핑
const CATEGORY_MAP: Record<string, string> = {
  "oheng-relations.md": "오행관계",
  "sipsin-analysis.md": "십신분석",
  "ilgan-characteristics.md": "일간특성",
  "life-coaching.md": "라이프코칭",
}

async function main() {
  // 환경변수 확인
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY 환경변수가 필요합니다")
    process.exit(1)
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error("NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SECRET_KEY 환경변수가 필요합니다")
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  )

  // 기존 데이터 삭제
  console.log("기존 데이터 삭제 중...")
  const { error: deleteError } = await supabase
    .from("saju_knowledge")
    .delete()
    .neq("id", 0) // 모든 행 삭제

  if (deleteError) {
    console.warn("기존 데이터 삭제 실패 (테이블이 없을 수 있음):", deleteError.message)
  }

  // 파일 읽기 및 청킹
  const files = readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith(".md"))
  console.log(`${files.length}개 파일 발견:`, files)

  const allChunks: Array<{
    category: string
    title: string
    content: string
    source_document: string
    chunk_index: number
    embedding: number[]
  }> = []

  for (const file of files) {
    const category = CATEGORY_MAP[file] || "기타"
    const content = readFileSync(join(KNOWLEDGE_DIR, file), "utf-8")
    const chunks = chunkText(content, category, file)

    console.log(`  ${file}: ${chunks.length}개 청크`)

    // 임베딩 생성 (배치)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`    [${i + 1}/${chunks.length}] 임베딩 생성: ${chunk.title.slice(0, 30)}...`)

      const embeddingResponse = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: `${chunk.category}: ${chunk.title}\n${chunk.content}`,
        dimensions: 2000,
      })

      allChunks.push({
        category: chunk.category,
        title: chunk.title,
        content: chunk.content,
        source_document: chunk.sourceDocument,
        chunk_index: chunk.chunkIndex,
        embedding: embeddingResponse.data[0].embedding,
      })

      // Rate limiting
      await sleep(200)
    }
  }

  // Supabase에 저장
  console.log(`\n총 ${allChunks.length}개 청크를 Supabase에 저장 중...`)

  // 배치 삽입 (10개씩)
  const batchSize = 10
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize)
    const { error } = await supabase.from("saju_knowledge").insert(batch)

    if (error) {
      console.error(`배치 ${i / batchSize + 1} 삽입 실패:`, error.message)
    } else {
      console.log(`  배치 ${i / batchSize + 1} 저장 완료 (${batch.length}개)`)
    }
  }

  console.log("\n임베딩 완료!")
  console.log(`총 ${allChunks.length}개 청크가 저장되었습니다.`)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(console.error)
