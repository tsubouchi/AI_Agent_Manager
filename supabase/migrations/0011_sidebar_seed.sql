-- Sidebar seed data: projects (idempotent), drafts, definitions

-- Projects (ensure example records exist)
insert into projects (name, description, status, progress, priority, due_date)
select 'Internal Tools', '社内向けツール整備', 'planning', 10, 'medium', current_date + interval '45 days'
where not exists (select 1 from projects where name = 'Internal Tools');

insert into projects (name, description, status, progress, priority, due_date)
select 'Data Platform', 'データ基盤の刷新', 'active', 40, 'high', current_date + interval '90 days'
where not exists (select 1 from projects where name = 'Data Platform');

-- Drafts (use title de-duplication)
insert into drafts (title, description, priority, category, stakeholders, timeline, context)
select 'AI導入計画の洗い出し', 'PoC範囲と評価項目の定義', 'high', 'planning', '事業,開発', 'Q4', '{}'::text
where not exists (select 1 from drafts where title = 'AI導入計画の洗い出し');

insert into drafts (title, description, priority, category, stakeholders, timeline, context)
select 'ナレッジ検索の改善', 'FAQとチケットの横断検索', 'medium', 'support', 'CS,開発', 'Q3', '{}'::text
where not exists (select 1 from drafts where title = 'ナレッジ検索の改善');

insert into drafts (title, description, priority, category, stakeholders, timeline, context)
select 'ダッシュボード刷新', 'KPI可視化とレポート自動化', 'medium', 'analytics', '事業,データ', 'Q3', '{}'::text
where not exists (select 1 from drafts where title = 'ダッシュボード刷新');

-- Definitions (ensure useful starter files)
insert into definitions (filename, name, title)
select 'personas.yaml','personas.yaml','Personas'
where not exists (select 1 from definitions where filename = 'personas.yaml');

insert into definitions (filename, name, title)
select 'architecture.yaml','architecture.yaml','Architecture Overview'
where not exists (select 1 from definitions where filename = 'architecture.yaml');

