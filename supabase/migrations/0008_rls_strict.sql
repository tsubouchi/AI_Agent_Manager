-- Strict RLS policies for production-like environments.
-- Renumbered: 0003 -> 0008
-- Adjust as needed; these replace permissive dev policies.

-- Workflows: only owner (user_id) can read/insert; allow user_id null (system-owned) reads.
drop policy if exists workflows_read on workflows;
create policy workflows_read on workflows for select using (
  user_id is null or user_id::uuid = auth.uid()
);

drop policy if exists workflows_insert on workflows;
create policy workflows_insert on workflows for insert with check (
  user_id is null or user_id::uuid = auth.uid()
);

-- Workflow stages: allowed if referencing an accessible workflow
drop policy if exists workflow_stages_read on workflow_stages;
create policy workflow_stages_read on workflow_stages for select using (
  exists (
    select 1 from workflows w
    where w.id = workflow_id and (w.user_id is null or w.user_id::uuid = auth.uid())
  )
);

drop policy if exists workflow_stages_insert on workflow_stages;
create policy workflow_stages_insert on workflow_stages for insert with check (
  exists (
    select 1 from workflows w
    where w.id = workflow_id and (w.user_id is null or w.user_id::uuid = auth.uid())
  )
);

-- Messages: accessible if workflow is accessible or workflow_id is null
drop policy if exists messages_read on messages;
create policy messages_read on messages for select using (
  workflow_id is null or exists (
    select 1 from workflows w
    where w.id = workflow_id and (w.user_id is null or w.user_id::uuid = auth.uid())
  )
);

drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert with check (
  workflow_id is null or exists (
    select 1 from workflows w
    where w.id = workflow_id and (w.user_id is null or w.user_id::uuid = auth.uid())
  )
);

-- Manifests: allowed if referencing an accessible workflow
drop policy if exists manifests_read on manifests;
create policy manifests_read on manifests for select using (
  exists (
    select 1 from workflows w
    where w.id = workflow_id and (w.user_id is null or w.user_id::uuid = auth.uid())
  )
);

drop policy if exists manifests_insert on manifests;
create policy manifests_insert on manifests for insert with check (
  exists (
    select 1 from workflows w
    where w.id = workflow_id and (w.user_id is null or w.user_id::uuid = auth.uid())
  )
);
