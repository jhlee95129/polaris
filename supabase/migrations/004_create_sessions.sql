-- 세션 테이블 생성
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '새 대화',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX sessions_user_time_idx ON sessions(user_id, updated_at DESC);

-- messages 테이블에 session_id 추가 (마이그레이션 위해 nullable)
ALTER TABLE messages ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE CASCADE;

-- 기존 데이터 마이그레이션: user별 기존 메시지를 "이전 대화" 세션으로
INSERT INTO sessions (id, user_id, title, created_at, updated_at)
SELECT
  gen_random_uuid(),
  user_id,
  '이전 대화',
  MIN(created_at),
  MAX(created_at)
FROM messages
GROUP BY user_id;

UPDATE messages m
SET session_id = s.id
FROM sessions s
WHERE s.user_id = m.user_id
  AND m.session_id IS NULL;

-- session_id NOT NULL 제약
ALTER TABLE messages ALTER COLUMN session_id SET NOT NULL;

-- 인덱스 교체
DROP INDEX IF EXISTS messages_user_time_idx;
CREATE INDEX messages_session_time_idx ON messages(session_id, created_at DESC);
CREATE INDEX messages_user_id_idx ON messages(user_id);
