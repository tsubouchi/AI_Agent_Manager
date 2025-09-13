-- Optional schema for sidebar-driven resources
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  priority text null,
  category text null,
  stakeholders text null,
  timeline text null,
  context text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists definitions (
  id uuid primary key default gen_random_uuid(),
  name text null,
  filename text null,
  title text null,
  content jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- simple updated_at triggers
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_drafts_updated_at
  before update on drafts
  for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_definitions_updated_at
  before update on definitions
  for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

