import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const { messages, mode } = await req.json()

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: getSystemPrompt(mode),
          },
          ...messages,
        ],
        stream: true,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    const streamData = JSON.stringify({
                      type: "text-delta",
                      text: content,
                    })
                    controller.enqueue(encoder.encode(`0:${streamData}\n`))
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

function getSystemPrompt(mode: string): string {
  switch (mode) {
    case "pain-analysis":
      return `あなたはビジネス課題分析の専門家です。ユーザーから提供されたビジネス課題を詳細に分析し、以下の形式でPain分析を行ってください：

1. **課題の本質**: 表面的な問題の背後にある根本的な課題
2. **影響範囲**: この課題が与える影響の範囲と深刻度
3. **ステークホルダー**: 影響を受ける関係者
4. **現状の制約**: 解決を阻む要因
5. **優先度**: 解決の緊急度と重要度

分析は具体的で実行可能な洞察を提供してください。`

    case "solution-design":
      return `あなたはソリューション設計の専門家です。Pain分析の結果を基に、以下の形式でソリューション設計を行ってください：

1. **ソリューション概要**: 課題解決のアプローチ
2. **機能要件**: 必要な機能の詳細
3. **技術要件**: 実装に必要な技術スタック
4. **実行ステップ**: 段階的な実装計画
5. **成功指標**: 解決度を測る指標
6. **リスクと対策**: 想定されるリスクと対応策

実装可能で具体的なソリューションを提案してください。`

    case "agent-generation":
      return `あなたはAIエージェント設計の専門家です。ソリューション設計を基に、実行可能なAIエージェントの仕様を以下の形式で生成してください：

1. **エージェント構成**: 必要なエージェントの種類と役割
2. **入力/出力**: 各エージェントの入力と出力仕様
3. **処理フロー**: エージェント間の連携フロー
4. **必要なツール**: 各エージェントが使用するツールやAPI
5. **実行環境**: デプロイメント要件

YAML Manifestの生成準備として、構造化された仕様を提供してください。`

    default:
      return `あなたは親切で知識豊富なAIアシスタントです。ユーザーの質問に丁寧に答えてください。`
  }
}
