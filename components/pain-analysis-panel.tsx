"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, TrendingUp, Users, Clock, Target, ChevronDown, ChevronRight, ArrowRight } from "lucide-react"

interface PainPoint {
  id: string
  title: string
  severity: "high" | "medium" | "low"
  impact: string[]
  stakeholders: string[]
  constraints: string[]
  priority: number
  description: string
  evidence: string[]
  expanded: boolean
}

interface PainAnalysisPanelProps {
  painAnalysis?: {
    pains: Array<{
      id: string
      title: string
      description: string
      severity: "high" | "medium" | "low"
      category: string
      impact?: string
      frequency?: string
    }>
  }
}

export function PainAnalysisPanel({ painAnalysis }: PainAnalysisPanelProps) {
  const [painPoints, setPainPoints] = useState<PainPoint[]>(() => {
    if (painAnalysis?.pains) {
      return painAnalysis.pains.map((pain) => ({
        id: pain.id,
        title: pain.title,
        severity: pain.severity,
        impact: pain.impact ? [pain.impact] : [`影響度: ${pain.severity}`],
        stakeholders: [pain.category],
        constraints: ["データ品質", "システム連携", "時間的制約"],
        priority: pain.severity === "high" ? 90 : pain.severity === "medium" ? 70 : 50,
        description: pain.description,
        evidence: [`カテゴリ: ${pain.category}`, `頻度: ${pain.frequency || "不明"}`, `重要度: ${pain.severity}`],
        expanded: false,
      }))
    }
    return []
  })

  const toggleExpanded = (id: string) => {
    setPainPoints((prev) => prev.map((point) => (point.id === id ? { ...point, expanded: !point.expanded } : point)))
  }

  const getSeverityColor = (severity: "high" | "medium" | "low") => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
    }
  }

  const getSeverityBorderColor = (severity: "high" | "medium" | "low") => {
    switch (severity) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-blue-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Pain分析結果
        </h3>
        <Badge variant="outline" className="text-xs">{painPoints.length}件の課題</Badge>
      </div>

      {!painPoints.length && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pain分析結果はまだありません。</p>
        </Card>
      )}

      <div className="space-y-3">
        {painPoints.map((point) => (
          <Card key={point.id} className={`border-l-4 ${getSeverityBorderColor(point.severity)}`}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityColor(point.severity)} className="text-xs">
                    {point.severity === "high" ? "高重要度" : point.severity === "medium" ? "中重要度" : "低重要度"}
                  </Badge>
                  <h4 className="font-medium">{point.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {point.id}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleExpanded(point.id)}>
                  {point.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">優先度</span>
                  <Progress value={point.priority} className="w-16 h-2" />
                  <span className="text-xs font-medium">{point.priority}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{point.description}</p>

              {point.expanded && (
                <div className="space-y-4 mt-4">
                  <Separator />

                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      影響範囲
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {point.impact.map((impact, idx) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {impact}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      ステークホルダー
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {point.stakeholders.map((stakeholder, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {stakeholder}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      制約要因
                    </h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {point.constraints.map((constraint, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">根拠データ</h5>
                    <ul className="text-xs space-y-1">
                      {point.evidence.map((evidence, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                          <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {evidence}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline">
                  詳細分析
                </Button>
                <Button size="sm" variant="outline">
                  根拠確認
                </Button>
                <Button size="sm" className="ml-auto">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Solution設計
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-muted/50">
        <h4 className="font-medium mb-2">分析サマリー</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-500">
              {painPoints.filter((p) => p.severity === "high").length}
            </div>
            <div className="text-xs text-muted-foreground">高重要度</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">
              {painPoints.filter((p) => p.severity === "medium").length}
            </div>
            <div className="text-xs text-muted-foreground">中重要度</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">
              {painPoints.filter((p) => p.severity === "low").length}
            </div>
            <div className="text-xs text-muted-foreground">低重要度</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
