"use client"

import { Button } from "@/components/ui/button"
import { Plus, Command, Upload } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function Sidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get("view") || "chat"

  const navigateTo = (view: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("view", view)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="bg-sidebar border-r border-sidebar-border p-4 flex flex-col h-full w-full">
      <div className="pt-8 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AI</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">AI Agent Manager</div>
            <div className="text-xs text-muted-foreground truncate">Project: Internal Matching</div>
          </div>
        </div>
      </div>

      <Button
        className="w-full mb-4"
        size="sm"
        onClick={() => navigateTo("new-issue")}
        variant={currentView === "new-issue" ? "default" : "outline"}
      >
        <Plus className="w-4 h-4 mr-2" />
        新規課題
      </Button>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Projects</h3>
        <div className="space-y-1">
          <div
            className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${
              currentView === "projects"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent"
            }`}
            onClick={() => navigateTo("projects")}
          >
            • Matching v1
          </div>
          <div
            className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${
              currentView === "projects"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent"
            }`}
            onClick={() => navigateTo("projects")}
          >
            • SalesOps
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Drafts</h3>
        <div className="space-y-1">
          <div
            className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${
              currentView === "drafts"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent"
            }`}
            onClick={() => navigateTo("drafts")}
          >
            • 未保存の課題
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">最近の定義</h3>
        <div className="space-y-1">
          <div
            className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${
              currentView === "definitions"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent"
            }`}
            onClick={() => navigateTo("definitions")}
          >
            • problem.yaml
          </div>
          <div
            className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${
              currentView === "definitions"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent"
            }`}
            onClick={() => navigateTo("definitions")}
          >
            • usecases.yaml
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <h3 className="text-sm font-medium mb-2">クイック操作</h3>
        <div className="flex gap-2">
          <Button
            variant={currentView === "import" ? "default" : "outline"}
            size="sm"
            className="flex-1 bg-transparent min-w-0"
            onClick={() => navigateTo("import")}
          >
            <Upload className="w-4 h-4 mr-1" />
            <span className="truncate">インポート</span>
          </Button>
          <Button
            variant={currentView === "command" ? "default" : "outline"}
            size="sm"
            className="flex-1 bg-transparent min-w-0"
            onClick={() => navigateTo("command")}
          >
            <Command className="w-4 h-4 mr-1" />
            <span className="truncate">コマンド</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
