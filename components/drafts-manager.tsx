"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, FileText, Clock, Edit, Save, Download, Eye, MoreHorizontal } from "lucide-react"
import { HomeNavigation } from "@/components/home-navigation"

const mockDrafts = [
  {
    id: 1,
    title: "顧客セグメンテーション改善",
    description: "機械学習を活用した顧客分類システムの構築",
    lastModified: "2024-01-08 14:30",
    author: "田中",
    status: "draft",
    wordCount: 1250,
    category: "data-analysis",
  },
  {
    id: 2,
    title: "営業プロセス自動化",
    description: "CRMとの連携による営業活動の効率化",
    lastModified: "2024-01-07 16:45",
    author: "佐藤",
    status: "review",
    wordCount: 890,
    category: "automation",
  },
  {
    id: 3,
    title: "チャットボット改善案",
    description: "顧客対応の質向上のためのAIチャットボット機能拡張",
    lastModified: "2024-01-06 11:20",
    author: "鈴木",
    status: "draft",
    wordCount: 2100,
    category: "customer-service",
  },
]

const mockDefinitions = [
  {
    id: 1,
    name: "problem.yaml",
    description: "ビジネス課題定義テンプレート",
    lastModified: "2024-01-08 09:15",
    size: "2.4 KB",
    type: "yaml",
    usage: 15,
  },
  {
    id: 2,
    name: "usecases.yaml",
    description: "ユースケース定義テンプレート",
    lastModified: "2024-01-07 13:22",
    size: "3.1 KB",
    type: "yaml",
    usage: 8,
  },
  {
    id: 3,
    name: "agent-config.json",
    description: "AIエージェント設定テンプレート",
    lastModified: "2024-01-05 10:30",
    size: "1.8 KB",
    type: "json",
    usage: 12,
  },
  {
    id: 4,
    name: "deployment.yaml",
    description: "デプロイメント設定テンプレート",
    lastModified: "2024-01-04 15:45",
    size: "1.2 KB",
    type: "yaml",
    usage: 6,
  },
]

export function DraftsManager() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("drafts")
  const [showNewDraftModal, setShowNewDraftModal] = useState(false)
  const [newDraftTitle, setNewDraftTitle] = useState("")
  const [newDraftDescription, setNewDraftDescription] = useState("")

  const handleCreateNewDraft = () => {
    if (newDraftTitle.trim()) {
      // Here you would typically save to database
      console.log("Creating new draft:", { title: newDraftTitle, description: newDraftDescription })
      setNewDraftTitle("")
      setNewDraftDescription("")
      setShowNewDraftModal(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      review: "outline",
      published: "default",
    } as const

    const labels = {
      draft: "下書き",
      review: "レビュー中",
      published: "公開済み",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getCategoryBadge = (category: string) => {
    const labels = {
      "data-analysis": "データ分析",
      automation: "自動化",
      "customer-service": "顧客対応",
    }

    return <Badge variant="outline">{labels[category as keyof typeof labels] || category}</Badge>
  }

  const getFileIcon = (type: string) => {
    return <FileText className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <HomeNavigation />

      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">下書き・定義管理</h1>
            <p className="text-muted-foreground">未保存の課題と定義ファイルを管理</p>
          </div>
          <Button onClick={() => setShowNewDraftModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="下書きや定義を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drafts">下書き</TabsTrigger>
            <TabsTrigger value="definitions">定義ファイル</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="space-y-4">
            <div className="space-y-3">
              {mockDrafts.map((draft) => (
                <Card key={draft.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium truncate">{draft.title}</h4>
                          {getStatusBadge(draft.status)}
                          {getCategoryBadge(draft.category)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{draft.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{draft.lastModified}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className="text-xs">{draft.author[0]}</AvatarFallback>
                            </Avatar>
                            <span>{draft.author}</span>
                          </div>
                          <span>{draft.wordCount} 文字</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Save className="w-4 h-4" />
                        </Button>
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

          <TabsContent value="definitions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {mockDefinitions.map((definition) => (
                <Card key={definition.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getFileIcon(definition.type)}
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{definition.name}</CardTitle>
                          <CardDescription>{definition.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">{definition.type.toUpperCase()}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{definition.lastModified}</span>
                      </div>
                      <span>{definition.size}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">使用回数: </span>
                        <span className="font-medium">{definition.usage}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          表示
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          DL
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showNewDraftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">新規下書き作成</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">タイトル</label>
                <Input
                  value={newDraftTitle}
                  onChange={(e) => setNewDraftTitle(e.target.value)}
                  placeholder="下書きのタイトルを入力..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">説明</label>
                <Input
                  value={newDraftDescription}
                  onChange={(e) => setNewDraftDescription(e.target.value)}
                  placeholder="下書きの説明を入力..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewDraftModal(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateNewDraft}>作成</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
