"use client"

import { useRef, useState, useEffect, startTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PainAnalysisPanel } from "./pain-analysis-panel"
import { SolutionDesignPanel } from "./solution-design-panel"
import { AgentManifestEditor } from "./agent-manifest-editor"
import { CloudRunDeployment } from "./cloud-run-deployment"
import { useWorkflow } from "@/hooks/use-workflow"
import { useChatLive } from "@/hooks/use-chat-store"
 
import YAML from "yaml"

// Simple SVG icon components to replace lucide-react
const Play = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5,3 19,12 5,21 5,3" />
  </svg>
)

const Upload = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
)

export function OutputPanels() {
  const [activeTab, setActiveTab] = useState("pain")
  const { stages, context, isRunning } = useWorkflow()
  const live = useChatLive(true)

  // Auto-switch to Live tab only on rising edge (false -> true)
  const switchedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!live.streaming || !live.sessionId) return
    if (switchedFor.current === live.sessionId) return
    startTransition(() => setActiveTab((prev) => (prev === "live" ? prev : "live")))
    switchedFor.current = live.sessionId
  }, [live.streaming, live.sessionId])

  const deploymentResult = stages.find((s) => s.id === "deployment-prep")?.result
  const [deployOverride, setDeployOverride] = useState<any | null>(null)
  const [manifestOverride, setManifestOverride] = useState<any | null>(null)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)

  return (
    <div className="bg-card border-l border-border p-2 md:p-4 flex flex-col h-full overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h2 className="font-medium mb-2 text-sm md:text-base">出力タブ</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-auto p-1">
            <TabsTrigger value="live" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Live</span>
              {live.streaming && <div className="w-2 h-2 bg-rose-500 rounded-full ml-1 animate-pulse"></div>}
            </TabsTrigger>
            <TabsTrigger value="pain" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Pain</span>
              {stages.find((s) => s.id === "pain-analysis")?.status === "running" && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-1 animate-pulse"></div>
              )}
              {stages.find((s) => s.id === "pain-analysis")?.status === "completed" && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="solution" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Solution</span>
              {stages.find((s) => s.id === "solution-design")?.status === "running" && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-1 animate-pulse"></div>
              )}
              {stages.find((s) => s.id === "solution-design")?.status === "completed" && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Agents</span>
              {stages.find((s) => s.id === "agent-generation")?.status === "running" && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-1 animate-pulse"></div>
              )}
              {stages.find((s) => s.id === "agent-generation")?.status === "completed" && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="manifest" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Manifest</span>
              {stages.find((s) => s.id === "manifest-generation")?.status === "running" && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-1 animate-pulse"></div>
              )}
              {stages.find((s) => s.id === "manifest-generation")?.status === "completed" && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="cloudrun" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">CloudRun</span>
              {stages.find((s) => s.id === "deployment-prep")?.status === "running" && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-1 animate-pulse"></div>
              )}
              {stages.find((s) => s.id === "deployment-prep")?.status === "completed" && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="live" className="mt-4 h-full overflow-y-auto">
              <Card className="p-3">
                {live.assistantText ? (
                  <pre className="whitespace-pre-wrap break-words text-sm">{live.assistantText}</pre>
                ) : (
                  <p className="text-sm text-muted-foreground">ライブ出力はここに表示されます。</p>
                )}
              </Card>
            </TabsContent>
            <TabsContent value="pain" className="mt-4 h-full overflow-y-auto">
              <PainAnalysisPanel painAnalysis={context.painAnalysis} />
            </TabsContent>

            <TabsContent value="solution" className="mt-4 h-full overflow-y-auto">
              <SolutionDesignPanel solutionDesign={context.solutionDesign} />
            </TabsContent>

            <TabsContent value="agents" className="mt-4 h-full overflow-y-auto">
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Agent候補</h3>
                    <Button size="sm">Manifest生成</Button>
                  </div>
                  <div className="space-y-2">
                    {context.agentGeneration?.agents?.map((agent) => (
                      <label key={agent.id} className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">({agent.description})</span>
                      </label>
                    ))}
                    {!context.agentGeneration?.agents?.length && (
                      <div className="text-xs text-muted-foreground">エージェントはまだ生成されていません。</div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="manifest" className="mt-4 h-full overflow-y-auto space-y-4">
              <AgentManifestEditor manifest={context.manifest} />
              {(manifestOverride || context.manifest)?.agents?.length ? (
                <Card className="p-4">
                  <h4 className="font-medium mb-3">生成済みYAMLプレビュー</h4>
                  <div className="bg-black text-green-300 p-3 rounded font-mono text-xs whitespace-pre overflow-x-auto">
                    <pre>
                      {(manifestOverride || context.manifest).agents
                        .map((a) => `---\n${YAML.stringify(a.manifest)}`)
                        .join("\n")}
                    </pre>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        try {
                          const docs = (manifestOverride || context.manifest).agents
                            .map((a) => `---\n${YAML.stringify(a.manifest)}`)
                            .join("\n")
                          const blob = new Blob([docs], { type: "text/yaml;charset=utf-8" })
                          const url = URL.createObjectURL(blob)
                          const aTag = document.createElement("a")
                          aTag.href = url
                          aTag.download = "manifests.yaml"
                          document.body.appendChild(aTag)
                          aTag.click()
                          document.body.removeChild(aTag)
                          URL.revokeObjectURL(url)
                        } catch {}
                      }}
                    >
                      YAMLダウンロード
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById("yaml-import-input")?.click()}
                    >
                      YAMLインポート
                    </Button>
                    <input
                      id="yaml-import-input"
                      type="file"
                      accept=".yml,.yaml"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const text = await file.text()
                        try {
                          const docs = YAML.parseAllDocuments(text).map((d) => d.toJSON())
                          const agents = docs
                            .filter(Boolean)
                            .map((m: any) => ({ name: m?.metadata?.name || "agent", manifest: m }))
                          if (agents.length) {
                            setManifestOverride({ agents })
                          }
                        } catch (err) {
                          console.error("YAML import failed", err)
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={regenLoading}
                      onClick={async () => {
                        setRegenLoading(true)
                        setRegenError(null)
                        try {
                          const res = await fetch("/api/workflow/deployment-prep", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ manifest: manifestOverride || context.manifest }),
                          })
                          if (!res.ok) throw new Error(await res.text())
                          const data = await res.json()
                          setDeployOverride(data)
                          setActiveTab("cloudrun")
                        } catch (e: any) {
                          setRegenError(e?.message || "再生成に失敗しました")
                        } finally {
                          setRegenLoading(false)
                        }
                      }}
                    >
                      Cloud Run スクリプト再生成
                    </Button>
                    {regenError && <span className="text-xs text-red-500">{regenError}</span>}
                  </div>
                </Card>
              ) : (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">マニフェストはまだ生成されていません。</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cloudrun" className="mt-4 h-full overflow-y-auto">
              {(deployOverride || deploymentResult) ? (
                <CloudRunDeployment deploymentConfig={deployOverride || deploymentResult} />
              ) : (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">デプロイ準備情報はまだありません。</p>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="mt-auto flex-shrink-0">
        <Card className="p-2 md:p-4">
          <h3 className="font-medium mb-3 text-sm md:text-base">実行コントロール</h3>
          <div className="flex gap-1 md:gap-2 mb-3 flex-wrap">
            <Button size="sm" variant="outline" className="text-xs bg-transparent">
              <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Dry-run
            </Button>
            <Button size="sm" className="text-xs" disabled={isRunning}>
              <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              {isRunning ? "実行中..." : "Run"}
            </Button>
            <Button size="sm" variant="outline" className="text-xs bg-transparent">
              <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Deploy
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isRunning ? "bg-yellow-500 animate-pulse" : "bg-green-500"
              }`}
            ></div>
            <span className="text-xs md:text-sm truncate">ステータス: {isRunning ? "実行中" : "準備OK"}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
