-- 명리학 지식 벡터 테이블
-- pgvector 확장이 필요합니다 (Supabase 대시보드에서 활성화)

create extension if not exists vector with schema extensions;

-- 기존 테이블/함수 삭제 (재생성용)
drop function if exists match_saju_knowledge;
drop table if exists saju_knowledge;

create table saju_knowledge (
  id bigserial primary key,
  created_at timestamptz default now(),
  category text not null,          -- 예: "오행관계", "십신분석", "일간특성", "라이프코칭"
  title text not null,             -- 섹션 제목
  content text not null,           -- 본문 내용
  source_document text,            -- 원본 파일명
  chunk_index int,                 -- 청크 인덱스
  embedding vector(2000),          -- OpenAI text-embedding-3-large
  metadata jsonb default '{}'::jsonb
);

-- HNSW 인덱스 (코사인 유사도 검색 최적화)
create index saju_knowledge_embedding_idx
  on saju_knowledge
  using hnsw (embedding vector_cosine_ops);

-- 카테고리 인덱스
create index saju_knowledge_category_idx
  on saju_knowledge (category);

-- 벡터 검색 RPC 함수
create or replace function match_saju_knowledge(
  query_embedding vector(2000),
  match_threshold float default 0.3,
  match_count int default 5
)
returns table (
  id bigint,
  category text,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    sk.id,
    sk.category,
    sk.title,
    sk.content,
    1 - (sk.embedding <=> query_embedding) as similarity
  from saju_knowledge sk
  where 1 - (sk.embedding <=> query_embedding) > match_threshold
  order by sk.embedding <=> query_embedding
  limit match_count;
$$;
