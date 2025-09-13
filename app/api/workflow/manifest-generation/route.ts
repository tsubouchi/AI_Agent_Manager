import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { promises as fs } from "fs"
import path from "path"

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

function toSlug(name: string) {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function repairManifests(obj: any) {
  if (!obj?.agents) return obj
  obj.agents = obj.agents
    .filter(Boolean)
    .map((a: any) => {
      if (!a) return a
      const name = a.name || a.agent_name || "agent"
      const manifest = a.manifest || {}
      const out: any = {
        name,
        manifest: {
          apiVersion: manifest.apiVersion || "v1",
          kind: manifest.kind || "Agent",
          metadata: manifest.metadata || { name: toSlug(name), labels: {} },
          spec: manifest.spec || {},
        },
      }

      const spec = out.manifest.spec
      // If Kubernetes Deployment-like, map from first container
      const k8sContainer = manifest?.spec?.template?.spec?.containers?.[0]
      if (k8sContainer) {
        spec.image = spec.image || k8sContainer.image
        if (!spec.ports && Array.isArray(k8sContainer.ports)) {
          spec.ports = k8sContainer.ports.map((p: any) => ({
            containerPort: p.containerPort || 8080,
            protocol: p.protocol || "TCP",
          }))
        }
        if (!spec.env && Array.isArray(k8sContainer.env)) {
          spec.env = k8sContainer.env.map((e: any) => ({ name: e.name, value: e.value }))
        }
        if (!spec.resources && k8sContainer.resources) {
          const r = k8sContainer.resources
          spec.resources = {
            requests: {
              memory: r.requests?.memory || "512Mi",
              cpu: r.requests?.cpu || "250m",
            },
            limits: {
              memory: r.limits?.memory || "1Gi",
              cpu: r.limits?.cpu || "500m",
            },
          }
        }
      }

      // Fill defaults if still missing
      spec.image = spec.image || `gcr.io/project-id/${toSlug(name)}:latest`
      if (!Array.isArray(spec.ports) || !spec.ports.length) {
        spec.ports = [{ containerPort: 8080, protocol: "TCP" }]
      }
      if (!Array.isArray(spec.env)) spec.env = []
      if (!spec.resources) {
        spec.resources = {
          requests: { memory: "512Mi", cpu: "250m" },
          limits: { memory: "1Gi", cpu: "500m" },
        }
      }

      return out
    })
  return obj
}

export async function POST(request: NextRequest) {
  try {
    const { agentGeneration } = await request.json()

    if (!agentGeneration) {
      return NextResponse.json({ error: "Agent generation data is required" }, { status: 400 })
    }

    // Load canonical example (YAML) to ground the model
    let sample = ""
    try {
      const filePath = path.join(process.cwd(), "sample_manifest.yaml")
      sample = await fs.readFile(filePath, "utf8")
    } catch {}

    // Primary attempt: strict schema-guided generation
    try {
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: manifestGenerationSchema,
        prompt: `
あなたはクラウド実行向けのエージェントマニフェスト設計者です。以下の仕様を満たすJSONのみを出力してください。

出力スキーマ（簡易）:
{
  "agents": [
    {
      "name": string,
      "manifest": {
        "apiVersion": string,
        "kind": string,
        "metadata": { "name": string, "labels": { [k: string]: string } },
        "spec": {
          "image": string,
          "ports": [{ "containerPort": number, "protocol": string }],
          "env": [{ "name": string, "value": string }],
          "resources": {
            "requests": { "memory": string, "cpu": string },
            "limits": { "memory": string, "cpu": string }
          }
        }
      }
    }
  ]
}

禁止事項: Kubernetes Deploymentの 'replicas', 'selector', 'template', 'containers' 等の構造は使用しないでください。

参考YAML（正準サンプル）:
---
${sample}
---

エージェント仕様:
${JSON.stringify(agentGeneration, null, 2)}
`,
        temperature: 0,
      })

      const repaired = repairManifests(result.object)
      const validated = manifestGenerationSchema.parse(repaired)
      return NextResponse.json(validated)
    } catch (primaryErr) {
      console.warn("Primary manifest generation failed; applying fallback.", primaryErr)
      // Fallback: deterministic build from agentGeneration
      if (agentGeneration?.agents?.length) {
        const fallback = {
          agents: agentGeneration.agents.map((ag: any) => ({
            name: ag.name || "agent",
            manifest: {
              apiVersion: "v1",
              kind: "Agent",
              metadata: { name: toSlug(ag.name || "agent"), labels: {} },
              spec: {
                image: `gcr.io/project-id/${toSlug(ag.name || "agent")}:latest`,
                ports: [{ containerPort: 8080, protocol: "TCP" }],
                env: [],
                resources: {
                  requests: { memory: "512Mi", cpu: "250m" },
                  limits: { memory: "1Gi", cpu: "500m" },
                },
              },
            },
          })),
        }
        const validated = manifestGenerationSchema.parse(fallback)
        return NextResponse.json(validated)
      }
      return NextResponse.json({ error: "Manifest generation failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Manifest generation error:", error)
    return NextResponse.json({ error: "Manifest generation failed" }, { status: 500 })
  }
}
