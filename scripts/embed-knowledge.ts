/**
 * 사주 지식 파일 전체 → 청킹 → OpenAI 임베딩 → Supabase pgvector 저장
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
import { chunkByHeaders } from "../lib/rag"

const KNOWLEDGE_DIR = join(process.cwd(), "data", "saju-knowledge")
const EMBEDDING_MODEL = "text-embedding-3-large"

async function main() {
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
  await supabase.from("saju_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  // 모든 .md 파일 처리
  const files = readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith(".md"))
  console.log(`${files.length}개 지식 파일 발견: ${files.join(", ")}`)

  const rows: Array<{
    source_file: string
    content: string
    embedding: number[]
    metadata: Record<string, string>
  }> = []

  for (const file of files) {
    const filePath = join(KNOWLEDGE_DIR, file)
    const content = readFileSync(filePath, "utf-8")
    const sourceFile = file.replace(".md", "")
    const chunks = chunkByHeaders(content, sourceFile)

    console.log(`\n[${file}] ${chunks.length}개 청크 발견`)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`  [${i + 1}/${chunks.length}] 임베딩 생성: ${chunk.metadata.ilgan || chunk.content.slice(3, 30)}...`)

      const embeddingResponse = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: chunk.content,
        dimensions: 2000,
      })

      rows.push({
        source_file: chunk.sourceFile,
        content: chunk.content,
        embedding: embeddingResponse.data[0].embedding,
        metadata: chunk.metadata,
      })

      // Rate limiting
      await sleep(200)
    }
  }

  // Supabase에 저장
  console.log(`\n총 ${rows.length}개 청크를 Supabase에 저장 중...`)

  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10)
    const { error } = await supabase.from("saju_knowledge").insert(batch)

    if (error) {
      console.error(`배치 ${Math.floor(i / 10) + 1} 삽입 실패:`, error.message)
    } else {
      console.log(`  배치 ${Math.floor(i / 10) + 1} 저장 완료 (${batch.length}개)`)
    }
  }

  console.log("\n임베딩 완료!")
  console.log(`총 ${rows.length}개 청크가 저장되었습니다.`)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(console.error)
