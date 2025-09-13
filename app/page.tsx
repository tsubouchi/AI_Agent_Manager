"use client"

import type React from "react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { OutputPanels } from "@/components/output-panels"
import { NewIssueFlow } from "@/components/new-issue-flow"
import { ProjectManagement } from "@/components/project-management"
import { ImportCommand } from "@/components/import-command"
import { DraftsManager } from "@/components/drafts-manager"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

export default function HomePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatWidth, setChatWidth] = useState(50)
  const searchParams = useSearchParams()
  const currentView = searchParams.get("view") || "chat"

  const handleResize = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startWidth = chatWidth

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth - (sidebarCollapsed ? 0 : 288)
      const deltaX = e.clientX - startX
      const deltaPercent = (deltaX / containerWidth) * 100
      const newWidth = Math.max(30, Math.min(70, startWidth + deltaPercent))
      setChatWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const renderMainContent = () => {
    switch (currentView) {
      case "new-issue":
        return <NewIssueFlow />
      case "projects":
        return <ProjectManagement />
      case "import":
      case "command":
        return <ImportCommand />
      case "drafts":
      case "definitions":
        return <DraftsManager />
      default:
        return <ChatInterface />
    }
  }

  const renderRightPanel = () => {
    if (currentView === "chat") {
      return <OutputPanels />
    }
    return null
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        className={`absolute top-4 z-50 bg-background/80 backdrop-blur-sm border transition-all duration-300 ${
          sidebarCollapsed ? "left-4" : "left-76"
        } md:${sidebarCollapsed ? "left-4" : "left-76"}`}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </Button>

      <div className="flex w-full min-w-0">
        <div
          className={`transition-all duration-300 flex-shrink-0 ${
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-72 md:w-72"
          }`}
        >
          <Sidebar />
        </div>

        <div className="flex-1 flex min-w-0 overflow-hidden">
          <div
            style={{ width: renderRightPanel() ? `${chatWidth}%` : "100%" }}
            className="min-w-0 flex-shrink-0 overflow-hidden"
          >
            {renderMainContent()}
          </div>

          {renderRightPanel() && (
            <>
              <div
                className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors flex-shrink-0"
                onMouseDown={handleResize}
              />
              <div style={{ width: `${100 - chatWidth}%` }} className="min-w-0 flex-shrink-0 overflow-hidden">
                {renderRightPanel()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
