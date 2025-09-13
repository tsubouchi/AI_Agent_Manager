-- Seed team members and membership mapping
-- Renumbered: 0006 -> 0007
insert into members (name)
values ('田中'), ('佐藤'), ('鈴木'), ('山田'), ('高橋')
on conflict do nothing;

-- Map members to projects
with p as (
  select id, name from projects where name in ('Matching v1','SalesOps')
), m as (
  select id, name from members
)
insert into project_members (project_id, member_id, role)
select p.id, m.id,
  case m.name when '田中' then 'Lead' when '佐藤' then 'Engineer' when '鈴木' then 'Analyst' when '山田' then 'Owner' when '高橋' then 'Engineer' else null end
from p
join m on (
  (p.name = 'Matching v1' and m.name in ('田中','佐藤','鈴木')) or
  (p.name = 'SalesOps' and m.name in ('山田','高橋'))
)
on conflict do nothing;
