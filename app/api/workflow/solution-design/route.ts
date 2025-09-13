import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const solutionDesignSchema = z.object({
  solutions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      painIds: z.array(z.string()),
      approach: z.string(),
      technology: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      effort: z.string(),
      impact: z.string(),
      background: z.string(),
      architecture: z.string(),
      feasibility: z.string(),
    }),
  ),
  structuralAnalysis: z.object({
    designPrinciples: z.array(z.string()),
    technicalApproach: z.string(),
    riskAssessment: z.array(z.string()),
    successMetrics: z.array(z.string()),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const { userInput, painAnalysis } = await request.json()

    if (!userInput || !painAnalysis) {
      return NextResponse.json({ error: "User input and pain analysis are required" }, { status: 400 })
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: solutionDesignSchema,
      prompt: `
あなたは経験豊富なソリューションアーキテクトです。以下のPain分析結果に基づいて、具体的なソリューション設計を行ってください。

元の課題:
${userInput}

Pain分析結果:
${JSON.stringify(painAnalysis, null, 2)}

## ソリューション設計の観点

以下の観点から効果的なソリューションを設計してください：

1. 自動化・効率化ソリューション
2. データ統合・可視化ソリューション
3. AI・機械学習活用ソリューション
4. ワークフロー最適化ソリューション
5. 品質管理・監視ソリューション

## 各ソリューションの詳細設計

各ソリューションについて以下を含めてください：
- 明確で具体的なタイトル
- 詳細な説明（アプローチと実装方法）
- 対象となるPain ID（配列）
- 技術的アプローチ
- 使用技術スタック
- 優先度（high/medium/low）
- 実装工数の見積もり
- 期待される効果・インパクト
- **背景分析**: なぜこのソリューションが最適なのか、選択理由と背景
- **アーキテクチャ**: システム構成、データフロー、インテグレーション方式
- **実現可能性**: 技術的・組織的・予算的な実現可能性の評価

## 構造化分析

さらに以下の構造化分析も実施してください：
- **設計原則**: ソリューション設計で重視する原則
- **技術的アプローチ**: 全体的な技術戦略
- **リスク評価**: 想定されるリスクと対策
- **成功指標**: 効果測定のためのKPI

Solution IDは "S-001", "S-002" の形式で採番してください。
`,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error("Solution design error:", error)
    return NextResponse.json({ error: "Solution design failed" }, { status: 500 })
  }
}
