# Repository Guidelines

## Project Structure & Module Organization
- `app/` Next.js App Router (pages, `layout.tsx`, API routes in `app/api/*`).
- `components/` UI and feature components (kebab-case filenames; exported components in PascalCase). `components/ui/` holds design system parts.
- `hooks/` React hooks (e.g., `use-workflow.ts`, exported as `useWorkflow`).
- `lib/` Non-UI logic (e.g., `workflow-engine.ts` orchestrates stages and API calls).
- `public/` static assets. `styles/` global styles (Tailwind CSS). Config: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`.

## Build, Test, and Development Commands
- `pnpm i` Install dependencies.
- `pnpm dev` Run the Next.js dev server.
- `pnpm build` Create a production build.
- `pnpm start` Start the production server (after build).
- `pnpm lint` Run ESLint via `next lint`.

## Coding Style & Naming Conventions
- Language: TypeScript, strict mode enabled. Imports use `@/*` alias.
- Components: PascalCase exports; files kebab-case (`components/chat-interface.tsx`).
- Hooks: `use-<name>.ts`, exported as `use<Name>`.
- Utilities: in `lib/`; prefer named exports; camelCase identifiers.
- Formatting/Linting: Follow ESLint (Next.js) rules; 2-space indentation; run `pnpm lint --fix` before committing.
- Styling: Tailwind CSS; prefer utility classes over inline styles.

## Testing Guidelines
- No test runner is configured yet. If adding tests:
  - Unit: Jest/Vitest + React Testing Library; files `*.test.ts(x)` colocated or in `__tests__/`.
  - E2E: Playwright; add `e2e/` and a `pnpm test:e2e` script.
  - Keep fast, deterministic tests; include minimal fixtures.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (`feat:`, `fix:`, `chore:`). Example: `feat: add pain analysis panel`.
- PRs: Provide a clear summary, linked issues, screenshots for UI, and testing notes. Keep PRs focused and small.

## Security & Configuration Tips
- Secrets: Never commit them. Use `.env.local` (gitignored). Example: `OPENAI_API_KEY=...`. Client-exposed vars must start with `NEXT_PUBLIC_`.
- Network calls: Server routes under `app/api/*` call OpenAI; validate inputs and handle errors.

## Architecture Overview
- Workflow is orchestrated in `lib/workflow-engine.ts` with stages that call API routes (`app/api/workflow/*`).
- UI is composed from `components/*`, driven by hooks from `hooks/*` and typed via `tsconfig.json`.
