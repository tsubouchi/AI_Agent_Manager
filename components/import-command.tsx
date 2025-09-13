"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Database, Code, Terminal, Play, Copy, Check } from "lucide-react"
import { HomeNavigation } from "@/components/home-navigation"

const commandTemplates = [
  {
    id: 1,
    name: "Pain分析実行",
    description: "課題の詳細分析を実行",
    command: "analyze-pain --input problem.yaml --output pain-analysis.json",
    category: "analysis",
  },
  {
    id: 2,
    name: "ソリューション生成",
    description: "AIエージェント設計を生成",
    command: "generate-solution --pain-analysis pain-analysis.json --output solution.yaml",
    category: "generation",
  },
  {
    id: 3,
    name: "エージェント実装",
    description: "エージェントコードを生成",
    command: "implement-agent --solution solution.yaml --framework nextjs",
    category: "implementation",
  },
  {
    id: 4,
    name: "デプロイ実行",
    description: "エージェントをデプロイ",
    command: "deploy-agent --config deploy.yaml --environment production",
    category: "deployment",
  },
]

interface TemplateCardProps {
  template: (typeof commandTemplates)[0]
  copiedCommand: string | null
  onCopy: (command: string) => void
  onUse: (command: string) => void
}

function TemplateCard({ template, copiedCommand, onCopy, onUse }: TemplateCardProps) {
  const handleCopyClick = useCallback(() => {
    onCopy(template.command)
  }, [onCopy, template.command])

  const handleUseClick = useCallback(() => {
    onUse(template.command)
  }, [onUse, template.command])

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </div>
          <Badge variant="outline">{template.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded-lg">
          <code className="text-sm font-mono">{template.command}</code>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyClick}>
            {copiedCommand === template.command ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            コピー
          </Button>
          <Button size="sm" onClick={handleUseClick}>
            <Code className="w-4 h-4 mr-2" />
            使用
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ImportCommand() {
  const [activeTab, setActiveTab] = useState("import")
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [commandInput, setCommandInput] = useState("")
  const [commandOutput, setCommandOutput] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setUploadedFiles((prev) => [...prev, ...files])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...files])
    }
  }, [])

  const executeCommand = useCallback(async () => {
    if (!commandInput.trim()) return

    setIsExecuting(true)
    setCommandOutput("コマンドを実行中...")

    // Simulate command execution
    setTimeout(() => {
      setCommandOutput(
        `$ ${commandInput}\n\n実行完了: ${new Date().toLocaleString()}\n\n結果:\n- 分析完了\n- ファイル生成: output.json\n- ステータス: 成功`,
      )
      setIsExecuting(false)
    }, 2000)
  }, [commandInput])

  const copyCommand = useCallback((command: string) => {
    navigator.clipboard.writeText(command)
    setCopiedCommand(command)
    setTimeout(() => setCopiedCommand(null), 2000)
  }, [])

  const useTemplate = useCallback((command: string) => {
    setCommandInput(command)
    setActiveTab("command")
  }, [])

  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleCommandInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCommandInput(e.target.value)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        executeCommand()
      }
    },
    [executeCommand],
  )

  return (
    <div className="h-full flex flex-col bg-background">
      <HomeNavigation />

      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">インポート・コマンド</h1>
            <p className="text-muted-foreground">ファイルのインポートとコマンド実行</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import">インポート</TabsTrigger>
            <TabsTrigger value="command">コマンド</TabsTrigger>
            <TabsTrigger value="templates">テンプレート</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  ファイルアップロード
                </CardTitle>
                <CardDescription>YAML、JSON、CSVファイルをドラッグ&ドロップまたは選択してアップロード</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">ファイルをドロップ</p>
                  <p className="text-muted-foreground mb-4">または</p>
                  <Button variant="outline" onClick={handleFileInputClick}>
                    ファイルを選択
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".yaml,.yml,.json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-medium">アップロード済みファイル</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Badge variant="outline">{file.name.split(".").pop()?.toUpperCase()}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  データベースインポート
                </CardTitle>
                <CardDescription>外部データベースからデータをインポート</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="db-type">データベース種類</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="mongodb">MongoDB</SelectItem>
                        <SelectItem value="supabase">Supabase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="connection">接続文字列</Label>
                    <Input id="connection" placeholder="postgresql://user:pass@host:port/db" type="password" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="query">クエリ</Label>
                  <Textarea id="query" placeholder="SELECT * FROM users WHERE created_at > '2024-01-01'" rows={3} />
                </div>
                <Button>
                  <Database className="w-4 h-4 mr-2" />
                  データをインポート
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="command" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  コマンド実行
                </CardTitle>
                <CardDescription>AIエージェント管理コマンドを実行</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="command-input">コマンド</Label>
                  <div className="flex gap-2">
                    <Input
                      id="command-input"
                      placeholder="analyze-pain --input problem.yaml"
                      value={commandInput}
                      onChange={handleCommandInputChange}
                      onKeyDown={handleKeyDown}
                    />
                    <Button onClick={executeCommand} disabled={isExecuting || !commandInput.trim()}>
                      <Play className="w-4 h-4 mr-2" />
                      実行
                    </Button>
                  </div>
                </div>

                {commandOutput && (
                  <div>
                    <Label>出力</Label>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">{commandOutput}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {commandTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  copiedCommand={copiedCommand}
                  onCopy={copyCommand}
                  onUse={useTemplate}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
