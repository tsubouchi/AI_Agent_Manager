「ビジネス課題 → Pain分析 → ソリューション設計 → 実行エージェント（YAML Manifest）化 → 実行」までを一気通貫で行う定義駆動アプリの仕様書をまとめました。

Day1で動く最小プロトタイプを前提に、将来のCloud Run実行まで見据えています。



仕様書 v1.0（Day1到達版）

0. 概要
	•	目的: ビジネス課題からPainを体系的に分解し、対策（Solution）を設計。その対策をAI/自動化エージェント群としてYAML Manifestに落とし、検証→実行まで行う。
	•	成果:
	1.	課題・Pain・KPI・制約の知識ベース（DB）
	2.	Solution設計（タスク分解・入出力・SLA）
	3.	Agent Manifest (YAML)（役割・入出力・ツール・実行先）
	4.	実行プラン（DAG/依存関係・並列度・再試行）
	5.	Cloud Run 上で実行するAgentサービス（雛形）



1. ペルソナ & 想定ユースケース
	•	オーナー: 事業/部門責任者 … 課題定義＆KPI設定
	•	実務: PM/アナリスト … Pain分析・Solution構築・検証
	•	SRE/Platform: 実行環境の整備・監視・運用

代表ユースケース
	1.	課題登録 → Pain分析（定性/定量） → KPI設定
	2.	対策候補をブレイクダウン → Agent化（YAML） → 検証実行
	3.	実行DAGを作成 → スケジュール実行 → 成果KPI計測/ログ監査
	4.	重み・閾値・SLAをチューニング → 継続運用



2. 画面要件（主要UI）/ サンプルデータ込み（実際にはLLMが出力）

1) 

┌────────────────────────────────────────────────────────────────────────────────────────────┐
│  ▣ Logo                     │ Project: Internal Matching (tenant: Bonginkan)          [⋮] │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│   サイドバー（左 16–18rem）      │                 相談チャット（中央 最大幅 / 最優先）                        │  出力パネル（右 22–26rem） │
│────────────────────────────────┬───────────────────────────────────────────────────────────┬───────────────────────────│
│ [＋ 新規課題]                     │  🧠 コンサル型AI  (ctx: problem.yaml / personas / logs)                 │  ▸ 出力タブ                  │
│ Projects                        │  ────────────────────────────────────────────────────────────              │  [Pain] [Solution]           │
│  • Matching v1                  │  [System] まず課題の概要を教えてください…                                  │  [Agents] [Manifest] [CRun]  │
│  • SalesOps                     │                                                                           │  ─────────────────────────── │
│ Drafts                          │  チャットストリーム（スクロール領域: **min-height 52–60vh**）                 │  Pain(最新)                  │
│  • 未保存の課題                  │  ┌─────────────────────────────────────────────────────────────┐          │  ● 高重要度: 候補者可視化    │
│ 最近の定義                      │  │ user/system/assistant の吹き出しが大きく読みやすい行間                  │          影響KPI: 面談率…    │
│  • problem.yaml                 │  └─────────────────────────────────────────────────────────────┘          │  ○ 中重要度: 要件粒度…       │
│  • usecases.yaml                │                                                                           │  [詳説] [根拠] [→Solution]   │
│────────────────────────────────┼───────────────────────────────────────────────────────────┬───────────────────────────│
│ クイック操作                     │  〔固定ボトム入力バー：**超大型**〕                                         │  実行コントロール             │
│ [⇧⌘U インポート] [⌘K コマンド]   │  ┌─────────────────────────────────────────────────────────────┐          │  [Dry-run] [Run] [Deploy]    │
│                                  │  │  📎  🏷  [ モード: 分析/設計/要約 ▼ ]                                  │  ステータス: ●準備OK         │
│                                  │  │  **テキスト入力 (高さ: 10–14行 / 160–240px / 伸縮可 / AutoFocus)**     │                              │
│                                  │  │  ……………………………………………………………………………………………………………………… │                              │
│                                  │  │  ……………………………………………………………………………………………………………………… │                              │
│                                  │  └───────────────[ ↩ 送信 ]───[ 🧪 AI実行(解析→設計→出力) ]──────────────┘  │                              │
├────────────────────────────────┴───────────────────────────────────────────────────────────┴───────────────────────────┤
│ 〔ボトム固定：サンプル展示レール（全幅）〕                                                                                               │
│  Pain（カード横スクロール）:  ●P-001 可視化不足  ○P-002 粒度不整合  ○P-003 面談調整遅延  …    [すべて見る]                              │
│  Agents（チップ/カード横スクロール）:  resume-parser  |  skill-normalizer  |  matcher-core  |  fairness-review  …   [一括Manifest]     │
└────────────────────────────────────────────────────────────────────────────────────────────┘

	•	中央チャット最優先：
	•	ストリーム領域 min-height: 52–60vh、ボトム入力は10–14行相当（160–240px）で巨大化。
	•	入力は伸縮可（ドラッグで高さ変更）。送信バーは常時固定。
	•	ボトムのサンプルレール：常時見える“学習の手がかり”。クリックで右パネルの該当タブにフォーカス。
	•	右パネルは結果の“保管庫”。AI実行後はタブが自動で Pain→Solution→Agents→Manifest→CloudRunに順次遷移。



