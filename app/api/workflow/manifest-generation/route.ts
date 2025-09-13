import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const manifestGenerationSchema = z.object({
  agents: z.array(
    z.object({
      name: z.string(),
      manifest: z.object({
        apiVersion: z.string(),
        kind: z.string(),
        metadata: z.object({
          name: z.string(),
          labels: z.record(z.string()),
        }),
        spec: z.object({
          image: z.string(),
          ports: z.array(
            z.object({
              containerPort: z.number(),
              protocol: z.string(),
            }),
          ),
          env: z.array(
            z.object({
              name: z.string(),
              value: z.string(),
            }),
          ),
          resources: z.object({
            requests: z.object({
              memory: z.string(),
              cpu: z.string(),
            }),
            limits: z.object({
              memory: z.string(),
              cpu: z.string(),
            }),
          }),
        }),
      }),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const { agentGeneration } = await request.json()

    if (!agentGeneration) {
      return NextResponse.json({ error: "Agent generation data is required" }, { status: 400 })
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: manifestGenerationSchema,
      prompt: `
あなたは経験豊富なKubernetesエンジニアです。以下のAIエージェント仕様に基づいて、Cloud Run用のKubernetesマニフェストを生成してください。

エージェント仕様:
${JSON.stringify(agentGeneration, null, 2)}

各エージェントについて以下を含むマニフェストを生成してください：

1. 適切なメタデータとラベル
2. コンテナイメージ仕様（gcr.io/project-id/agent-name:latest形式）
3. ポート設定（通常8080）
4. 環境変数設定
5. リソース制限（CPU/メモリ）
6. Cloud Run最適化設定

マニフェストはKubernetes Service仕様に準拠し、Cloud Runでデプロイ可能な形式にしてください。
`,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error("Manifest generation error:", error)
    return NextResponse.json({ error: "Manifest generation failed" }, { status: 500 })
  }
}
