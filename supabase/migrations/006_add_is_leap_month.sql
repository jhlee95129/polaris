-- 음력 윤달 여부 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_leap_month boolean NOT NULL DEFAULT false;
