-- 세션 공유 토큰 추가 (nullable = 비공개)
ALTER TABLE sessions ADD COLUMN share_token UUID DEFAULT NULL;

-- 토큰으로 빠른 조회 + 유니크 제약
CREATE UNIQUE INDEX sessions_share_token_idx ON sessions(share_token) WHERE share_token IS NOT NULL;
