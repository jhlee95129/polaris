-- 사용자 (익명, localStorage UUID로 식별)
create table users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  display_name text,
  birth_year int not null,
  birth_month int not null,
  birth_day int not null,
  birth_hour int,
  is_lunar boolean default false,
  gender text not null check (gender in ('male','female')),
  ilgan text not null,
  yeon_pillar text not null,
  wol_pillar text not null,
  il_pillar text not null,
  si_pillar text,
  daeun_current text,
  saju_summary text
);

-- 채팅 메시지
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index messages_user_time_idx on messages(user_id, created_at desc);
