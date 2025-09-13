# AI Agent Manager (Next.js)

AIエージェント設計〜デプロイ準備までを支援するワークフロー型Webアプリです。Pain分析 → ソリューション設計 → エージェント生成 → マニフェスト生成 → デプロイ準備を段階的に実行します。

## Tech Stack
- Next.js 14 (App Router) / TypeScript / Tailwind CSS / Radix UI
- AI SDK (`@ai-sdk/openai`) for schema-based generation

## Quick Start
1. 依存関係をインストール: `pnpm i`
2. 環境変数を設定: `.env.local.sample` を `.env.local` にコピーして値を入れる
   - 必須: `OPENAI_API_KEY=sk-...`
3. 開発サーバー起動: `pnpm dev` → http://localhost:3000

## Scripts
- `pnpm dev` 開発サーバー起動
- `pnpm build` 本番ビルド
- `pnpm start` 本番サーバー起動（要ビルド）
- `pnpm lint` ESLint 実行（Next.js ルール）

## Project Structure
- `app/` App Router。UIレイアウト（`layout.tsx`）と API ルート（`app/api/*`）。
  - `app/api/chat/route.ts` OpenAI へのストリーミングチャット中継（`OPENAI_API_KEY` 必須）
  - `app/api/workflow/*` Pain/ソリューション/エージェント/マニフェスト各処理
- `components/` UI・機能コンポーネント（`components/ui` はデザインシステム）
- `hooks/` React Hooks（`use-workflow.ts` でワークフロー状態管理）
- `lib/` 非UIロジック（`workflow-engine.ts` が各ステージを順次実行）
- `public/` 静的アセット、`styles/` グローバルスタイル

## Architecture
- クライアント: `components/*` + `hooks/use-workflow.ts` がUIと状態を管理
- オーケストレーション: `lib/workflow-engine.ts` が各APIルートを順に呼び出し
- サーバー: `app/api/*` がOpenAI APIや生成処理を実行

## Environment
- `.env.local` に `OPENAI_API_KEY` を設定（Git管理外）。例:
  ```bash
  OPENAI_API_KEY=sk-your-openai-key
  ```

### Supabase (Remote)
- Supabase ダッシュボード → Project Settings → API から以下を取得し `.env.local` に設定:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
  # Server only (任意): 管理処理に利用
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  # 任意: 直接DB接続に利用（Settings → Database → Connection string）
  SUPABASE_DB_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
  ```
- クライアント用途は anon key、サーバー用途は service role key を使用してください。キーはVercelの環境変数にも設定します。

## Deploy
- Vercel 推奨。環境変数 `OPENAI_API_KEY` をプロジェクトに設定し、通常の Next.js デプロイ手順に従ってください。
  - Supabaseを利用する場合は `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`（必要に応じて `SUPABASE_SERVICE_ROLE_KEY`）もVercelに設定してください。
