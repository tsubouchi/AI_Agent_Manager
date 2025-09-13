## SOW v2.0: Live/Realtime 無限更新ループの恒久対策

### 目的
- 「Maximum update depth exceeded」を恒久的に防止し、Live 出力（useSyncExternalStore）/ Tabs 切替 / Supabase Realtime 連携が相互に再帰更新を誘発しない設計へ強化する。

### 対象
- Components: `components/output-panels.tsx`, `components/chat-interface.tsx`
- Hooks/Store: `hooks/use-chat-store.ts`
- （必要に応じて）Tabs の使用箇所

### 根本原因（再確認）
- Live 出力の外部ストア購読・Tabs の state 更新・Realtime のメッセージ反映が相互に連鎖し、同一値再設定や高頻度 emit により深い更新が蓄積→React が無限更新と判定。

---

## 改善提案（実装レベル）

1) useSyncExternalStore の「スナップショット同一性」を厳守（最重要）
- 変更がない限り同一参照を返す。新規オブジェクト生成（例: `{ ...state }`）は避ける。
- emit は「実際に差分があるときのみ」。

最小コード例（hooks/use-chat-store.ts）
```ts
type ChatLiveState = { assistantId: string|null; assistantText: string; streaming: boolean; sessionId: string|null };
let current: ChatLiveState = { assistantId: null, assistantText: "", streaming: false, sessionId: null };
const listeners = new Set<() => void>();

function emit(next: ChatLiveState) {
  if (Object.is(next, current)) return;                // 参照同一なら何もしない
  if (next.assistantId === current.assistantId &&      // 内容同一（任意の浅比較）
      next.assistantText === current.assistantText &&
      next.streaming === current.streaming &&
      next.sessionId === current.sessionId) return;
  current = next;
  listeners.forEach(l => l());
}

export const chatLiveStore = {
  getSnapshot: () => current,
  subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); },
  start(id: string, sessionId: string) { emit({ assistantId: id, assistantText: "", streaming: true, sessionId }); },
  appendDelta(delta: string) { if (!current.streaming || !delta) return; emit({ ...current, assistantText: current.assistantText + delta }); },
  commit() { if (!current.streaming) return; emit({ ...current, streaming: false }); },
};

export function useChatLive(enabled = true) {
  const sub = enabled ? chatLiveStore.subscribe : (() => () => {});
  const get = enabled ? chatLiveStore.getSnapshot : () => ({ assistantId: null, assistantText: "", streaming: false, sessionId: null });
  return useSyncExternalStore(sub, get, get);
}
```

チェックリスト
- [ ] getSnapshot は不変時に同一参照を返す
- [ ] emit は差分時のみ通知
- [ ] 無効時 useChatLive は no-op で購読しない

2) Live 購読の「条件付き有効化」を 1 か所に集約
- 条件: `activeTab==='live' && live.streaming===true` の両方を満たす時だけ購読。
- 切替時は必ず unsubscribe 実行（クリーンアップ）。

例（components/output-panels.tsx）
```ts
const live = useChatLive(activeTab === 'live' && live.streaming);
// enabled を式で渡さず、useEffect で rising 条件を管理する実装でも可（双方は併用しない）。
```

チェックリスト
- [ ] live 非表示 or streaming=false で購読停止
- [ ] クリーンアップで unsubscribe が必ず呼ばれる

3) 「1 回だけ自動タブ切替」をセッション単位へ
- `sessionId` を導入し、同一セッション内では 1 回のみ Live へ切替。

例
```ts
const switchedFor = useRef<string|null>(null);
useEffect(() => {
  if (!live.streaming || !live.sessionId) return;
  if (switchedFor.current === live.sessionId) return;
  startTransition(() => setActiveTab(prev => prev === 'live' ? prev : 'live'));
  switchedFor.current = live.sessionId;
}, [live.streaming, live.sessionId]);
```

チェックリスト
- [ ] 同一 sessionId で 2 回目以降は切替しない
- [ ] setActiveTab は関数 setter + 同値ガード

4) Realtime ハンドラの単一ソース化 + バッチ
- 「本文ストリーミング」は Live パイプラインのみ。
- Realtime は「確定メッセージ／他クライアント」のみ追加。self-echo は client_tag と ignoreUntilTs で抑止。
- 可能なら startTransition/unstable_batchedUpdates で 1 イベント 1 描画。

例（擬似）
```ts
const seen = new Set<string>();
const ignoreUntilTs = useRef(0);
channel.on('postgres_changes', { event: 'INSERT', table: 'messages' }, ({ new: msg }) => {
  if (!msg?.id || seen.has(msg.id)) return;
  if (msg.client_tag === myClientTag && Date.now() < ignoreUntilTs.current) return;
  seen.add(msg.id);
  startTransition(() => appendMessage(msg));
});

function onLocalSend(messageId: string) {
  ignoreUntilTs.current = Date.now() + 1500; // 自己反映スキップ窓
  seen.add(messageId);
}
```

チェックリスト
- [ ] id 既存/自己反映スキップの 2 ガード
- [ ] Realtime で live store を操作しない

5) RAF バッチは「変化がある時だけ emit」
- `appendDelta` は空文字・同値時を無視。`flush` 再入ガードを追加。

チェックリスト
- [ ] flush 中に再入しない
- [ ] 末尾 emit は 1 回だけ

6) Tabs / State 等価ガードの徹底
- `setActiveTab(prev => prev===next ? prev : next)` を徹底し、同値再設定を防ぐ。
- useEffect が自ら更新する state へ依存しない（信号を分離）。

7) Concurrent Rendering / Tearing 対策
- 外部ストア値は useSyncExternalStore から直接読む。派生値は useMemo で入力量のみ依存。

---

## 受け入れ基準（SLO）
1. Live 非アクティブ時の再描画 ≦ 1fps 相当（目視 + profiler）
2. 最大更新深度エラー 0 件（ストリーミング/タブ切替/Realtime）
3. Realtime 模擬 10,000 件で重複挿入 0%
4. Live 非アクティブ時 CPU 平均 < 3%（M シリーズ相当）
5. 連続 10 分配信でメモリ変動 ±5% 以内

---

## テスト計画（抜粋）
- 単体
  - getSnapshot: 変更なしで参照同一（=== true）
  - flush 再入防止（2 連打で emit 1 回）
- 結合（JSDOM + 実時間/フェイクタイマー）
  - rising edge で Live 自動切替が sessionId につき 1 回
  - Realtime 1,000 件で重複なし & 描画回数がイベント数 ≫ 少ない
- E2E（Playwright）
  - 別クライアントから挿入 → 表示 1 件、タブ切替は 1 回のみ

---

## ロールアウト/監視
- Feature flag: `live_store_v2` で段階適用、問題時は即ロールバック
- Observability: `performance.mark/measure` と `console.count('render:<Comp>')`（本番無効）
- 依存更新（任意）: Next/React の最新パッチ適用検討

---

## タスク一覧（チェックリスト）
- [ ] chatLiveStore: 参照同一スナップショット/差分時のみ emit
- [ ] useChatLive(enabled): 無効時 no-op 購読
- [ ] OutputPanels: `activeTab==='live' && live.streaming` のみ購読、sessionId で 1 回切替
- [ ] ChatInterface Realtime: 自己反映/重複スキップ、live store 非操作
- [ ] RAF バッチ: 再入防止・末尾 emit 1 回
- [ ] プロファイル/SLO 検証の計測コードを一時導入

