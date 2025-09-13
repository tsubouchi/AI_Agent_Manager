-- Team members and project membership
-- Renumbered: 0005 -> 0004
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  role text null,
  created_at timestamptz not null default now(),
  primary key (project_id, member_id)
);

do $$ begin
  create trigger trg_members_updated_at
  before update on members
  for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
