"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabaseSidebar } from "@/hooks/use-supabase-sidebar"
import { getSupabaseClient } from "@/lib/supabase"
import { useState } from "react"

// Simple SVG icon components to replace lucide-react
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

const Command = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m15 6-6 6 6 6" />
    <path d="m9 6 6 6-6 6" />
  </svg>
)

const Upload = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
)

export function Sidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get("view") || "chat"
  const { projects, drafts, definitions, userEmail, orgId } = useSupabaseSidebar()
  const supabase = getSupabaseClient() as any
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [creatingProject, setCreatingProject] = useState(false)
  const [showDefForm, setShowDefForm] = useState(false)
  const [newDefName, setNewDefName] = useState("")
  const [creatingDef, setCreatingDef] = useState(false)

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
            <div className="text-xs text-muted-foreground truncate">
              {userEmail ? userEmail : "未ログイン"}
              {orgId ? ` · org: ${orgId}` : ""}
            </div>
          </div>
          {userEmail && (
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => supabase.auth.signOut()}>
              ログアウト
            </Button>
          )}
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Projects</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => setShowProjectForm((v) => !v)}
          >
            追加
          </Button>
        </div>
        {showProjectForm && (
          <form
            className="flex items-center gap-2 mb-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!newProjectName.trim()) return
              try {
                setCreatingProject(true)
                const res = await fetch("/api/projects", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: newProjectName.trim() }),
                })
                if (!res.ok) throw new Error("Failed to create project")
                setNewProjectName("")
                setShowProjectForm(false)
              } catch (err) {
                console.error(err)
                alert("プロジェクト作成に失敗しました。設定をご確認ください。")
              } finally {
                setCreatingProject(false)
              }
            }}
          >
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="プロジェクト名"
              className="h-8"
            />
            <Button type="submit" size="sm" disabled={creatingProject || !newProjectName.trim()}>
              作成
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowProjectForm(false)
                setNewProjectName("")
              }}
            >
              キャンセル
            </Button>
          </form>
        )}
        <div className="space-y-1">
          {projects && projects.length > 0 ? (
            projects.map((p) => (
              <div
                key={p.id}
                className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${
                  currentView === "projects"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent"
                }`}
                onClick={() => navigateTo("projects")}
                title={p.name}
              >
                • {p.name}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-1">プロジェクトがありません</div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Drafts</h3>
        <div className="space-y-1">
          {drafts && drafts.length > 0 ? (
            drafts.map((d) => (
              <div
                key={d.id}
                className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${
                  currentView === "drafts"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent"
                }`}
                onClick={() => navigateTo("drafts")}
                title={d.title}
              >
                • {d.title}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-1">ドラフトはありません</div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">最近の定義</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => setShowDefForm((v) => !v)}
          >
            追加
          </Button>
        </div>
        {showDefForm && (
          <form
            className="flex items-center gap-2 mb-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!newDefName.trim()) return
              try {
                setCreatingDef(true)
                const res = await fetch("/api/definitions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ filename: newDefName.trim(), name: newDefName.trim() }),
                })
                if (!res.ok) throw new Error("Failed to create definition")
                setNewDefName("")
                setShowDefForm(false)
              } catch (err) {
                console.error(err)
                alert("定義の作成に失敗しました。設定をご確認ください。")
              } finally {
                setCreatingDef(false)
              }
            }}
          >
            <Input
              value={newDefName}
              onChange={(e) => setNewDefName(e.target.value)}
              placeholder="ファイル名 / 定義名"
              className="h-8"
            />
            <Button type="submit" size="sm" disabled={creatingDef || !newDefName.trim()}>
              作成
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDefForm(false)
                setNewDefName("")
              }}
            >
              キャンセル
            </Button>
          </form>
        )}
        <div className="space-y-1">
          {definitions && definitions.length > 0 ? (
            definitions.map((f) => (
              <div
                key={f.id}
                className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${
                  currentView === "definitions"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent"
                }`}
                onClick={() => navigateTo("definitions")}
                title={f.name}
              >
                • {f.name}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-1">定義はありません</div>
          )}
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
