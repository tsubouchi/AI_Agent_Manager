-- Add useful columns to projects for UI
alter table if exists projects add column if not exists description text;
alter table if exists projects add column if not exists status text default 'planning';
alter table if exists projects add column if not exists priority text default 'medium';
alter table if exists projects add column if not exists progress int default 0;
alter table if exists projects add column if not exists due_date date;

-- Issues table for project management
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo', -- todo | in-progress | completed
  priority text null,                  -- low | medium | high
  assignee text null,
  due_date date null,
  progress int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create trigger trg_issues_updated_at
  before update on issues
  for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

