-- 메시지별 사주 근거 메타데이터 저장용
alter table messages add column if not exists metadata jsonb default null;
