-- Security hardening: enable RLS on public tables and fix function search_path
-- Renumbered: 0007 -> 0010

-- 1) Fix function search_path to avoid role-mutable behavior

-- set_updated_at (trigger): ensure function exists with fixed search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $f$
begin
  new.updated_at = now();
  return new;
end;
$f$;

-- Use a DO block for compatibility (older PG may not support IF EXISTS here)
do $do$
begin
  -- current_org_id
  begin
    execute 'alter function public.current_org_id() set search_path to public';
  exception when undefined_function then
    -- ignore if not present in this environment
  end;

  -- set_workflows_org_id
  begin
    execute 'alter function public.set_workflows_org_id() set search_path to public';
  exception when undefined_function then
    -- ignore if not present
  end;
end;
$do$;

-- 2) Enable RLS for public tables used by PostgREST and add permissive dev policies
-- Note: tighten these policies in production

-- Helper procedure to (re)create basic policies
-- Not supported as procedure in a single file portably; inline per table

-- projects
do $$ begin
  if to_regclass('public.projects') is not null then
    alter table public.projects enable row level security;
    drop policy if exists projects_select on public.projects;
    create policy projects_select on public.projects for select using (true);
    drop policy if exists projects_insert on public.projects;
    create policy projects_insert on public.projects for insert with check (true);
    drop policy if exists projects_update on public.projects;
    create policy projects_update on public.projects for update using (true);
    drop policy if exists projects_delete on public.projects;
    create policy projects_delete on public.projects for delete using (true);
  end if;
end $$;

-- drafts
do $$ begin
  if to_regclass('public.drafts') is not null then
    alter table public.drafts enable row level security;
    drop policy if exists drafts_select on public.drafts;
    create policy drafts_select on public.drafts for select using (true);
    drop policy if exists drafts_insert on public.drafts;
    create policy drafts_insert on public.drafts for insert with check (true);
    drop policy if exists drafts_update on public.drafts;
    create policy drafts_update on public.drafts for update using (true);
    drop policy if exists drafts_delete on public.drafts;
    create policy drafts_delete on public.drafts for delete using (true);
  end if;
end $$;

-- definitions
do $$ begin
  if to_regclass('public.definitions') is not null then
    alter table public.definitions enable row level security;
    drop policy if exists definitions_select on public.definitions;
    create policy definitions_select on public.definitions for select using (true);
    drop policy if exists definitions_insert on public.definitions;
    create policy definitions_insert on public.definitions for insert with check (true);
    drop policy if exists definitions_update on public.definitions;
    create policy definitions_update on public.definitions for update using (true);
    drop policy if exists definitions_delete on public.definitions;
    create policy definitions_delete on public.definitions for delete using (true);
  end if;
end $$;

-- members
do $$ begin
  if to_regclass('public.members') is not null then
    alter table public.members enable row level security;
    drop policy if exists members_select on public.members;
    create policy members_select on public.members for select using (true);
    drop policy if exists members_insert on public.members;
    create policy members_insert on public.members for insert with check (true);
    drop policy if exists members_update on public.members;
    create policy members_update on public.members for update using (true);
    drop policy if exists members_delete on public.members;
    create policy members_delete on public.members for delete using (true);
  end if;
end $$;

-- project_members
do $$ begin
  if to_regclass('public.project_members') is not null then
    alter table public.project_members enable row level security;
    drop policy if exists project_members_select on public.project_members;
    create policy project_members_select on public.project_members for select using (true);
    drop policy if exists project_members_insert on public.project_members;
    create policy project_members_insert on public.project_members for insert with check (true);
    drop policy if exists project_members_update on public.project_members;
    create policy project_members_update on public.project_members for update using (true);
    drop policy if exists project_members_delete on public.project_members;
    create policy project_members_delete on public.project_members for delete using (true);
  end if;
end $$;

-- issues (used by API)
do $$ begin
  if to_regclass('public.issues') is not null then
    alter table public.issues enable row level security;
    drop policy if exists issues_select on public.issues;
    create policy issues_select on public.issues for select using (true);
    drop policy if exists issues_insert on public.issues;
    create policy issues_insert on public.issues for insert with check (true);
    drop policy if exists issues_update on public.issues;
    create policy issues_update on public.issues for update using (true);
    drop policy if exists issues_delete on public.issues;
    create policy issues_delete on public.issues for delete using (true);
  end if;
end $$;
