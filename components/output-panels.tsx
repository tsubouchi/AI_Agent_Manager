"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Upload } from "lucide-react"
import { PainAnalysisPanel } from "./pain-analysis-panel"
import { SolutionDesignPanel } from "./solution-design-panel"
import { AgentManifestEditor } from "./agent-manifest-editor"
import { CloudRunDeployment } from "./cloud-run-deployment"
import { useWorkflow } from "@/hooks/use-workflow"

export function OutputPanels() {
  const [activeTab, setActiveTab] = useState("pain")
  const { stages, context, isRunning } = useWorkflow()

  return (
    <div className="bg-card border-l border-border p-2 md:p-4 flex flex-col h-full overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h2 className="font-medium mb-2 text-sm md:text-base">出力タブ</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
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
                    {context.agentGeneration?.agents.map((agent) => (
                      <label key={agent.id} className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">({agent.description})</span>
                      </label>
                    )) || (
                      <>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">resume-parser</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">skill-normalizer</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">matcher-core</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">fairness-review</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="manifest" className="mt-4 h-full overflow-y-auto">
              <AgentManifestEditor manifest={context.manifest} />
            </TabsContent>

            <TabsContent value="cloudrun" className="mt-4 h-full overflow-y-auto">
              <CloudRunDeployment deploymentConfig={stages.find((s) => s.id === "deployment-prep")?.result} />
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
