import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { manifest } = await request.json()

    if (!manifest) {
      return NextResponse.json({ error: "Manifest data is required" }, { status: 400 })
    }

    const deploymentConfig = {
      projectId: "ai-agent-platform",
      region: "asia-northeast1",
      services: manifest.agents.map((agent: any) => ({
        name: agent.name,
        image: agent.manifest.spec.image,
        manifest: agent.manifest,
        deployCommand: `gcloud run deploy ${agent.name} --image ${agent.manifest.spec.image} --region asia-northeast1 --platform managed --allow-unauthenticated`,
        buildCommand: `docker build -t ${agent.manifest.spec.image} . && docker push ${agent.manifest.spec.image}`,
      })),
      deploymentScript: generateDeploymentScript(manifest.agents),
      status: "ready",
    }

    return NextResponse.json(deploymentConfig)
  } catch (error) {
    console.error("Deployment preparation error:", error)
    return NextResponse.json({ error: "Deployment preparation failed" }, { status: 500 })
  }
}

function generateDeploymentScript(agents: any[]) {
  const commands = agents
    .map(
      (agent) =>
        `echo "Deploying ${agent.name}..."\ngcloud run deploy ${agent.name} --image ${agent.manifest.spec.image} --region asia-northeast1 --platform managed --allow-unauthenticated`,
    )
    .join("\n\n")

  return `#!/bin/bash
set -e

echo "Starting deployment of AI agents..."

${commands}

echo "All agents deployed successfully!"
`
}
