"use client"

import { useState, useEffect, useRef } from "react"
import { WorkflowEngine, type WorkflowStage, type WorkflowContext } from "@/lib/workflow-engine"

export function useWorkflow() {
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [context, setContext] = useState<WorkflowContext>({ userInput: "" })
  const [isRunning, setIsRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<string>("")
  const engineRef = useRef<WorkflowEngine>()
  const startedRef = useRef(false)

  useEffect(() => {
    engineRef.current = new WorkflowEngine()

    const unsubscribe = engineRef.current.subscribe((newStages, newContext) => {
      setStages(newStages)
      setContext(newContext)

      const hasRunningStage = newStages.some((stage) => stage.status === "running")
      const hasPendingStage = newStages.some((stage) => stage.status === "pending")
      // Consider "running" only when a stage is actively running, or when a started workflow still has pending stages
      setIsRunning(hasRunningStage || (startedRef.current && hasPendingStage))

      // Reset started flag when all stages are completed or errored (no pending/running)
      if (!hasRunningStage && !hasPendingStage) {
        startedRef.current = false
      }

      const runningStage = newStages.find((stage) => stage.status === "running")
      if (runningStage) {
        const phaseMap: Record<string, string> = {
          "Pain Analysis": "pain thinking",
          "Solution Design": "solution thinking",
          "Agent Generation": "agent thinking",
          "Manifest Generation": "manifest thinking",
          "Deployment Preparation": "deployment thinking",
        }
        setCurrentPhase(phaseMap[runningStage.name] || "thinking")
      } else {
        setCurrentPhase("")
      }
    })

    return unsubscribe
  }, [])

  const startWorkflow = async (userInput: string) => {
    if (engineRef.current) {
      startedRef.current = true
      setIsRunning(true)
      await engineRef.current.startWorkflow(userInput)
    }
  }

  return {
    stages,
    context,
    isRunning,
    currentPhase,
    startWorkflow,
  }
}