出力タブの中身（右パネル・要点のみ）

Pain
	•	大カード：タイトル／Severity／頻度／影響KPI／根拠（チャット#／添付ファイル）
	•	CTA：[→ Solution候補を展開]（押すと Solution タブにジャンプ）

Solution
	•	**DAGプレビュー（React Flow）**＋テーブル
	•	CTA：[🧩 選択タスクをAgent化]（Agentsタブへ）

Agents
	•	候補を複数選択→ [Manifest生成]（まとめて YAML 作成）

Manifest
	•	Monaco（YAML）＋検証結果（schema / SLA / PII / fairness）
	•	CTA：[Lint] [署名] [保存] [Dry-run] [→Cloud Run]

CloudRun
	•	ステップUI：構成生成→ビルド→デプロイ→登録→テスト実行
	•	直近のURLとメトリクスを表示

出力タブの中身（右パネル・要点のみ）

Pain
	•	大カード：タイトル／Severity／頻度／影響KPI／根拠（チャット#／添付ファイル）
	•	CTA：[→ Solution候補を展開]（押すと Solution タブにジャンプ）

Solution
	•	**DAGプレビュー（React Flow）**＋テーブル
	•	CTA：[🧩 選択タスクをAgent化]（Agentsタブへ）

Agents
	•	候補を複数選択→ [Manifest生成]（まとめて YAML 作成）

Manifest
	•	Monaco（YAML）＋検証結果（schema / SLA / PII / fairness）
	•	CTA：[Lint] [署名] [保存] [Dry-run] [→Cloud Run]

CloudRun
	•	ステップUI：構成生成→ビルド→デプロイ→登録→テスト実行
	•	直近のURLとメトリクスを表示



レイアウト仕様（実装メモ／Tailwind想定）
	•	3カラムグリッド：grid-cols-[18rem_minmax(720px,1fr)_24rem]
	•	チャットストリーム：min-h-[56vh] overflow-y-auto
	•	入力バー：sticky bottom-0 p-4 bg-background/80 backdrop-blur
	•	入力テキスト：min-h-[10rem] max-h-[22rem] resize-y text-lg leading-7
	•	サンプルレール（下部）：sticky bottom-0 border-t bg-background px-4 py-2 overflow-x-auto whitespace-nowrap

3) 主要インタラクション & キーボード
	•	Enter 送信 / Shift+Enter 改行
	•	Cmd+I 添付、Cmd+E AI実行、Cmd+M Manifest生成、Cmd+D Dry-run
	•	Painの行で →Solution を押すと Solutionタブへフォーカス＆関連タスクを展開
	•	Agentsで複数選択→まとめてManifest→Manifestタブで一括検証→Cloud Runタブへ

4) 画面-データ契約（最小）
// Chat message
type ChatTurn = { id:string; role:'user'|'assistant'|'system'; text:string; attachments?:FileRef[]; ts:number }

// Pain
type Pain = { id:string; title:string; severity:1|2|3|4|5; frequency:'low'|'mid'|'high'; impactKpis:string[]; evidence:string[] }

