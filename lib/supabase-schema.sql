-- Run this in the Supabase SQL editor

create table if not exists player_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  level integer not null default 1,
  job_class text not null default 'warrior',
  weapon_id text,
  armor_id text,
  floor integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table player_state enable row level security;

-- 自分の状態だけ書き込み可能
create policy "Users can upsert their own player state"
  on player_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own player state"
  on player_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ランキング表示のため、ログイン済みなら全員分を閲覧可能
create policy "Authenticated users can view all player states"
  on player_state for select
  using (auth.role() = 'authenticated');

-- Realtime配信を有効化
alter publication supabase_realtime add table player_state;
