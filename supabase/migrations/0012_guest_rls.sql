-- Guest RLS tightening: prevent writes from the guest demo account
-- This migration assumes the guest user signs in with email 'user+1750772130206@example.com'.

-- Helper: check if current JWT email is the guest account
create or replace function public.is_guest()
returns boolean
language sql
stable
as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'user+1750772130206@example.com', false)
$$;

-- Projects
do $$ begin
  if to_regclass('public.projects') is not null then
    drop policy if exists projects_insert on public.projects;
    create policy projects_insert on public.projects for insert with check (not public.is_guest());
    drop policy if exists projects_update on public.projects;
    create policy projects_update on public.projects for update using (not public.is_guest());
    drop policy if exists projects_delete on public.projects;
    create policy projects_delete on public.projects for delete using (not public.is_guest());
  end if;
end $$;

-- Drafts
do $$ begin
  if to_regclass('public.drafts') is not null then
    drop policy if exists drafts_insert on public.drafts;
    create policy drafts_insert on public.drafts for insert with check (not public.is_guest());
    drop policy if exists drafts_update on public.drafts;
    create policy drafts_update on public.drafts for update using (not public.is_guest());
    drop policy if exists drafts_delete on public.drafts;
    create policy drafts_delete on public.drafts for delete using (not public.is_guest());
  end if;
end $$;

-- Definitions
do $$ begin
  if to_regclass('public.definitions') is not null then
    drop policy if exists definitions_insert on public.definitions;
    create policy definitions_insert on public.definitions for insert with check (not public.is_guest());
    drop policy if exists definitions_update on public.definitions;
    create policy definitions_update on public.definitions for update using (not public.is_guest());
    drop policy if exists definitions_delete on public.definitions;
    create policy definitions_delete on public.definitions for delete using (not public.is_guest());
  end if;
end $$;

-- Members
do $$ begin
  if to_regclass('public.members') is not null then
    drop policy if exists members_insert on public.members;
    create policy members_insert on public.members for insert with check (not public.is_guest());
    drop policy if exists members_update on public.members;
    create policy members_update on public.members for update using (not public.is_guest());
    drop policy if exists members_delete on public.members;
    create policy members_delete on public.members for delete using (not public.is_guest());
  end if;
end $$;

-- Project members
do $$ begin
  if to_regclass('public.project_members') is not null then
    drop policy if exists project_members_insert on public.project_members;
    create policy project_members_insert on public.project_members for insert with check (not public.is_guest());
    drop policy if exists project_members_update on public.project_members;
    create policy project_members_update on public.project_members for update using (not public.is_guest());
    drop policy if exists project_members_delete on public.project_members;
    create policy project_members_delete on public.project_members for delete using (not public.is_guest());
  end if;
end $$;

-- Issues
do $$ begin
  if to_regclass('public.issues') is not null then
    drop policy if exists issues_insert on public.issues;
    create policy issues_insert on public.issues for insert with check (not public.is_guest());
    drop policy if exists issues_update on public.issues;
    create policy issues_update on public.issues for update using (not public.is_guest());
    drop policy if exists issues_delete on public.issues;
    create policy issues_delete on public.issues for delete using (not public.is_guest());
  end if;
end $$;

-- Workflows (org-based policy exists; add not-guest requirement)
do $$ begin
  if to_regclass('public.workflows') is not null then
    drop policy if exists workflows_insert on public.workflows;
    create policy workflows_insert on public.workflows for insert with check (
      coalesce(org_id, public.current_org_id()) is not distinct from public.current_org_id()
      and not public.is_guest()
    );
  end if;
end $$;

-- Workflow stages (org-based policy exists; add not-guest)
do $$ begin
  if to_regclass('public.workflow_stages') is not null then
    drop policy if exists workflow_stages_insert on public.workflow_stages;
    create policy workflow_stages_insert on public.workflow_stages for insert with check (
      exists (
        select 1 from public.workflows w
        where w.id = workflow_id
          and w.org_id is not distinct from public.current_org_id()
      ) and not public.is_guest()
    );
  end if;
end $$;

-- Messages (org-based; add not-guest)
do $$ begin
  if to_regclass('public.messages') is not null then
    drop policy if exists messages_insert on public.messages;
    create policy messages_insert on public.messages for insert with check (
      (workflow_id is null or exists (
        select 1 from public.workflows w
        where w.id = workflow_id
          and w.org_id is not distinct from public.current_org_id()
      )) and not public.is_guest()
    );
  end if;
end $$;

-- Manifests (org-based; add not-guest)
do $$ begin
  if to_regclass('public.manifests') is not null then
    drop policy if exists manifests_insert on public.manifests;
    create policy manifests_insert on public.manifests for insert with check (
      exists (
        select 1 from public.workflows w
        where w.id = workflow_id
          and w.org_id is not distinct from public.current_org_id()
      ) and not public.is_guest()
    );
  end if;
end $$;

