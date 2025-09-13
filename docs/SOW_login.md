# SOW v2.0: ゲストログイン機能の安全化・共通ガード導入

## 目的（更新）
- 体験は維持（未ログイン解消＋ゲスト1クリック）。
- セキュリティ・拡張性・保守性を引き上げる（サーバー経由のゲストサインイン、middleware での共通保護、最小特権化を前提に運用）。

## 要件（変わらず）
- 一般ユーザー権限のゲストアカウント：
  - ID: `user+1750772130206@example.com`
  - Password: `RegularUser2024!@#`
- ログイン画面を新設し、未ログイン時は自動で遷移。
- 画面上でログアウト可能。

## セキュリティ・設計方針（追加）
- ゲスト資格情報はクライアントに一切埋め込まない（Server Action 使用）。
- ルーティング保護は middleware で一元管理し、SSR 時点で確定判定＝ちらつき回避。
- 将来的な RLS の最小特権（閲覧のみ・テナント制限）を前提に、DB 側で拒否を徹底（提案）。

## 実装概要（v2.0）
- 追加ファイル
  - `app/login/actions.ts`：Server Action。`DEMO_GUEST_EMAIL` / `DEMO_GUEST_PASSWORD` を用い、`@supabase/auth-helpers-nextjs` でサーバー側サインインし Cookie を設定。
  - `middleware.ts`：共通ルーティング保護。未ログインの保護パスアクセスを `/login?redirect=...` に統一。
- 既存改修
  - `app/login/page.tsx`：Server Component 化。SSR でセッション判定し、ログイン済みは intended URL（`redirect`）または `/` に即リダイレクト。
  - `components/login-form.tsx`：ゲストログインは Server Action 呼び出しに変更（クライアントにID/PWを出さない）。
  - `app/page.tsx`：クライアント側のリダイレクト効果を撤去（middleware/SSR に一本化）。
- 依存
  - `@supabase/auth-helpers-nextjs` を追加。

## DB 変更（RLS 追補）
- 追加: `supabase/migrations/0012_guest_rls.sql`
  - `public.is_guest()` 関数を追加（JWT の email がゲストか判定）。
  - `projects`, `drafts`, `definitions`, `members`, `project_members`, `issues` の insert/update/delete を「非ゲストのみ許可」に再作成。
  - `workflows`, `workflow_stages`, `messages`, `manifests` の insert を「既存の org 条件 AND 非ゲスト」に再作成。
  - select は現状の方針を維持（閲覧可）。

## 追加/変更ファイル一覧
- `app/login/actions.ts`（新規）：サーバー経由ゲストサインイン。
- `middleware.ts`（新規）：共通ガード。
- `app/login/page.tsx`（変更）：SSR リダイレクト。
- `components/login-form.tsx`（変更）：Server Action 利用。二重送信防止に `useTransition`。
- `app/page.tsx`（変更）：クライアントガード撤去。
- `.env.local.sample`（変更）：`DEMO_GUEST_EMAIL` / `DEMO_GUEST_PASSWORD` を追記。

## 動作要件
- `.env.local` に以下を設定：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DEMO_GUEST_EMAIL`
  - `DEMO_GUEST_PASSWORD`
- ゲストユーザーが Supabase Auth に存在し、上記パスワードが設定済み。

## 確認手順（更新後）
1. `pnpm dev` で起動。
2. 未ログインで `http://localhost:3000` → middleware により `/login?redirect=/` へ遷移。
3. ログイン画面で：
   - 「ゲストユーザーログイン」をクリック → Server Action が Cookie を設定 → intended URL（なければ `/`）へ遷移。
   - またはメール/パスワードを手入力 → 「ログイン」。
4. 画面の「ログアウト」でサインアウト → `/login` に戻る。

5. RLS（任意）
   - ゲストでプロジェクト作成やドラフト作成が失敗する（書き込み拒否）こと。
   - 一般ユーザーでは作成が成功すること。

## 改善提案（次段）
- RLS の最小特権化（例：閲覧のみ、テナント縛り）
  - 例：`messages` を `select` のみ許可＋`tenant_id` による制限。
- レート制限と監査
  - `/login`（ゲスト）を IP 単位 5req/min などで制限（Upstash/Redis など）。
  - Server Action 内で簡易監査ログを出力（本番は APM 連携）。
- UX
  - `redirect` クエリを必ず尊重。
  - エラー文言のローカライズ、ボタンの処理中状態、`router.refresh()` での即時反映。

## 受け入れ基準（追加）
- クライアントバンドルにゲストの ID/PW が含まれない。
- 未ログインで保護パスへアクセスした場合、サーバー側で `/login` へ遷移する。
- ゲスト 1 クリックでログインが成功し、 intended URL に到達できる。
