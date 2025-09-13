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

export function OutputPanels() {
  const [activeTab, setActiveTab] = useState("pain")

  return (
    <div className="bg-card border-l border-border p-2 md:p-4 flex flex-col h-full overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h2 className="font-medium mb-2 text-sm md:text-base">出力タブ</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger value="pain" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Pain</span>
            </TabsTrigger>
            <TabsTrigger value="solution" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Solution</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="manifest" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">Manifest</span>
            </TabsTrigger>
            <TabsTrigger value="cloudrun" className="text-xs px-1 py-2 min-w-0">
              <span className="truncate">CloudRun</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="pain" className="mt-4 h-full overflow-y-auto">
              <PainAnalysisPanel />
            </TabsContent>

            <TabsContent value="solution" className="mt-4 h-full overflow-y-auto">
              <SolutionDesignPanel />
            </TabsContent>

            <TabsContent value="agents" className="mt-4 h-full overflow-y-auto">
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Agent候補</h3>
                    <Button size="sm">Manifest生成</Button>
                  </div>
                  <div className="space-y-2">
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
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="manifest" className="mt-4 h-full overflow-y-auto">
              <AgentManifestEditor />
            </TabsContent>

            <TabsContent value="cloudrun" className="mt-4 h-full overflow-y-auto">
              <CloudRunDeployment />
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
            <Button size="sm" className="text-xs">
              <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Run
            </Button>
            <Button size="sm" variant="outline" className="text-xs bg-transparent">
              <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Deploy
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-xs md:text-sm truncate">ステータス: 準備OK</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
