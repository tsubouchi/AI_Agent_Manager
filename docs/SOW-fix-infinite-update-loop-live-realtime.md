## Statement of Work (SOW): Fix Infinite Update Loop in Live Output/Realtime

### Objective
- Eliminate the “Maximum update depth exceeded” error by breaking feedback loops between the Live output store (useSyncExternalStore), Tabs state, and Supabase Realtime updates.

### Scope
- Components: `components/output-panels.tsx`, `components/chat-interface.tsx`
- Hooks: `hooks/use-chat-store.ts`
- Optional: Tabs usage patterns if needed

### Root Cause (Summary)
- Live tab auto‑switch + continuous store emissions (RAF/flush) + Tabs state updates can chain into a render loop (React flags deep nested updates).
- Realtime INSERT handler and Live store updates can interleave, amplifying render churn.

### Approach
1) Live Store Subscription Hardening
- Subscribe only when BOTH: `activeTab === 'live' && live.streaming === true`.
- Teardown on `streaming=false` or tab change. Provide no‑op subscribe/snapshot when disabled.

2) One‑Time Auto‑Switch (Rising Edge Only)
- Keep `prevStreaming` ref; if `!prev && live.streaming`, run `setActiveTab('live')`. Guard against same‑value updates with function setter.

3) Realtime Insert Guardrails
- In ChatInterface Realtime handler:
  - Skip if message `id` already exists.
  - Skip self‑echo right after sending via `ignoreRealtimeRef` window.
  - Do not call `chatLiveStore` from Realtime handler (live updates stay in stream pipeline).

4) Live Store Emission Hygiene
- Keep RAF batching (appendDelta → RAF → flush). Ensure `emit()` only on actual change. Provide SSR/disabled snapshots.

5) Tabs/State Interaction
- Use function‑style setters with equality guards. Avoid effects that depend on states they set (no circular deps).

### Verification
- Chat flow: send → stream deltas → auto‑switch once to Live → no loop.
- Realtime insert from another client does not loop or duplicate.
- Profiling: no runaway renders when Live tab inactive.

### Deliverables
- Patched: OutputPanels, ChatInterface, chat‑live store. Regression notes + test guide.

### Acceptance Criteria
- No “Maximum update depth exceeded” in streaming, tab switching, or Realtime events.
- Live auto‑switch fires exactly once per stream start.
- No duplicate messages from Realtime echo.
- Stable CPU/render profile when Live tab inactive.

### Timeline
- Implementation: 0.5 day; Verification: 0.5 day.

### Risks & Mitigation
- Tabs internal re‑renders → equality guards + one‑time auto‑switch.
- Race at stream end → effect cleanup handles unsubscribe.
- Optional Next.js patch upgrade for effect consistency.

