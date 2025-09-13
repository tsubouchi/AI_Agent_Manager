# Repository Guidelines (Updated)

## Project Structure & Module Organization
- `app/` Next.js App Router (pages, `layout.tsx`, API routes in `app/api/*`).
- `components/` UI and feature components (kebab-case filenames; exported components in PascalCase). `components/ui/` holds design system parts.
- `hooks/` React hooks (e.g., `use-workflow.ts`, exported as `useWorkflow`; `use-chat-store.ts` for chat live stream state).
- `lib/` Non-UI logic (e.g., `workflow-engine.ts` orchestrates stages and API calls).
- `contract/` UI–DB契約の抽出・検証スクリプト（`extract-db.js`, `extract-ui.js`, `run.js`）。
- `public/` static assets. `styles/` global styles (Tailwind CSS). Config: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`.
- `supabase/migrations/` SQL migrations（RLSや関数属性のハードニングを含む）。

## Build, Test, and Development Commands
- `pnpm i` 依存関係のインストール。
- `pnpm dev` Next.js 開発サーバ。
- `pnpm build` 本番ビルド。
- `pnpm start` 本番サーバ（ビルド後）。
- `pnpm lint` ESLint 実行。内部で `scripts/lint.js` を通して `next lint` を起動。
- `pnpm type-check` TypeScript チェック（`tsconfig.typecheck.json`）。API/Lib/Hooks に限定。
- `pnpm contract` UI–DB契約の抽出・検証（詳細は下記）。
- `pnpm test:all` `lint` → `type-check` → `contract` を順に実行。

## UI–DB Contract（契約ファースト）
- 目的: UIが期待する型とDBスキーマの不一致を早期検知。
- 出力:
  - `contract/db.json`（Supabase SQLから抽出）
  - `contract/ui.json`（Zod/RESTから自動抽出、失敗時は `lib/contracts/ui-contract.json` にフォールバック）
- 実行: `pnpm contract`
  - 差分があれば詳細を表示して失敗。Validなら `Contract Valid ✓` を出力。
- 注意:
  - `contract/*.json` は生成物。直接編集しない。
  - Zodの `.optional()` は「送信省略可」であって「null許容」ではない扱い。`.nullable()`/`.nullish()`のみ null 許容にマップ。

## Streaming Chat（右パネル Live 連動）
- API: `app/api/chat/route.ts` が OpenAIのストリームを中継し、`0:{json}\n` 形式で delta を返す。
- クライアント:
  - `components/chat-interface.tsx` がチャンク受信で `chatLiveStore.appendDelta(text)` を呼び、確定時に `commit()`。
  - `components/output-panels.tsx` に「Live」タブを追加。ストリーム開始で自動選択され、リアルタイム表示。
  - `hooks/use-chat-store.ts` は requestAnimationFrame で描画をスロットリング。
- Realtime（任意/推奨）:
  - Supabase Realtime を購読して別タブ/端末の INSERT を受信し、Liveに反映（自タブ分は去重）。

## Coding Style & Naming Conventions
- Language: TypeScript（strict）。Imports は `@/*` エイリアス。
- Components: PascalCase export; file は kebab-case（例: `components/chat-interface.tsx`）。
- Hooks: `use-<name>.ts`、export は `use<Name>`。
- Utilities: `lib/` に配置、named export 推奨、camelCase。
- Formatting/Linting: ESLint（Next.js）準拠、2-space インデント。コミット前に `pnpm lint --fix` 推奨。
- Styling: Tailwind CSS。ユーティリティクラスを優先。

## Testing Guidelines
- まだテストランナーは未導入。追加する場合:
  - Unit: Jest/Vitest + React Testing Library、`*.test.ts(x)` を同階層か `__tests__/` に配置。
  - E2E: Playwright、`e2e/` と `pnpm test:e2e` を追加。
  - 速く決定的なテスト、最小フィクスチャ。

## Commit & Pull Request Guidelines
- Conventional Commits を推奨（`feat:`, `fix:`, `chore:` など）。
- PR は小さく焦点を絞る。概要・関連Issue・UIのスクショ・検証手順を含める。

## Security & Configuration Tips
- Secrets はコミットしない。`.env.local` を利用。クライアント公開は `NEXT_PUBLIC_` で始める。
- RLS/ポリシー: `supabase/migrations` にて有効化・更新。既存ファイルを書き換えず、新規マイグレーションを追加する。
- API入力は Zod で検証し、エラーは適切にハンドリング。

## Architecture Overview
- ワークフローは `lib/workflow-engine.ts` が `app/api/workflow/*` を順に呼び出しオーケストレーション。
- UI は `components/*` で構成、`hooks/*` により駆動。型は `tsconfig.json` に基づく。
- CI: `.github/workflows/ci.yml` が `pnpm test:all` を実行（lint/type/contract）。
