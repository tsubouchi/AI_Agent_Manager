-- Seed: Projects
-- Renumbered: 0004 -> 0006
-- Ensure projects has extended columns (idempotent, in case previous migration not applied)
alter table if exists projects add column if not exists description text;
alter table if exists projects add column if not exists status text;
alter table if exists projects add column if not exists progress int;
alter table if exists projects add column if not exists priority text;
alter table if exists projects add column if not exists due_date date;

insert into projects (name, description, status, progress, priority, due_date)
values
  ('Matching v1', '顧客マッチングシステムの改善', 'active', 75, 'high', current_date + interval '30 days'),
  ('SalesOps', '営業プロセス自動化プロジェクト', 'planning', 25, 'medium', current_date + interval '60 days')
on conflict do nothing;

-- Define set_updated_at (idempotent)
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  priority text null,
  assignee text null,
  due_date date null,
  progress int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_issues_updated_at on issues;
create trigger trg_issues_updated_at
before update on issues
for each row execute function set_updated_at();

-- Fetch project ids for seeds and insert issues
with p as (
  select id, name from projects where name in ('Matching v1','SalesOps')
)
insert into issues (project_id, title, status, priority, assignee, due_date, progress)
select p1.id, x.title, x.status, x.priority, x.assignee, current_date + (x.offset_days || ' days')::interval, x.progress
from p p1
join (
  values
    ('Matching v1', '顧客データの可視化不足', 'in-progress', 'high', '田中', 10, 60),
    ('Matching v1', 'マッチング精度の向上', 'completed', 'high', '佐藤', 5, 100),
    ('Matching v1', 'データ前処理の自動化', 'todo', 'medium', '鈴木', 20, 0),
    ('SalesOps',   '営業レポート自動生成', 'todo', 'medium', '山田', 15, 0),
    ('SalesOps',   'SFA連携の改善', 'in-progress', 'medium', '高橋', 25, 30)
  ) as x(project_name, title, status, priority, assignee, offset_days, progress)
on p1.name = x.project_name
on conflict do nothing;

-- Definitions seeds
insert into definitions (filename, name, title)
values ('problem.yaml','problem.yaml','Initial problem definition'),
       ('usecases.yaml','usecases.yaml','Initial use cases')
on conflict do nothing;
