import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const painAnalysisSchema = z.object({
  pains: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      category: z.string(),
      impact: z.string(),
      frequency: z.string(),
      background: z.string(),
      rootCause: z.string(),
    }),
  ),
  structuralAnalysis: z.object({
    problemDomain: z.string(),
    stakeholders: z.array(z.string()),
    constraints: z.array(z.string()),
    dependencies: z.array(z.string()),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json()

    if (!userInput) {
      return NextResponse.json({ error: "User input is required" }, { status: 400 })
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: painAnalysisSchema,
      prompt: `
あなたは経験豊富なビジネスコンサルタントです。以下のビジネス課題について詳細なPain分析を行ってください。

ユーザーの課題:
${userInput}

## Pain分析の観点

以下の観点から具体的なPainを特定し、構造化してください：

1. 業務効率性の問題
2. コスト・リソースの問題  
3. 品質・精度の問題
4. スケーラビリティの問題
5. ユーザー体験の問題
6. データ・情報管理の問題
7. コンプライアンス・リスクの問題

## 各Painの詳細分析

各Painについて以下を含めてください：
- 明確で具体的なタイトル
- 詳細な説明（現状と問題点）
- 重要度（high/medium/low）
- カテゴリ分類
- ビジネスへの影響
- 発生頻度
- **背景分析**: なぜこの問題が発生しているのか、歴史的経緯や環境要因
- **根本原因**: 表面的な症状ではなく、本質的な原因の特定

## 構造化分析

さらに以下の構造化分析も実施してください：
- **問題領域**: どの業務領域・システム領域の問題か
- **ステークホルダー**: 影響を受ける関係者
- **制約条件**: 解決時に考慮すべき制約
- **依存関係**: 他の問題や要素との関連性

Pain IDは "P-001", "P-002" の形式で採番してください。
`,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error("Pain analysis error:", error)
    return NextResponse.json({ error: "Pain analysis failed" }, { status: 500 })
  }
}