// SolutionTask
type Task = { id:string; title:string; inputs:string[]; outputs:string[]; dependsOn:string[] }

// AgentCandidate
type AgentCandidate = { id:string; name:string; role:string; io:{in:string[]; out:string[]} }

// Manifest (YAML text) + validation
type ManifestDoc = { name:string; version:string; yaml:string; valid:boolean; warnings:string[] }

5) 状態遷移（簡易）

[チャット蓄積] ──AI実行──▶ [抽出結果: Pain/Solution下書き] ─▶ [Agent候補生成]
       ▲                                                          │
       └────(追質問/修正) ◀────────[Manifest検証/編集]◀───────┘
                                                         │
                                            [Cloud Run登録/実行]

2.2 課題・Pain 設計（problem editor）

課題タイトル [__________]  対象組織/範囲 [__________]
現状(As-Is) / あるべき(To-Be)
Pain一覧 [+追加]
  - Pain名, 重要度(1-5), 発生頻度, 影響(KPI), 根本原因(仮説)
制約(セキュリティ/法令/運用)
KPI (leading/lagging), 目標値
[保存] [Solution候補を生成] [YAML表示/編集]

2.3 Solution 設計（分解/DAG）

Pain選択 → 対策タスク分解（並列/直列）
タスク名 / 入力 / 出力 / 依存 / 想定費用・時間
[自動分解(LLM)] [整形] [Agent化する] [DAGプレビュー]

2.4 Agent Manifest 設計（YAMLエディタ＋スキーマ検証）

左: YAMLエディタ(Monaco)     右: Zod検証 / 必須項目 / サンプル生成
[保存] [Lint] [署名/バージョン固定] [Cloud Runにデプロイ(後述)]

2.5 実行プラン（DAG/スケジュール）

DAGキャンバス: Agentノードをドラッグ&ドロップで接続
実行条件: 手動 / CRON / Webhook / しきい値超え時
再試行: 回数・バックオフ、SLA・SLO、ロールバック
[検証実行(dry-run)] [本実行]  [進行状況/ログ表示]

2.6 ログ/監査・説明可能性

実行ID / Agent別メトリクス / 失敗箇所 / リトライ履歴
入出力要約（PIIマスク）/ 重要特徴量 / 費用・時間 / KPI改善寄与

3. 機能要件

3.1 定義作成
	•	課題・Pain・KPI・制約をフォーム/YAMLで作成・保存
	•	LLM補助によるPain深掘り・原因仮説の生成（手動修正可）

3.2 Solution分解
	•	Pain→タスク分解（自動提案＋手動編集）
	•	タスク→Agent化（雛形生成：入出力、ツール、前提、SLA）

3.3 Agent Manifest 管理
	•	YAMLスキーマ検証（Zod）・Lint・署名（オプション）
	•	バージョニング（SemVer）・差分表示・ロールバック

3.4 実行
	•	DAG定義（有向非巡回）・並列度・再試行・タイムアウト
	•	実行エンジン：Day1は擬似実行（ローカル/Edge Runtime）
後続で Cloud Run の実エージェントをRESTで起動

3.5 計測＆監査
	•	各AgentのSLA/SLO・実行時間・エラー率
	•	入出力サマリ・費用推定（API/トークン/時間）
	•	説明可能性（重要特徴量・根拠・閾値）

4. 非機能要件（抜粋）
	•	セキュリティ: Supabase Auth + RLS、PIIマスク、署名付きYAML
	•	可用性: Cloud Run でローリング、ヘルスチェック
	•	観測性: OpenTelemetry/Cloud Logging、分散トレース
	•	コンプライアンス: 実行監査ログ、変更履歴の永続化
	•	フェアネス: バイアス警告（辞書/ルールでスコア寄与を制限）


5. データモデル（最小・Supabase）

-- 課題・Pain
create table problems (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null,
  scope text,
  yaml jsonb not null,           -- problem.yaml（As-Is/To-Be/Pain/KPI/制約）
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Solution（タスク分解/DAG）
create table solutions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid references problems(id),
  yaml jsonb not null,           -- tasks[], dag{nodes,edges}
  version int default 1,
  created_at timestamptz default now()
);

