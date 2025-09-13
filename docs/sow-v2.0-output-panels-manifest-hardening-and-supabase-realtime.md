## Statement of Work (SOW) v2.0

## Objectives
- Keep v1 scope: dynamic Output panels and manifest-generation hardening using `sample_manifest.yaml`.
- Add Supabase remote DB to persist chats/workflows/manifests and enable real‑time updates in the UI.
- Create a repo `supabase/` folder and `supabase/migrations/` with an initial SQL migration.

## Scope
- UI: `components/output-panels.tsx`, `components/pain-analysis-panel.tsx`, `components/solution-design-panel.tsx`, `components/agent-manifest-editor.tsx`, `components/chat-interface.tsx` (persist + subscribe realtime).
- Logic/API: `lib/workflow-engine.ts`, `app/api/workflow/*` (persist results/errors), `app/api/messages` (new), `app/api/workflows` (new), `app/api/manifests` (new).
- Infra/DB: Supabase project (remote), repo folders `supabase/`, `supabase/migrations/`, initial migration file.
- Reference: `sample_manifest.yaml` remains the canonical manifest example.

## DB Schema (initial)
- Table `workflows`:
  - `id uuid pk default gen_random_uuid()`
  - `created_at timestamptz default now()`
  - `user_id text null`
  - `input_text text not null`
- Table `workflow_stages`:
  - `id uuid pk default gen_random_uuid()`
  - `workflow_id uuid references workflows(id) on delete cascade`
  - `name text not null` (e.g., "Pain Analysis")
  - `status text not null` check in (pending,running,completed,error)
  - `result jsonb null`
  - `error text null`
  - `created_at timestamptz default now()`
- Table `messages`:
  - `id uuid pk default gen_random_uuid()`
  - `workflow_id uuid null references workflows(id) on delete set null`
  - `role text not null` check in (user,assistant,system)
  - `content text not null`
  - `created_at timestamptz default now()`
- Table `manifests`:
  - `id uuid pk default gen_random_uuid()`
  - `workflow_id uuid references workflows(id) on delete cascade`
  - `agent_name text not null`
  - `manifest jsonb not null`
  - `created_at timestamptz default now()`

## Migrations (repo)
- Create folders: `supabase/` and `supabase/migrations/`.
- Add file `supabase/migrations/0001_init.sql` with:
  ```sql
  create extension if not exists pgcrypto;

  create table if not exists workflows (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_id text null,
    input_text text not null
  );

  create type workflow_status as enum ('pending','running','completed','error');
  create table if not exists workflow_stages (
    id uuid primary key default gen_random_uuid(),
    workflow_id uuid not null references workflows(id) on delete cascade,
    name text not null,
    status workflow_status not null,
    result jsonb null,
    error text null,
    created_at timestamptz not null default now()
  );

  create type chat_role as enum ('user','assistant','system');
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
  ```

## Implementation Plan
1) Output panels (dynamic)
- Remove hard-coded placeholders; render data from `context`. Add empty states.

2) Manifest generation (hardening)
- Use `sample_manifest.yaml` in prompt; strict JSON; forbid K8s Deployment fields; add repair mapping and fallback validation.

3) Supabase integration
- Install: `pnpm add @supabase/supabase-js` (already scaffolded `lib/supabase.ts`).
- Env: ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- API endpoints:
  - `POST /api/messages`: insert chat message.
  - `POST /api/workflows`: create workflow; `PATCH /api/workflows/:id` for status.
  - `POST /api/manifests`: persist generated manifests (array upsert).
- Realtime (client):
  - Subscribe to `postgres_changes` on `messages` (and optionally `workflow_stages`) to auto-append new rows in chat UI.
  - Handle unsubscribe on unmount.
- Persistence hooks:
  - On message send/receive: call `/api/messages`.
  - In `workflow-engine`: after each stage completes/fails, upsert `workflow_stages` and, for manifest-generation, insert into `manifests`.

## Deliverables
- Updated UI/logic per above.
- `supabase/` and `supabase/migrations/0001_init.sql` in repo.
- Docs: README update (running migrations via SQL editor or CLI; env vars).

## Acceptance Criteria
- Output tabs reflect only live context and show empty states when no data.
- Manifest API returns schema-valid responses; repairs Deployment-shaped outputs.
- Messages/workflows/manifests persist to Supabase.
- Chat UI updates in real-time when new `messages` rows are inserted.

## Timeline & Risks
- 1.5–2.0 days including DB wiring and realtime.
- Risks: Realtime auth rules, model variability; mitigations via RLS testing and prompt hardening.

## Notes
- Use `sample_manifest.yaml` as canonical manifest reference.

---

## Sidebar & Project Management (Supabase-backed)

### Overview
- Replace hard-coded Sidebar data with Supabase-backed lists (Projects, Drafts, 最近の定義) and add inline create UI.
- Add Project Management page data fetching from Supabase (Projects, Issues) with realtime updates and analytics derived from live data.

### DB Additions (migrations)
- `supabase/migrations/0002_sidebar.sql`: `projects`, `drafts`, `definitions` (+ updated_at triggers).
- `supabase/migrations/0003_projects_and_issues.sql`: extend `projects` (description, status, priority, progress, due_date); new `issues` table with updated_at trigger.
- `supabase/migrations/0004_seed_data.sql`: seed two projects (Matching v1, SalesOps), seed issues, seed definitions (problem.yaml, usecases.yaml).
 - `supabase/migrations/0005_team.sql`: `members` と `project_members` を追加（FK & トリガ）。
 - `supabase/migrations/0006_seed_teams.sql`: メンバー（田中/佐藤/鈴木/山田/高橋）とプロジェクト所属をシード。

### API Endpoints
- `/api/projects` (GET, POST), `/api/projects/[id]` (PATCH, DELETE)
- `/api/drafts` (GET, POST), `/api/drafts/[id]` (PATCH, DELETE)
- `/api/definitions` (GET, POST), `/api/definitions/[id]` (PATCH, DELETE)
- `/api/issues` (GET, POST), `/api/issues/[id]` (PATCH, DELETE)

### UI Hooks & Components
- `hooks/use-supabase-sidebar.ts`: fetches lists; subscribes to Realtime on `projects`, `drafts`, `definitions`, and fallbacks (`workflows`, `manifests`).
- `components/sidebar.tsx`: renders fetched lists; inline “追加” forms post to `/api/projects` and `/api/definitions`.
- `components/project-management.tsx`: fetches `/api/projects`（チームをネスト取得） and `/api/issues`; subscribes to Realtime on both; computes analytics（総プロジェクト数, 完了課題, 平均進捗率）。ステータス/優先度フィルタ＋検索を追加。

### Realtime
- Enable Realtime and add tables to publication:
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages, public.projects, public.drafts, public.definitions, public.workflows, public.manifests, public.issues;`
- Ensure RLS policies allow required read/write operations for anon or use Service Role via server routes.

### Acceptance
- Sidebar lists reflect Supabase seed on first load and update instantly on create/update.
- Project Management shows seed projects/issues; analytics numbers derive from live data and update on changes.
