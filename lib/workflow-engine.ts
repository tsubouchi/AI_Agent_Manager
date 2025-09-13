export interface WorkflowStage {
  id: string
  name: string
  status: "pending" | "running" | "completed" | "error"
  result?: any
  error?: string
}

export interface WorkflowContext {
  userInput: string
  painAnalysis?: {
    pains: Array<{
      id: string
      title: string
      description: string
      severity: "high" | "medium" | "low"
      category: string
      background: string
      rootCause: string
      impact: string
    }>
    structuralAnalysis: {
      problemDomain: string
      stakeholders: string[]
      constraints: string[]
      dependencies: string[]
    }
  }
  solutionDesign?: {
    solutions: Array<{
      id: string
      title: string
      description: string
      painIds: string[]
      approach: string
      background: string
      architecture: string
      feasibility: string
    }>
    structuralAnalysis: {
      designPrinciples: string[]
      technicalApproach: string
      riskAssessment: string[]
      successMetrics: string[]
    }
  }
  agentGeneration?: {
    agents: Array<{
      id: string
      name: string
      description: string
      capabilities: string[]
      solutionIds: string[]
    }>
  }
  manifest?: {
    agents: Array<{
      name: string
      manifest: any
    }>
  }
}

export class WorkflowEngine {
  private stages: WorkflowStage[] = [
    { id: "pain-analysis", name: "Pain Analysis", status: "pending" },
    { id: "solution-design", name: "Solution Design", status: "pending" },
    { id: "agent-generation", name: "Agent Generation", status: "pending" },
    { id: "manifest-generation", name: "Manifest Generation", status: "pending" },
    { id: "deployment-prep", name: "Deployment Preparation", status: "pending" },
  ]

  private context: WorkflowContext = { userInput: "" }
  private listeners: Array<(stages: WorkflowStage[], context: WorkflowContext) => void> = []

  constructor() {}

  public subscribe(listener: (stages: WorkflowStage[], context: WorkflowContext) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.stages], { ...this.context }))
  }

  public async startWorkflow(userInput: string) {
    this.context.userInput = userInput
    this.stages = this.stages.map((stage) => ({ ...stage, status: "pending" as const }))
    this.notify()

    try {
      // Phase 1: Pain Analysis with background analysis
      await this.executeStage("pain-analysis")

      // Trigger: Proceed to solution design if pains identified
      if (this.context.painAnalysis?.pains.length) {
        await this.executeStage("solution-design")

        // Trigger: Proceed to agent generation if solutions designed
        if (this.context.solutionDesign?.solutions.length) {
          await this.executeStage("agent-generation")

          // Trigger: Proceed to manifest generation if agents created
          if (this.context.agentGeneration?.agents.length) {
            await this.executeStage("manifest-generation")

            // Trigger: Proceed to deployment if manifests ready
            if (this.context.manifest?.agents.length) {
              await this.executeStage("deployment-prep")
            }
          }
        }
      }
    } catch (error) {
      console.error("Workflow execution failed:", error)
    }
  }

  private async executeStage(stageId: string) {
    const stageIndex = this.stages.findIndex((s) => s.id === stageId)
    if (stageIndex === -1) return

    this.stages[stageIndex].status = "running"
    this.notify()

    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      let result: any

      switch (stageId) {
        case "pain-analysis":
          result = await this.executePainAnalysis()
          this.context.painAnalysis = result
          break
        case "solution-design":
          result = await this.executeSolutionDesign()
          this.context.solutionDesign = result
          break
        case "agent-generation":
          result = await this.executeAgentGeneration()
          this.context.agentGeneration = result
          break
        case "manifest-generation":
          result = await this.executeManifestGeneration()
          this.context.manifest = result
          break
        case "deployment-prep":
          result = await this.executeDeploymentPrep()
          break
      }

      this.stages[stageIndex].status = "completed"
      this.stages[stageIndex].result = result
    } catch (error) {
      this.stages[stageIndex].status = "error"
      this.stages[stageIndex].error = error instanceof Error ? error.message : "Unknown error"
    }

    this.notify()
  }

  private async executePainAnalysis() {
    const response = await fetch("/api/workflow/pain-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: this.context.userInput }),
    })

    if (!response.ok) throw new Error("Pain analysis failed")
    return await response.json()
  }

  private async executeSolutionDesign() {
    const response = await fetch("/api/workflow/solution-design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: this.context.userInput,
        painAnalysis: this.context.painAnalysis,
      }),
    })

    if (!response.ok) throw new Error("Solution design failed")
    return await response.json()
  }

  private async executeAgentGeneration() {
    const response = await fetch("/api/workflow/agent-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: this.context.userInput,
        painAnalysis: this.context.painAnalysis,
        solutionDesign: this.context.solutionDesign,
      }),
    })

    if (!response.ok) throw new Error("Agent generation failed")
    return await response.json()
  }

  private async executeManifestGeneration() {
    const response = await fetch("/api/workflow/manifest-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentGeneration: this.context.agentGeneration,
      }),
    })

    if (!response.ok) throw new Error("Manifest generation failed")
    return await response.json()
  }

  private async executeDeploymentPrep() {
    const response = await fetch("/api/workflow/deployment-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manifest: this.context.manifest,
      }),
    })

    if (!response.ok) throw new Error("Deployment preparation failed")
    return await response.json()
  }

  public getStages() {
    return [...this.stages]
  }

  public getContext() {
    return { ...this.context }
  }
}
