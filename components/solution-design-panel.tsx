"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Lightbulb,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Plus,
  Settings,
  Play,
} from "lucide-react"

interface SolutionComponent {
  id: string
  name: string
  type: "data" | "processing" | "ai" | "integration" | "ui"
  description: string
  dependencies: string[]
  outputs: string[]
  complexity: number
  estimatedHours: number
  status: "planned" | "in-progress" | "completed"
  position: { x: number; y: number }
}

interface SolutionDesign {
  id: string
  title: string
  overview: string
  components: SolutionComponent[]
  successMetrics: string[]
  risks: Array<{ risk: string; mitigation: string }>
  implementationSteps: Array<{ step: string; duration: string; dependencies: string[] }>
}

interface SolutionDesignPanelProps {
  solutionDesign?: {
    solutions: Array<{
      id: string
      title: string
      description: string
      painIds: string[]
      approach: string
      technology?: string
      priority?: "high" | "medium" | "low"
      effort?: string
      impact?: string
    }>
  }
}

export function SolutionDesignPanel({ solutionDesign }: SolutionDesignPanelProps) {
  const [solution] = useState<SolutionDesign>(() => {
    if (solutionDesign?.solutions && solutionDesign.solutions.length > 0) {
      const primarySolution = solutionDesign.solutions[0]
      return {
        id: primarySolution.id,
        title: primarySolution.title,
        overview: primarySolution.description,
        components: [
          {
            id: "comp-1",
            name: "データ収集・正規化",
            type: "data",
            description: primarySolution.approach,
            dependencies: [],
            outputs: ["normalized-data"],
            complexity: 7,
            estimatedHours: Number.parseInt(primarySolution.effort?.match(/\d+/)?.[0] || "40"),
            status: "planned",
            position: { x: 50, y: 100 },
          },
          {
            id: "comp-2",
            name: "処理エンジン",
            type: "ai",
            description: `${primarySolution.technology || "AI技術"}を使用した処理システム`,
            dependencies: ["normalized-data"],
            outputs: ["processed-data"],
            complexity: 8,
            estimatedHours: 60,
            status: "planned",
            position: { x: 250, y: 100 },
          },
        ],
        successMetrics: [primarySolution.impact || "効率向上", "品質改善", "コスト削減"],
        risks: [
          {
            risk: "技術的複雑性",
            mitigation: "段階的実装とプロトタイプ検証",
          },
        ],
        implementationSteps: [
          {
            step: primarySolution.title + "の実装",
            duration: primarySolution.effort || "4週間",
            dependencies: [],
          },
        ],
      }
    }

    return {
      id: "SOL-001",
      title: "候補者情報統合・可視化システム",
      overview: "分散している候補者情報を統合し、AIによるスキル分析とマッチング精度向上を実現するソリューション",
      components: [
        {
          id: "comp-1",
          name: "データ収集・正規化",
          type: "data",
          description: "履歴書、GitHub、面談メモなどの分散データを収集・正規化",
          dependencies: [],
          outputs: ["normalized-data"],
          complexity: 7,
          estimatedHours: 40,
          status: "planned",
          position: { x: 50, y: 100 },
        },
        {
          id: "comp-2",
          name: "スキル抽出・分析",
          type: "ai",
          description: "NLPを使用してスキル情報を抽出・分析・カテゴライズ",
          dependencies: ["normalized-data"],
          outputs: ["skill-profile"],
          complexity: 8,
          estimatedHours: 60,
          status: "planned",
          position: { x: 250, y: 100 },
        },
        {
          id: "comp-3",
          name: "マッチングエンジン",
          type: "ai",
          description: "要件とスキルプロファイルのマッチング精度を向上",
          dependencies: ["skill-profile"],
          outputs: ["match-score"],
          complexity: 9,
          estimatedHours: 80,
          status: "planned",
          position: { x: 450, y: 100 },
        },
        {
          id: "comp-4",
          name: "統合ダッシュボード",
          type: "ui",
          description: "候補者情報の統合ビューとマッチング結果の可視化",
          dependencies: ["match-score"],
          outputs: ["dashboard"],
          complexity: 6,
          estimatedHours: 50,
          status: "planned",
          position: { x: 650, y: 100 },
        },
        {
          id: "comp-5",
          name: "フィードバック学習",
          type: "ai",
          description: "採用結果からのフィードバックでモデルを継続改善",
          dependencies: ["match-score"],
          outputs: ["improved-model"],
          complexity: 8,
          estimatedHours: 45,
          status: "planned",
          position: { x: 450, y: 250 },
        },
      ],
      successMetrics: ["面談率 15%向上", "マッチング精度 20%向上", "採用期間 2週間短縮", "情報整理時間 70%削減"],
      risks: [
        {
          risk: "データ品質のばらつき",
          mitigation: "データクレンジングパイプラインの構築と品質監視",
        },
        {
          risk: "プライバシー要件への対応",
          mitigation: "データ匿名化とアクセス制御の実装",
        },
        {
          risk: "既存システムとの連携",
          mitigation: "段階的移行とAPIゲートウェイの活用",
        },
      ],
      implementationSteps: [
        {
          step: "データ収集・正規化システム構築",
          duration: "3週間",
          dependencies: [],
        },
        {
          step: "スキル抽出AIモデル開発",
          duration: "4週間",
          dependencies: ["データ収集・正規化システム構築"],
        },
        {
          step: "マッチングエンジン実装",
          duration: "5週間",
          dependencies: ["スキル抽出AIモデル開発"],
        },
        {
          step: "ダッシュボード開発",
          duration: "3週間",
          dependencies: ["マッチングエンジン実装"],
        },
        {
          step: "フィードバック学習機能追加",
          duration: "3週間",
          dependencies: ["ダッシュボード開発"],
        },
      ],
    }
  })

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)

  const getTypeColor = (type: SolutionComponent["type"]) => {
    switch (type) {
      case "data":
        return "bg-blue-100 border-blue-300 text-blue-800"
      case "ai":
        return "bg-purple-100 border-purple-300 text-purple-800"
      case "processing":
        return "bg-green-100 border-green-300 text-green-800"
      case "integration":
        return "bg-orange-100 border-orange-300 text-orange-800"
      case "ui":
        return "bg-pink-100 border-pink-300 text-pink-800"
    }
  }

  const getTypeIcon = (type: SolutionComponent["type"]) => {
    switch (type) {
      case "data":
        return "📊"
      case "ai":
        return "🧠"
      case "processing":
        return "⚙️"
      case "integration":
        return "🔗"
      case "ui":
        return "🎨"
    }
  }

  const getStatusColor = (status: SolutionComponent["status"]) => {
    switch (status) {
      case "planned":
        return "secondary"
      case "in-progress":
        return "default"
      case "completed":
        return "default"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          ソリューション設計
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Settings className="w-3 h-3 mr-1" />
            設定
          </Button>
          <Button size="sm">
            <Play className="w-3 h-3 mr-1" />
            Agent化
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <h4 className="font-medium mb-2">{solution.title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{solution.overview}</p>

        <div className="grid grid-cols-4 gap-4 text-center mb-4">
          <div>
            <div className="text-lg font-bold text-primary">{solution.components.length}</div>
            <div className="text-xs text-muted-foreground">コンポーネント</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {solution.components.reduce((sum, comp) => sum + comp.estimatedHours, 0)}h
            </div>
            <div className="text-xs text-muted-foreground">見積工数</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">18週間</div>
            <div className="text-xs text-muted-foreground">実装期間</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">{solution.successMetrics.length}</div>
            <div className="text-xs text-muted-foreground">成功指標</div>
          </div>
        </div>
      </Card>

      {/* Show additional solutions if available */}
      {solutionDesign?.solutions && solutionDesign.solutions.length > 1 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">その他のソリューション候補</h4>
          <div className="space-y-2">
            {solutionDesign.solutions.slice(1).map((sol) => (
              <div key={sol.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <h5 className="text-sm font-medium">{sol.title}</h5>
                  <p className="text-xs text-muted-foreground">{sol.description}</p>
                </div>
                <Badge variant={sol.priority === "high" ? "destructive" : "outline"} className="text-xs">
                  {sol.priority || "medium"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* DAG Visualization */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">アーキテクチャDAG</h4>
          <Button size="sm" variant="outline">
            <Plus className="w-3 h-3 mr-1" />
            コンポーネント追加
          </Button>
        </div>

        <div className="relative bg-muted/30 rounded-lg p-6 min-h-[300px] overflow-x-auto">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Draw connections between components */}
            {solution.components.map((component) =>
              component.dependencies.map((depId) => {
                const depComponent = solution.components.find((c) => c.outputs.includes(depId))
                if (!depComponent) return null

                return (
                  <line
                    key={`${depComponent.id}-${component.id}`}
                    x1={depComponent.position.x + 80}
                    y1={depComponent.position.y + 40}
                    x2={component.position.x}
                    y2={component.position.y + 40}
                    stroke="#6b7280"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                )
              }),
            )}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
              </marker>
            </defs>
          </svg>

          {/* Render components */}
          {solution.components.map((component) => (
            <div
              key={component.id}
              className={`absolute w-40 p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getTypeColor(
                component.type,
              )} ${selectedComponent === component.id ? "ring-2 ring-primary" : ""}`}
              style={{
                left: component.position.x,
                top: component.position.y,
              }}
              onClick={() => setSelectedComponent(selectedComponent === component.id ? null : component.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{getTypeIcon(component.type)}</span>
                <Badge variant={getStatusColor(component.status)} className="text-xs">
                  {component.status}
                </Badge>
              </div>
              <h5 className="font-medium text-sm mb-1">{component.name}</h5>
              <p className="text-xs opacity-80 line-clamp-2">{component.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs">複雑度: {component.complexity}/10</span>
                <span className="text-xs">{component.estimatedHours}h</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Component Details */}
      {selectedComponent && (
        <Card className="p-4">
          {(() => {
            const component = solution.components.find((c) => c.id === selectedComponent)
            if (!component) return null

            return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span>{getTypeIcon(component.type)}</span>
                    {component.name}
                  </h4>
                  <Button size="sm">
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Agent化
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{component.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">複雑度</h5>
                    <div className="flex items-center gap-2">
                      <Progress value={component.complexity * 10} className="flex-1" />
                      <span className="text-sm">{component.complexity}/10</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">見積工数</h5>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">{component.estimatedHours}時間</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">依存関係</h5>
                    <div className="space-y-1">
                      {component.dependencies.length > 0 ? (
                        component.dependencies.map((dep) => (
                          <Badge key={dep} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">なし</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">出力</h5>
                    <div className="space-y-1">
                      {component.outputs.map((output) => (
                        <Badge key={output} variant="secondary" className="text-xs">
                          {output}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </Card>
      )}

      {/* Success Metrics */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          成功指標
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {solution.successMetrics.map((metric, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">{metric}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Risks and Mitigation */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          リスクと対策
        </h4>
        <div className="space-y-3">
          {solution.risks.map((item, idx) => (
            <div key={idx} className="border-l-4 border-yellow-500 pl-3">
              <h5 className="text-sm font-medium text-yellow-800">{item.risk}</h5>
              <p className="text-sm text-muted-foreground">{item.mitigation}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Implementation Steps */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          実装ステップ
        </h4>
        <div className="space-y-3">
          {solution.implementationSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium">{step.step}</h5>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {step.duration}
                  </span>
                  {step.dependencies.length > 0 && (
                    <span className="text-xs text-muted-foreground">依存: {step.dependencies.join(", ")}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
