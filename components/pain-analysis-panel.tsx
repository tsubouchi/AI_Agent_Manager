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

export function PainAnalysisPanel() {
  const [painPoints, setPainPoints] = useState<PainPoint[]>([
    {
      id: "P-001",
      title: "候補者可視化不足",
      severity: "high",
      impact: ["面談率低下 (-15%)", "マッチング精度低下 (-20%)", "採用期間延長 (+2週間)"],
      stakeholders: ["採用担当者", "エンジニアリングマネージャー", "候補者"],
      constraints: ["既存システムとの連携", "データ品質のばらつき", "プライバシー要件"],
      priority: 95,
      description:
        "現在の候補者情報が断片的で、スキルや経験の全体像が把握しにくい状況。履歴書、GitHub、面談メモが分散しており、総合的な評価が困難。",
      evidence: [
        "面談官アンケート: 78%が「情報不足で判断困難」と回答",
        "採用データ分析: 情報整理に平均45分/候補者を要している",
        "エンジニア面談: 技術スキル把握に追加質問が平均12回必要",
      ],
      expanded: false,
    },
    {
      id: "P-002",
      title: "要件粒度の不整合",
      severity: "medium",
      impact: ["見積もり精度低下 (-25%)", "開発効率低下 (-10%)", "コミュニケーションコスト増加"],
      stakeholders: ["プロダクトマネージャー", "開発チーム", "ステークホルダー"],
      constraints: ["チーム間の認識齟齬", "文書化プロセスの未整備", "時間的制約"],
      priority: 70,
      description:
        "プロジェクトごとに要件の詳細度がバラバラで、見積もり精度に影響。一部は過度に詳細、一部は抽象的すぎる状況。",
      evidence: [
        "プロジェクト分析: 要件粒度の標準偏差が2.3（理想値: 0.8以下）",
        "見積もり精度: 実績との乖離が平均28%",
        "チーム調査: 67%が「要件理解に時間がかかる」と回答",
      ],
      expanded: false,
    },
    {
      id: "P-003",
      title: "面談調整の遅延",
      severity: "low",
      impact: ["候補者離脱率増加 (+8%)", "採用プロセス延長", "機会損失"],
      stakeholders: ["人事担当者", "面談官", "候補者"],
      constraints: ["カレンダー連携の複雑さ", "時差の考慮", "緊急対応の必要性"],
      priority: 45,
      description: "面談スケジュール調整に時間がかかり、候補者体験に悪影響。手動調整が多く、効率化が必要。",
      evidence: [
        "調整時間分析: 平均3.2日（目標: 1日以内）",
        "候補者フィードバック: 42%が「レスポンスが遅い」と指摘",
        "面談官負荷: 調整業務に週平均2.5時間を消費",
      ],
      expanded: false,
    },
  ])

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
        <Badge variant="outline" className="text-xs">
          {painPoints.length}件の課題を特定
        </Badge>
      </div>

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
            <div className="text-2xl font-bold text-red-500">1</div>
            <div className="text-xs text-muted-foreground">高重要度</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">1</div>
            <div className="text-xs text-muted-foreground">中重要度</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">1</div>
            <div className="text-xs text-muted-foreground">低重要度</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
