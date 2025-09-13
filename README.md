# AI Agent Manager (Next.js)

AIエージェント設計〜デプロイ準備までを支援するワークフロー型Webアプリです。Pain分析 → ソリューション設計 → エージェント生成 → マニフェスト生成 → デプロイ準備を段階的に実行し、Supabaseで永続化・Realtime反映します。

## Tech Stack
- Next.js 14 (App Router) / TypeScript / Tailwind CSS / Radix UI
- Supabase (Postgres + Realtime) 持続化・購読
- AI SDK (`@ai-sdk/openai`) for schema-based generation

## Features
- ワークフロー実行: Pain → Solution → Agent → Manifest → Deploy準備
- チャット履歴の保存とリアルタイム反映
- Sidebar: Projects / Drafts / 最近の定義 をSupabaseから動的取得（インライン「追加」で作成可）
- プロジェクト管理: Projects/Issues/Teams を動的取得、Realtimeで更新、検索/フィルタ、簡易分析（総数/完了/平均進捗）
- 新規課題フロー: Draftsへ自動保存（デバウンス）

## Quick Start
1) 依存関係をインストール: `pnpm i`
2) `.env.local` を作成し環境変数を設定
3) Supabaseにマイグレーションを適用（SQLエディタ等で `supabase/migrations/*.sql` を上から順に適用）
4) Realtime を有効化し、対象テーブルを publication に追加
5) 開発サーバー起動: `pnpm dev` → http://localhost:3000

## Scripts
- `pnpm dev` 開発サーバー起動
- `pnpm build` 本番ビルド
- `pnpm start` 本番サーバー起動（要ビルド）
- `pnpm lint` Lint 実行

## Project Structure
- `app/` App Router。UIレイアウト（`layout.tsx`）と API ルート（`app/api/*`）。
  - `app/api/chat/route.ts` OpenAI ストリーミング中継
  - `app/api/workflow/*` 各ステージの実処理
  - `app/api/projects|issues|drafts|definitions|members|project-members` Supabase CRUD（REST連携）
- `components/` UI・機能コンポーネント（`components/ui` はデザインシステム）
  - `sidebar.tsx` Supabaseから動的取得＋インライン作成
  - `project-management.tsx` Projects/Issues/Teams の表示・フィルタ・Realtime対応
  - `new-issue-flow.tsx` Drafts自動保存
- `hooks/` React Hooks（`use-workflow.ts`、`use-supabase-sidebar.ts`）
- `lib/` 非UIロジック（`workflow-engine.ts`、`supabase.ts`）
- `supabase/migrations/` SQLマイグレーションとシード

## Environment
`.env.local` に以下を設定（Vercelでも同名で設定）
- OpenAI
  - `OPENAI_API_KEY=sk-...`
- Supabase
  - `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`（任意：サーバー側での管理操作用）

## Supabase Setup
- マイグレーション適用
  - `supabase/migrations/` 内のファイルを番号順に適用（初期スキーマ、Sidebar用テーブル、Projects/Issues、Members/ProjectMembers、Seed、RLS、Security hardening など）
- Realtime 有効化
  - Publication に必要テーブルを追加（例）
    - `ALTER PUBLICATION supabase_realtime ADD TABLE public.projects, public.issues, public.members, public.project_members, public.drafts, public.definitions, public.workflows, public.workflow_stages, public.manifests, public.messages;`
- RLS（開発向け）
  - リポジトリのRLS系マイグレーションで基本ポリシーを作成済みです。必要に応じて本番向けに厳格化してください。

## API Endpoints（抜粋）
- Projects: `GET/POST /api/projects`, `PATCH/DELETE /api/projects/:id`
- Issues: `GET/POST /api/issues`, `PATCH/DELETE /api/issues/:id`
- Drafts: `GET/POST /api/drafts`, `PATCH/DELETE /api/drafts/:id`
- Definitions: `GET/POST /api/definitions`, `PATCH/DELETE /api/definitions/:id`
- Members: `GET/POST /api/members`, `PATCH/DELETE /api/members/:id`
- ProjectMembers: `POST/DELETE /api/project-members`
- Chat: `POST /api/messages`, `POST /api/chat`
- Workflow: `POST /api/workflows`, `POST /api/workflow/*`

## Notes
- Sidebar/Project管理はSupabaseのシードデータを初期表示として参照し、Realtimeで即反映されます。
- Chat/Workflow/ManifestsはDBに永続化（必要に応じてサービスロールキーを使用）。
- フォント取得にネットワーク制限がある環境では `next/font/local` への切替を検討してください。
