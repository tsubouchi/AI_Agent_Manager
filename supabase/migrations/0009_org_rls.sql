-- Org-level RLS with JWT-derived org_id
-- Renumbered: 0004 -> 0009

-- Helper to extract org_id from JWT (safe uuid)
create or replace function public.current_org_id()
returns uuid
language plpgsql
stable
as $$
declare
  claims text;
  org text;
  out_id uuid;
begin
  claims := current_setting('request.jwt.claims', true);
  if claims is null or claims = '' then
    return null;
  end if;
  org := (claims::jsonb ->> 'org_id');
  if org is null or org = '' then
    return null;
  end if;
  begin
    out_id := org::uuid;
  exception when others then
    return null;
  end;
  return out_id;
end;
$$;

-- Add org_id to workflows and default
alter table if exists public.workflows
  add column if not exists org_id uuid;

-- Default via trigger to avoid cast failure when claims missing
create or replace function public.set_workflows_org_id()
returns trigger
language plpgsql
as $$
begin
  if new.org_id is null then
    begin
      new.org_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid;
    exception when others then
      -- leave null if claim or cast unavailable
      new.org_id := null;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_workflows_set_org on public.workflows;
create trigger trg_workflows_set_org
before insert on public.workflows
for each row execute procedure public.set_workflows_org_id();

-- Replace strict RLS to org-based
-- Workflows
drop policy if exists workflows_read on public.workflows;
create policy workflows_read on public.workflows for select using (
  org_id is not distinct from public.current_org_id()
);

drop policy if exists workflows_insert on public.workflows;
create policy workflows_insert on public.workflows for insert with check (
  coalesce(org_id, public.current_org_id()) is not distinct from public.current_org_id()
);

-- workflow_stages
drop policy if exists workflow_stages_read on public.workflow_stages;
create policy workflow_stages_read on public.workflow_stages for select using (
  exists (
    select 1 from public.workflows w
    where w.id = workflow_id
      and w.org_id is not distinct from public.current_org_id()
  )
);

drop policy if exists workflow_stages_insert on public.workflow_stages;
create policy workflow_stages_insert on public.workflow_stages for insert with check (
  exists (
    select 1 from public.workflows w
    where w.id = workflow_id
      and w.org_id is not distinct from public.current_org_id()
  )
);

-- messages
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select using (
  workflow_id is null or exists (
    select 1 from public.workflows w
    where w.id = workflow_id
      and w.org_id is not distinct from public.current_org_id()
  )
);

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (
  workflow_id is null or exists (
    select 1 from public.workflows w
    where w.id = workflow_id
      and w.org_id is not distinct from public.current_org_id()
  )
);

-- manifests
drop policy if exists manifests_read on public.manifests;
create policy manifests_read on public.manifests for select using (
  exists (
    select 1 from public.workflows w
    where w.id = workflow_id
      and w.org_id is not distinct from public.current_org_id()
  )
);

drop policy if exists manifests_insert on public.manifests;
create policy manifests_insert on public.manifests for insert with check (
  exists (
    select 1 from public.workflows w
    where w.id = workflow_id
      and w.org_id is not distinct from public.current_org_id()
  )
);
