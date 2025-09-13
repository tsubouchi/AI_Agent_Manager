"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  Plus,
  MoreHorizontal,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react"
import { HomeNavigation } from "@/components/home-navigation"

type Project = {
  id: string
  name: string
  description?: string | null
  status?: string | null
  progress?: number | null
  priority?: string | null
  due_date?: string | null
  project_members?: { role?: string | null; members?: { id: string; name: string; avatar_url?: string | null } }[]
}

type Issue = {
  id: string
  project_id: string
  title: string
  status: string
  priority?: string | null
  assignee?: string | null
  due_date?: string | null
  progress?: number | null
  projects?: { id: string; name: string }
}

export function ProjectManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("projects")
  const [projects, setProjects] = useState<Project[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(false)
  const [projStatus, setProjStatus] = useState<string | "">("")
  const [issueStatus, setIssueStatus] = useState<string | "">("")
  const [priorityFilter, setPriorityFilter] = useState<string | "">("")
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", description: "", status: "planning", priority: "medium", progress: 0, due_date: "" })
  const [addingMemberFor, setAddingMemberFor] = useState<string | null>(null)
  const [memberName, setMemberName] = useState("")
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])

  // Fetch from API and subscribe to realtime via supabase client
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [p, i] = await Promise.all([
          fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/issues", { cache: "no-store" }).then((r) => r.json()),
        ])
        if (!mounted) return
        setProjects(Array.isArray(p) ? p : [])
        setIssues(Array.isArray(i) ? i : [])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Optional: subscribe via supabase client if env present
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return
    try {
      const { getSupabaseClient } = require("@/lib/supabase")
      const supabase = getSupabaseClient()
      const refreshProjects = async () => {
        const p = await fetch("/api/projects", { cache: "no-store" }).then((r) => r.json())
        setProjects(Array.isArray(p) ? p : [])
      }
      const refreshIssues = async () => {
        const i = await fetch("/api/issues", { cache: "no-store" }).then((r) => r.json())
        setIssues(Array.isArray(i) ? i : [])
      }
      const channel = supabase
        .channel("pm-stream")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "projects" }, refreshProjects)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects" }, refreshProjects)
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "projects" }, refreshProjects)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "issues" }, refreshIssues)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "issues" }, refreshIssues)
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "issues" }, refreshIssues)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_members" }, refreshProjects)
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "project_members" }, refreshProjects)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "members" }, refreshProjects)
        .subscribe()
      return () => {
        try { supabase.removeChannel(channel) } catch {}
      }
    } catch {}
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "in-progress":
      case "active":
        return <PlayCircle className="w-4 h-4 text-blue-500" />
      case "todo":
      case "planning":
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "outline",
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants] || "outline"}>
        {priority === "high" ? "高" : priority === "medium" ? "中" : "低"}
      </Badge>
    )
  }

  // Derived metrics
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return projects.filter((p) => {
      const matchesQuery = !q || [p.name, p.description || ""].some((x) => x.toLowerCase().includes(q))
      const matchesStatus = !projStatus || (p.status || "") === projStatus
      const matchesPriority = !priorityFilter || (p.priority || "") === priorityFilter
      return matchesQuery && matchesStatus && matchesPriority
    })
  }, [projects, searchQuery, projStatus, priorityFilter])

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return issues.filter((i) => {
      const matchesQuery = !q || [i.title, i.projects?.name || "", i.assignee || ""].some((x) => x.toLowerCase().includes(q))
      const matchesStatus = !issueStatus || i.status === issueStatus
      const matchesPriority = !priorityFilter || (i.priority || "") === priorityFilter
      return matchesQuery && matchesStatus && matchesPriority
    })
  }, [issues, searchQuery, issueStatus, priorityFilter])

  const totalProjects = projects.length
  const completedIssues = issues.filter((i) => i.status === "completed").length
  const avgProgress = (() => {
    const all = projects.map((p) => (p.progress ?? 0))
    if (!all.length) return 0
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length)
  })()

  return (
    <div className="h-full flex flex-col bg-background">
      <HomeNavigation />

      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">プロジェクト管理</h1>
            <p className="text-muted-foreground">進行中のプロジェクトと課題を管理</p>
          </div>
          <Button onClick={() => setShowCreate((v) => !v)}>
            <Plus className="w-4 h-4 mr-2" />
            新規プロジェクト
          </Button>
        </div>

        {showCreate && (
          <form
            className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!createForm.name.trim()) return
              const payload = { ...createForm, progress: Number(createForm.progress) || 0 }
              const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
              if (res.ok) {
                setCreateForm({ name: "", description: "", status: "planning", priority: "medium", progress: 0, due_date: "" })
                setShowCreate(false)
              } else {
                alert("作成に失敗しました")
              }
            }}
          >
            <Input placeholder="プロジェクト名" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="md:col-span-2" />
            <Input placeholder="説明" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className="md:col-span-2" />
            <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className="border rounded h-9 px-2 text-sm bg-background">
              <option value="planning">planning</option>
              <option value="active">active</option>
              <option value="completed">completed</option>
            </select>
            <select value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })} className="border rounded h-9 px-2 text-sm bg-background">
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
            <Input type="number" placeholder="進捗%" value={createForm.progress} onChange={(e) => setCreateForm({ ...createForm, progress: Number(e.target.value) || 0 })} />
            <Input type="date" placeholder="期限" value={createForm.due_date} onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })} />
            <div className="md:col-span-6 flex gap-2">
              <Button type="submit" size="sm">作成</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreate(false)}>キャンセル</Button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="プロジェクトや課題を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={projStatus}
            onChange={(e) => setProjStatus(e.target.value)}
            className="border rounded h-9 px-2 text-sm bg-background"
          >
            <option value="">全ステータス</option>
            <option value="planning">planning</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
          </select>
          <select
            value={issueStatus}
            onChange={(e) => setIssueStatus(e.target.value)}
            className="border rounded h-9 px-2 text-sm bg-background"
          >
            <option value="">課題: 全ステータス</option>
            <option value="todo">todo</option>
            <option value="in-progress">in-progress</option>
            <option value="completed">completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border rounded h-9 px-2 text-sm bg-background"
          >
            <option value="">全優先度</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </div>
      </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">プロジェクト</TabsTrigger>
            <TabsTrigger value="issues">課題</TabsTrigger>
            <TabsTrigger value="analytics">分析</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>{project.description || ""}</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(project.status || "")}
                        <span className="capitalize">{project.status || ""}</span>
                      </div>
                      {getPriorityBadge((project.priority || "") as string)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>進捗</span>
                        <span>{project.progress ?? 0}%</span>
                      </div>
                      <Progress value={project.progress ?? 0} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>
                          {/* Compute counts from issues */}
                          {issues.filter((i) => i.project_id === project.id && i.status === "completed").length}/
                          {issues.filter((i) => i.project_id === project.id).length} 課題
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{project.due_date || ""}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {(project.project_members || []).slice(0, 5).map((pm, idx) => (
                          <Avatar key={pm.members?.id || idx} className="w-6 h-6 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {pm.members?.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 ml-2"
                        onClick={async () => {
                          setAddingMemberFor(project.id)
                          // load members list
                          try {
                            const res = await fetch("/api/members", { cache: "no-store" })
                            const data = await res.json()
                            if (Array.isArray(data)) setMembers(data)
                          } catch {}
                        }}
                      >
                        追加
                      </Button>
                    </div>
                    {addingMemberFor === project.id && (
                      <form
                        className="flex items-center gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault()
                          const name = memberName.trim()
                          if (!name) return
                          // find member by name, else create
                          let member = members.find((m) => m.name === name)
                          if (!member) {
                            const r = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
                            if (r.ok) member = await r.json()
                          }
                          if (!member) return
                          await fetch("/api/project-members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: project.id, member_id: member.id }) })
                          setMemberName("")
                          setAddingMemberFor(null)
                        }}
                      >
                        <Input list={`member-list-${project.id}`} value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="メンバー名" className="h-8" />
                        <datalist id={`member-list-${project.id}`}>
                          {members.map((m) => (
                            <option key={m.id} value={m.name} />
                          ))}
                        </datalist>
                        <Button type="submit" size="sm">追加</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setAddingMemberFor(null)}>キャンセル</Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <Card key={issue.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(issue.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{issue.title}</h4>
                          <p className="text-sm text-muted-foreground">{issue.projects?.name || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPriorityBadge((issue.priority || "") as string)}
                        <div className="text-sm text-muted-foreground">{issue.assignee || ''}</div>
                        <div className="text-sm text-muted-foreground">{issue.due_date || ''}</div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">総プロジェクト数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    前月比 +1
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">完了課題</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedIssues}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    今月 +5
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">平均進捗率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgProgress}%</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    前週比 +15%
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
