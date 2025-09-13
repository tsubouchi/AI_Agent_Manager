-- Enable RLS and add permissive policies (development defaults)
-- Renumbered: 0002 -> 0005
alter table if exists workflows enable row level security;
alter table if exists workflow_stages enable row level security;
alter table if exists messages enable row level security;
alter table if exists manifests enable row level security;

-- Development policies: allow all (select/insert)
-- Drop if exists, then create (CREATE POLICY doesn't support IF NOT EXISTS)
drop policy if exists workflows_read on workflows;
create policy workflows_read on workflows for select using (true);

drop policy if exists workflow_stages_read on workflow_stages;
create policy workflow_stages_read on workflow_stages for select using (true);

drop policy if exists messages_read on messages;
create policy messages_read on messages for select using (true);

drop policy if exists manifests_read on manifests;
create policy manifests_read on manifests for select using (true);

drop policy if exists workflows_insert on workflows;
create policy workflows_insert on workflows for insert with check (true);

drop policy if exists workflow_stages_insert on workflow_stages;
create policy workflow_stages_insert on workflow_stages for insert with check (true);

drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert with check (true);

drop policy if exists manifests_insert on manifests;
create policy manifests_insert on manifests for insert with check (true);
