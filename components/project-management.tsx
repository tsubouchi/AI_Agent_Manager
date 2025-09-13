"use client"

import { useState } from "react"
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

const mockProjects = [
  {
    id: 1,
    name: "Matching v1",
    description: "顧客マッチングシステムの改善",
    status: "active",
    progress: 75,
    priority: "high",
    dueDate: "2024-01-15",
    team: ["田中", "佐藤", "鈴木"],
    issues: 12,
    completedIssues: 9,
  },
  {
    id: 2,
    name: "SalesOps",
    description: "営業プロセス自動化プロジェクト",
    status: "planning",
    progress: 25,
    priority: "medium",
    dueDate: "2024-02-28",
    team: ["山田", "高橋"],
    issues: 8,
    completedIssues: 2,
  },
]

const mockIssues = [
  {
    id: 1,
    title: "顧客データの可視化不足",
    project: "Matching v1",
    status: "in-progress",
    priority: "high",
    assignee: "田中",
    dueDate: "2024-01-10",
  },
  {
    id: 2,
    title: "マッチング精度の向上",
    project: "Matching v1",
    status: "completed",
    priority: "high",
    assignee: "佐藤",
    dueDate: "2024-01-05",
  },
  {
    id: 3,
    title: "営業レポート自動生成",
    project: "SalesOps",
    status: "todo",
    priority: "medium",
    assignee: "山田",
    dueDate: "2024-01-20",
  },
]

export function ProjectManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("projects")

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

  return (
    <div className="h-full flex flex-col bg-background">
      <HomeNavigation />

      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">プロジェクト管理</h1>
            <p className="text-muted-foreground">進行中のプロジェクトと課題を管理</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規プロジェクト
          </Button>
        </div>

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
              {mockProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(project.status)}
                        <span className="capitalize">{project.status}</span>
                      </div>
                      {getPriorityBadge(project.priority)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>進捗</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>
                          {project.completedIssues}/{project.issues} 課題
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{project.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {project.team.map((member, index) => (
                          <Avatar key={index} className="w-6 h-6 border-2 border-background">
                            <AvatarFallback className="text-xs">{member[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <div className="space-y-3">
              {mockIssues.map((issue) => (
                <Card key={issue.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(issue.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{issue.title}</h4>
                          <p className="text-sm text-muted-foreground">{issue.project}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPriorityBadge(issue.priority)}
                        <div className="text-sm text-muted-foreground">{issue.assignee}</div>
                        <div className="text-sm text-muted-foreground">{issue.dueDate}</div>
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
                  <div className="text-2xl font-bold">2</div>
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
                  <div className="text-2xl font-bold">11</div>
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
                  <div className="text-2xl font-bold">50%</div>
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