-- Agent Manifest（YAML）
create table agent_manifests (
  id uuid primary key default gen_random_uuid(),
  solution_id uuid references solutions(id),
  name text not null,
  version text not null,         -- e.g. "1.0.0"
  yaml jsonb not null,           -- Agent YAML
  signed bool default false,
  created_at timestamptz default now()
);

-- 実行プラン & 実行ログ
create table executions (
  id uuid primary key default gen_random_uuid(),
  solution_id uuid references solutions(id),
  plan jsonb not null,           -- 実行時DAG/並列度/再試行
  status text not null default 'created', -- running/succeeded/failed
  started_at timestamptz,
  finished_at timestamptz,
  metrics jsonb,                 -- SLA/SLO/費用/特徴量寄与など
  logs jsonb                     -- Agent単位のログ要約（PIIマスク済）
);

RLS: owner_id = auth.uid() を基本。チーム共有は後日ロール/テナント導入。



6. Agent Manifest（YAMLスキーマ案）

6.1 概念
	•	agent: 1つの自律的機能（推論/抽出/呼び出し/ETL/通知など）
	•	contract: 入力/出力の型契約（Zod相当）
	•	tools: 外部APIやDBアクセス、関数呼出し
	•	policies: SLA、リトライ、PII、バイアス、承認フロー
	•	runtime: 実行先（Cloud Run/Edge）、リソース/環境変数
	•	observability: ログ/トレース/メトリクスの出力先

6.2 YAML 例（最小）

apiVersion: v1
kind: Agent
metadata:
  name: "pain-root-cause-analyzer"
  version: "1.0.0"
  owner: "hr-analytics"
spec:
  role: "Painの根本原因仮説を抽出し、指標と紐付ける"
  inputs:
    - name: problem_yaml
      schema: "#/schemas/Problem"   # 参照（後述スキーマ集）
    - name: telemetry
      schema: "#/schemas/Telemetry"
  outputs:
    - name: hypotheses
      schema: "#/schemas/Hypotheses"
  tools:
    - name: "llm"
      type: "openai"
      params:
        model: "gpt-4o-mini"
        temperature: 0.2
    - name: "metrics_store"
      type: "supabase"
      params:
        table: "analytics_events"
  policies:
    sla:
      timeout_sec: 60
      retries: 2
      backoff: "exponential"
    pii:
      mask: ["email", "name"]
    fairness:
      deny_features: ["age", "gender"]
  runtime:
    type: "cloud-run"
    image: "asia-northeast1-docker.pkg.dev/project/agents/pain-analyzer:1.0.0"
    env:
      - "SUPABASE_URL"
      - "SUPABASE_SERVICE_ROLE_KEY"
      - "OPENAI_API_KEY"
  observability:
    tracing: true
    log_level: "info"

6.3 スキーマ束（抜粋・YAML）

schemas:
  Problem:
    type: object
    required: [title, pains, kpis]
    properties:
      title: { type: string }
      pains:
        type: array
        items:
          type: object
          required: [name, severity, impact_kpis]
          properties:
            name: { type: string }
            severity: { type: integer, minimum: 1, maximum: 5 }
            frequency: { type: string }
            impact_kpis: { type: array, items: { type: string } }
      kpis:
        type: object
        properties:
          leading: { type: array, items: { type: string } }
          lagging: { type: array, items: { type: string } }

  Telemetry:
    type: object
    properties:
      events: { type: array, items: { type: object } }

  Hypotheses:
    type: array
    items:
      type: object
      properties:
        hypothesis: { type: string }
        evidence: { type: array, items: { type: string } }
        confidence: { type: number, minimum: 0, maximum: 1 }

7. API（最小）
	•	POST /api/problems … 課題YAMLを保存（Zod検証）
	•	POST /api/solutions/generate … Pain→タスク自動分解（LLM補助）
	•	POST /api/agents/manifest/lint … YAML Lint + スキーマ検証
	•	POST /api/executions/dry-run … DAG/Agentを擬似実行（I/Oモック）
	•	POST /api/executions/run … 実行（Cloud Run呼び出し、Day1はスタブ）
	•	GET  /api/executions/:id/logs … 実行ログ（マスク済み要約）



