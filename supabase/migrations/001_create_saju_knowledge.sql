-- 명리학 지식 벡터 테이블
-- pgvector 확장이 필요합니다 (Supabase 대시보드에서 활성화)

create extension if not exists vector with schema extensions;

-- 기존 테이블/함수 삭제 (재생성용)
drop function if exists match_saju_knowledge;
drop table if exists saju_knowledge;

create table saju_knowledge (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,           -- 'ilgan-characteristics'만 채우기
  content text not null,               -- 본문 내용
  embedding vector(2000),              -- OpenAI text-embedding-3-large
  metadata jsonb                       -- {ilgan: "병화", source: "OOO 입문서 3장 / 위키 천간 항목"}
);

-- HNSW 인덱스 (코사인 유사도 검색 최적화)
create index saju_knowledge_embedding_idx
  on saju_knowledge
  using hnsw (embedding vector_cosine_ops);

-- 벡터 검색 RPC 함수
create or replace function match_saju_knowledge(
  query_embedding vector(2000),
  match_threshold float default 0.3,
  match_count int default 1
)
returns table (
  id uuid,
  source_file text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    sk.id,
    sk.source_file,
    sk.content,
    sk.metadata,
    1 - (sk.embedding <=> query_embedding) as similarity
  from saju_knowledge sk
  where 1 - (sk.embedding <=> query_embedding) > match_threshold
  order by sk.embedding <=> query_embedding
  limit match_count;
$$;
