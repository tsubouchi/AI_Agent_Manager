import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const agentGenerationSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      capabilities: z.array(z.string()),
      solutionIds: z.array(z.string()),
      inputFormat: z.string(),
      outputFormat: z.string(),
      dependencies: z.array(z.string()),
      scalability: z.string(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const { userInput, painAnalysis, solutionDesign } = await request.json()

    if (!userInput || !painAnalysis || !solutionDesign) {
      return NextResponse.json({ error: "All workflow data is required" }, { status: 400 })
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: agentGenerationSchema,
      prompt: `
あなたは経験豊富なAIエージェント設計者です。以下のPain分析とソリューション設計に基づいて、具体的なAIエージェントを設計してください。

元の課題:
${userInput}

Pain分析結果:
${JSON.stringify(painAnalysis, null, 2)}

ソリューション設計結果:
${JSON.stringify(solutionDesign, null, 2)}

以下の観点から効果的なAIエージェントを設計してください：

1. データ処理・変換エージェント
2. 分析・判定エージェント
3. 自動化・実行エージェント
4. 監視・アラートエージェント
5. レポート・可視化エージェント

各エージェントについて：
- 明確で具体的な名前（kebab-case）
- 詳細な説明（役割と責任）
- 具体的な機能・能力（配列）
- 対象となるSolution ID（配列）
- 入力データ形式
- 出力データ形式
- 依存関係（他のエージェントやサービス）
- スケーラビリティ要件

エージェント名は実装可能な具体的な名前にしてください（例：resume-parser, skill-normalizer, matcher-core）。
`,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error("Agent generation error:", error)
    return NextResponse.json({ error: "Agent generation failed" }, { status: 500 })
  }
}