8. アーキテクチャ

[Vercel] Next.js (App Router)
  ├─ UI: Problem/Pain/Solution/Agent/DAG/Logs
  ├─ API Routes (Day1: 擬似実行, LLM補助)
  └─ Supabase JS (Auth, RLS)
[Supabase] Auth / Postgres / Storage
[Cloud Run]  (Day2+ 実行)
  ├─ agent-runner (共通ランタイム: manifest受取→実行→計測)
  └─ agents/*    (用途別サービス: analyzer, planner, executor, notifier)
[Observability] Cloud Logging + OpenTelemetry

実行モデル（将来）
	•	Next.js → agent-runner に Manifest と引数をPOST
	•	runner は コンテナ化Agent or 関数呼出しを実行
	•	入出力とメトリクスを executions.logs/metrics に記録



9. Day1 開発スコープ（3.5〜4h想定）
	1.	画面:
	•	課題/Painフォーム、Solution分解（テキスト→リスト）、Agent YAMLエディタ、DAGプレビュー（静的）
	2.	DB: problems/solutions/agent_manifests/executions（SQL最小）
	3.	検証: YAML Lint + Zodスキーマ検証
	4.	擬似実行: /api/executions/dry-run が、Manifestのinputs/outputsをチェック→ダミー結果返却
	5.	デプロイ: Vercel Preview / Supabase接続

Cloud Run実行はDay2以降: agent-runner雛形とDockerfileを渡しておく（下記）。



10. Cloud Run 実行雛形（agent-runner）

Dockerfile（Node/TS例）

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["node","dist/server.js"]

server.ts（概念）

import fastify from 'fastify'
import { validateManifest, runAgent } from './runner'

const app = fastify()

app.post('/run', async (req, rep) => {
  const { manifest, payload } = req.body as any
  const v = validateManifest(manifest) // Zod/JSONSchema
  if (!v.ok) return rep.code(400).send({ error: v.errors })

  const result = await runAgent(manifest, payload) // tool呼出し/LLM/DB
  return rep.send({ result, metrics: { elapsed_ms: 123, retries: 0 } })
})

app.listen({ port: Number(process.env.PORT||8080), host:'0.0.0.0' })

runAgent（疑似）

export async function runAgent(m: AgentManifest, payload: any){
  // inputs型チェック → tools解決 → 実行
  // Day1はダミー: inputs→outputsに反映
  return { outputs: { ...payload } }
}

11. フロー（ASCII）

11.1 定義〜実行

[Problem/Pain登録] → [Solution分解] → [Agent YAML化] → [DAG組成]
         ↓                      ↓              ↓              ↓
    [Zod検証/Lint]        [雛形生成]     [署名/バージョン]   [dry-run]
                                                             ↓
                                                   [Cloud Run 実行(後日)]

11.2 実行時データの流れ

UI → /api/executions/run → agent-runner → agentコンテナ(Cloud Run)
   ← metrics/logs ← runner ← agent
DB保存(executions.metrics/logs), 画面に可視化

12. バリデーション/ガバナンス
	•	Manifest Gate: 必須フィールド、ツール権限、PIIマスク、禁止特徴量
	•	実行Gate: タイムアウト、再試行、費用上限、承認フロー（manager承認）
	•	監査: 変更履歴（誰がいつ何を変更/実行）、説明可能性（重要特徴量・根拠）



13. 受入基準（Day1）
	•	課題/Pain/KPIがUIで登録でき、YAMLにエクスポート/インポート可能
	•	Solution分解の初期案が生成され、Agent Manifest雛形が作れる
	•	Manifestが検証OKになればdry-run成功（ダミーI/O）
	•	VercelプレビューURLで全員が操作できる



14. 拡張（Day2/3）
	•	Cloud Run 実Agent（analyzer/planner/executor/notifier）を実装
	•	DAG実行（並列/依存/再試行）・スケジューラ
	•	KPI接続（BigQuery等）・効果検証ダッシュボード
	•	権限/テナント/RLSの導入・共有ワークスペース



付録A: Agent Manifest もう1例（実行系）

