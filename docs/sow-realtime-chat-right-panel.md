# SOW: チャット出力の右パネルリアルタイム表示

## 目的
- チャット画面のアシスタント出力を右側パネルへ遅延少なくリアルタイム表示する。
- 単一タブの即時反映（ローカル状態）と、複数タブ/別端末同期（Supabase Realtime）の両立。

## 対象範囲
- クライアント: `components/chat-interface.tsx`, `components/output-panels.tsx`
- 状態管理: 新規 `hooks/use-chat-store.ts`（Zustand もしくは軽量 Context）
- サーバAPI: `app/api/chat/route.ts`（AI SDK ストリーミング対応）
- 同期: `messages` テーブル（Supabase Realtime 購読）

## 要件
- リアルタイム性: 入力→右パネル反映まで体感即時（初回<200ms、逐次更新）。
- 同期性: 
  - 同一タブ: ローカルストアで即時更新。
  - 複数タブ/別端末: Realtime の INSERT で追従（自タブ発火分は去重）。
- 冪等性/再現性: リロード時に最後の状態復元（DB/ローカル履歴）。
- 安全性: 機密値を出さない。既存 RLS/ポリシーに準拠。
- 品質ゲート: `pnpm test:all`（lint/type-check/contract）通過。

## アーキテクチャ概要
- サーバ（ストリーミング）
  - `app/api/chat/route.ts` を Fetch streaming/SSE に対応。AI SDK の `streamText` を利用しトークン毎に出力。
  - 完了時に `messages` へ最終メッセージを INSERT。
- クライアント（受信/表示）
  - `components/chat-interface.tsx` がストリームを受信し、`useChatStore` にチャンクを `appendPartial`。
  - `components/output-panels.tsx` がストアを購読し、右パネルに「Live」領域で逐次描画。
- 同期（任意/推奨）
  - `public.messages` の Realtime INSERT を購読。自タブ発火分は ID 去重。履歴の補完も実施。

## 実装タスク
1) ストア/型の追加（`hooks/use-chat-store.ts`）
- state: `messages: { id:string; role:'user'|'assistant'; content:string; streaming?:boolean }[]`
- actions: `addUserMessage()`, `appendPartial(id, chunk)`, `commitMessage(id)`, `reset()`
- セレクタ: 右パネル用に `liveAssistantMessage` 提供。

2) API ストリーミング化（`app/api/chat/route.ts`）
- `streamText` で ReadableStream を返し、`data: { delta: '...' }` 形式で送出。
- 完了時 `{ done: true }` と同時に DB へ INSERT（既存 RLS に準拠）。

3) クライアント受信と右パネル連動
- 送信時に楽観追加（user メッセージ）。
- 受信中は `appendPartial` で右パネルに逐次反映、完了で `commitMessage`。
- エラー時は中断表示/リトライ導線。

4) Realtime 購読（任意/推奨）
- `lib/realtime.ts` 新設。`public.messages` の INSERT を購読し、別タブ同期。
- 自タブ発火分は ID 去重。欠落時は補完フェッチ。

5) 非機能/安定化
- レンダ負荷対策: requestAnimationFrame 単位で描画（30–60fps）にスロットリング。
- 切断復旧: AbortController/再接続・手動リトライ。
- アクセシビリティ: ライブリージョン、コピー、スクロール追従/固定切替。
- 設定スイッチ: 右パネル「Live」ON/OFF。

6) 品質ゲート/契約テスト
- `pnpm lint`（ESLint）
- `pnpm type-check`（API/Lib/Hooks の構文＆型）
- `pnpm contract`（UI–DB 契約スナップショット: messages への書込列整合）
- CI: `.github/workflows/ci.yml` の `pnpm test:all` で自動実行。

## 受け入れ基準
- 送信後 <200ms で右パネルに最初のトークンが表示。
- ストリームに合わせて右パネルが逐次更新。
- 別タブで同セッションを開くと、メッセージ確定後に数秒で同期。
- 再読込後も最新メッセージが復元。
- 通信中断→再試行で復旧、UI フリーズなし。
- `pnpm test:all` が成功。

## スケジュール目安
- Day 1: 設計/ストア/API ストリーム骨組み。
- Day 2: クライアント受信・右パネル実装・スロットリング。
- Day 3: Realtime 購読・復元・去重/エラー処理。
- Day 4: 仕上げ（アクセシビリティ/文言/ドキュメント）。
- Day 5: 最終レビュー・軽微リファクタ。

## リスクと緩和策
- 文字列結合負荷: バッファ連結＋描画スロットリング。
- 切断/遅延: 再接続/リトライ・段階的バックオフ。
- RLS/ポリシー: 開発用は緩く、本番は org_id ベースへ切替可能（`current_org_id()`）。
- ブラウザ差異: Fetch streaming 不可環境は SSE/WebSocket フォールバック検討。

## 変更ファイル（想定）
- 追加: `hooks/use-chat-store.ts`, `lib/realtime.ts`
- 変更: `app/api/chat/route.ts`, `components/chat-interface.tsx`, `components/output-panels.tsx`
- 契約/CI: 既存フロー（`pnpm test:all`）維持。

