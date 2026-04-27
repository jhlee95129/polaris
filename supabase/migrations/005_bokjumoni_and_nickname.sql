-- 복주머니 시스템 + 닉네임 유니크

-- 기존 테스트 데이터 정리 (sessions, messages CASCADE 삭제)
DELETE FROM users;

-- 새 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS bokjumoni_count int NOT NULL DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checkin_date date;

-- display_name UNIQUE (NULL 허용, 신규는 앱 레벨에서 필수 강제)
CREATE UNIQUE INDEX IF NOT EXISTS users_display_name_unique
  ON users(display_name) WHERE display_name IS NOT NULL;
