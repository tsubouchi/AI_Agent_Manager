-- Initial schema for AI Agent Manager (Supabase)
create extension if not exists pgcrypto;

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text null,
  input_text text not null
);

do $$ begin
  create type workflow_status as enum ('pending','running','completed','error');
exception when duplicate_object then null; end $$;

create table if not exists workflow_stages (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  name text not null,
  status workflow_status not null,
  result jsonb null,
  error text null,
  created_at timestamptz not null default now()
);

do $$ begin
  create type chat_role as enum ('user','assistant','system');
exception when duplicate_object then null; end $$;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid null references workflows(id) on delete set null,
  role chat_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists manifests (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  agent_name text not null,
  manifest jsonb not null,
  created_at timestamptz not null default now()
);

