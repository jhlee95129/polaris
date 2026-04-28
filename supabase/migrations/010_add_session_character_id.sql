-- 세션별 캐릭터 저장 (캐릭터 변경 시 기존 대화 보존)
ALTER TABLE sessions ADD COLUMN character_id TEXT NOT NULL DEFAULT 'seonbi';

-- 기존 세션: 유저의 현재 character_id로 채움
UPDATE sessions s
SET character_id = u.character_id
FROM users u
WHERE s.user_id = u.id;
