-- 사용자별 코칭 캐릭터 선택
ALTER TABLE users ADD COLUMN character_id TEXT NOT NULL DEFAULT 'seonbi';
