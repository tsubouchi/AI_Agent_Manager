# Supabase Migrations & Seeds

This folder contains the database schema, RLS policies, and seed data used by the app. Apply migrations in order and choose the RLS policy set that matches your environment (dev vs prod).

## Files & Order

Core schema and sidebar tables
- 0001_init.sql – core workflow tables (workflows, workflow_stages, messages, manifests)
- 0002_sidebar.sql – sidebar resources (projects, drafts, definitions) + updated_at triggers
- 0003_projects_and_issues.sql – project management (issues) additions
- 0004_team.sql – members, project_members

RLS (choose one path)
- 0005_rls_policies.sql – dev friendly: enable RLS with permissive select/insert
- 0008_rls_strict.sql – strict user-based RLS (auth.uid())
- 0009_org_rls.sql – org_id-based RLS + current_org_id() + trigger to set org_id
- 0010_security_hardening.sql – search_path fixes and RLS enable for public tables

Seeds
- 0006_seed_data.sql – projects + issues + definitions (idempotent)
- 0007_seed_teams.sql – team seed (idempotent)
- 0011_sidebar_seed.sql – additional sidebar examples (projects/drafts/definitions)

Recommended apply sequences
- Development: 0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → 0011
- Production: 0001 → 0002 → 0003 → 0004 → 0006 → 0007 → 0008 → 0009 → 0010 (then 0011 if needed)

## How to Apply

- Supabase SQL Editor: open each file and run top-to-bottom.
- psql (example):
  - `psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql`
  - Repeat for the rest in order.

## Auth & RLS Notes

- API requires: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server writes may use `SUPABASE_SERVICE_ROLE_KEY` (development only).
- To enforce JWT on app routes set `SUPABASE_REQUIRE_JWT=true` and ensure clients send `Authorization: Bearer <token>`.
- Org-based RLS (0009) expects `org_id` in JWT claims; configure your Auth provider to inject it.

## Realtime

- The app subscribes to Postgres changes for `messages` and sidebar tables. Ensure Realtime is enabled for your project.

## Troubleshooting

- If a seed fails due to missing columns/tables, re-run the earlier schema files first.
- All seeds are idempotent (`on conflict do nothing` / `if not exists`).
