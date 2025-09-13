"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Cloud,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Globe,
  Terminal,
  FileText,
  ExternalLink,
} from "lucide-react"

interface DeploymentConfig {
  projectId: string
  region: string
  serviceName: string
  image: string
  port: number
  cpu: string
  memory: string
  minInstances: number
  maxInstances: number
  concurrency: number
  timeout: number
  environmentVariables: Record<string, string>
}

interface DeploymentStatus {
  status: "idle" | "building" | "deploying" | "running" | "error"
  progress: number
  currentStep: string
  logs: Array<{ timestamp: string; level: "info" | "warn" | "error"; message: string }>
  url?: string
  revision?: string
}

interface CloudRunDeploymentProps {
  deploymentConfig?: {
    projectId: string
    region: string
    services: Array<{
      name: string
      image: string
      manifest: any
      deployCommand: string
      buildCommand: string
    }>
    deploymentScript: string
    status: string
  }
}

export function CloudRunDeployment({ deploymentConfig: workflowDeploymentConfig }: CloudRunDeploymentProps) {
  const [config, setConfig] = useState<DeploymentConfig>(() => {
    if (workflowDeploymentConfig?.services && workflowDeploymentConfig.services.length > 0) {
      const firstService = workflowDeploymentConfig.services[0]
      return {
        projectId: workflowDeploymentConfig.projectId,
        region: workflowDeploymentConfig.region,
        serviceName: firstService.name,
        image: firstService.image,
        port: firstService.manifest?.spec?.ports?.[0]?.containerPort || 8080,
        cpu: firstService.manifest?.spec?.resources?.requests?.cpu || "1",
        memory: firstService.manifest?.spec?.resources?.requests?.memory || "2Gi",
        minInstances: 0,
        maxInstances: 10,
        concurrency: 80,
        timeout: 300,
        environmentVariables: firstService.manifest?.spec?.env?.reduce((acc: Record<string, string>, env: any) => {
          acc[env.name] = env.value
          return acc
        }, {}) || {
          OPENAI_API_KEY: "${OPENAI_API_KEY}",
          SUPABASE_URL: "${SUPABASE_URL}",
          SUPABASE_SERVICE_ROLE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}",
        },
      }
    }

    return {
      projectId: "ai-agent-platform",
      region: "asia-northeast1",
      serviceName: "resume-parser-agent",
      image: "asia-northeast1-docker.pkg.dev/ai-agent-platform/agents/resume-parser:latest",
      port: 8080,
      cpu: "1",
      memory: "2Gi",
      minInstances: 0,
      maxInstances: 10,
      concurrency: 80,
      timeout: 300,
      environmentVariables: {
        OPENAI_API_KEY: "${OPENAI_API_KEY}",
        SUPABASE_URL: "${SUPABASE_URL}",
        SUPABASE_SERVICE_ROLE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}",
      },
    }
  })

  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: workflowDeploymentConfig?.status === "ready" ? "idle" : "idle",
    progress: 0,
    currentStep: workflowDeploymentConfig?.status === "ready" ? "デプロイ準備完了" : "待機中",
    logs: [
      {
        timestamp: "2024-01-15 10:30:00",
        level: "info",
        message: workflowDeploymentConfig?.status === "ready" ? "デプロイメント準備完了" : "デプロイメント準備完了",
      },
      { timestamp: "2024-01-15 10:29:45", level: "info", message: "Manifest検証完了" },
      { timestamp: "2024-01-15 10:29:30", level: "info", message: "Docker イメージ確認済み" },
    ],
  })

  const [activeTab, setActiveTab] = useState("config")

  const handleDeploy = () => {
    setDeploymentStatus((prev) => ({
      ...prev,
      status: "building",
      progress: 10,
      currentStep: "Docker イメージビルド中...",
      logs: [{ timestamp: new Date().toLocaleString(), level: "info", message: "デプロイメント開始" }, ...prev.logs],
    }))

    // Simulate deployment process
    setTimeout(() => {
      setDeploymentStatus((prev) => ({
        ...prev,
        progress: 40,
        currentStep: "Cloud Run サービス作成中...",
        logs: [
          { timestamp: new Date().toLocaleString(), level: "info", message: "Docker イメージビルド完了" },
          ...prev.logs,
        ],
      }))
    }, 2000)

    setTimeout(() => {
      setDeploymentStatus((prev) => ({
        ...prev,
        status: "deploying",
        progress: 70,
        currentStep: "サービスデプロイ中...",
        logs: [
          { timestamp: new Date().toLocaleString(), level: "info", message: "Cloud Run サービス作成完了" },
          ...prev.logs,
        ],
      }))
    }, 4000)

    setTimeout(() => {
      setDeploymentStatus((prev) => ({
        ...prev,
        status: "running",
        progress: 100,
        currentStep: "デプロイ完了",
        url: `https://${config.serviceName}-${config.region}-${config.projectId}.a.run.app`,
        revision: `${config.serviceName}-00001-abc`,
        logs: [
          { timestamp: new Date().toLocaleString(), level: "info", message: "デプロイメント完了" },
          { timestamp: new Date().toLocaleString(), level: "info", message: "ヘルスチェック成功" },
          ...prev.logs,
        ],
      }))
    }, 6000)
  }

  const getStatusIcon = () => {
    switch (deploymentStatus.status) {
      case "idle":
        return <Clock className="w-4 h-4" />
      case "building":
        return <Settings className="w-4 h-4 animate-spin" />
      case "deploying":
        return <Cloud className="w-4 h-4 animate-pulse" />
      case "running":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (deploymentStatus.status) {
      case "idle":
        return "secondary"
      case "building":
        return "default"
      case "deploying":
        return "default"
      case "running":
        return "default"
      case "error":
        return "destructive"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Cloud Run デプロイメント
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor()} className="text-xs">
            {getStatusIcon()}
            <span className="ml-1">{deploymentStatus.currentStep}</span>
          </Badge>
        </div>
      </div>

      {/* Show available services if workflow deployment config exists */}
      {workflowDeploymentConfig?.services && workflowDeploymentConfig.services.length > 1 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">デプロイ対象サービス</h4>
          <div className="space-y-2">
            {workflowDeploymentConfig.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <h5 className="text-sm font-medium">{service.name}</h5>
                  <p className="text-xs text-muted-foreground">{service.image}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  準備完了
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Deployment Progress */}
      {deploymentStatus.status !== "idle" && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">デプロイメント進行状況</h4>
              <span className="text-sm text-muted-foreground">{deploymentStatus.progress}%</span>
            </div>
            <Progress value={deploymentStatus.progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{deploymentStatus.currentStep}</p>

            {deploymentStatus.url && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                <Globe className="w-4 h-4 text-green-600" />
                <span className="text-sm">サービスURL: </span>
                <a
                  href={deploymentStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {deploymentStatus.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">設定</TabsTrigger>
          <TabsTrigger value="resources">リソース</TabsTrigger>
          <TabsTrigger value="monitoring">監視</TabsTrigger>
          <TabsTrigger value="logs">ログ</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4">基本設定</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">プロジェクトID</Label>
                <Input
                  id="projectId"
                  value={config.projectId}
                  onChange={(e) => setConfig((prev) => ({ ...prev, projectId: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="region">リージョン</Label>
                <Select
                  value={config.region}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, region: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia-northeast1">asia-northeast1 (東京)</SelectItem>
                    <SelectItem value="asia-northeast2">asia-northeast2 (大阪)</SelectItem>
                    <SelectItem value="us-central1">us-central1 (アイオワ)</SelectItem>
                    <SelectItem value="europe-west1">europe-west1 (ベルギー)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="serviceName">サービス名</Label>
                <Input
                  id="serviceName"
                  value={config.serviceName}
                  onChange={(e) => setConfig((prev) => ({ ...prev, serviceName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="port">ポート</Label>
                <Input
                  id="port"
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig((prev) => ({ ...prev, port: Number.parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="image">Docker イメージ</Label>
              <Input
                id="image"
                value={config.image}
                onChange={(e) => setConfig((prev) => ({ ...prev, image: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-4">環境変数</h4>
            <div className="space-y-3">
              {Object.entries(config.environmentVariables).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-2">
                  <Input value={key} readOnly className="bg-muted" />
                  <Input
                    value={value}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        environmentVariables: { ...prev.environmentVariables, [key]: e.target.value },
                      }))
                    }
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Show deployment script if available */}
          {workflowDeploymentConfig?.deploymentScript && (
            <Card className="p-4">
              <h4 className="font-medium mb-4">デプロイメントスクリプト</h4>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                <pre>{workflowDeploymentConfig.deploymentScript}</pre>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              リソース設定
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpu">CPU</Label>
                <Select value={config.cpu} onValueChange={(value) => setConfig((prev) => ({ ...prev, cpu: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5 vCPU</SelectItem>
                    <SelectItem value="1">1 vCPU</SelectItem>
                    <SelectItem value="2">2 vCPU</SelectItem>
                    <SelectItem value="4">4 vCPU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="memory">メモリ</Label>
                <Select
                  value={config.memory}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, memory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Gi">1 GB</SelectItem>
                    <SelectItem value="2Gi">2 GB</SelectItem>
                    <SelectItem value="4Gi">4 GB</SelectItem>
                    <SelectItem value="8Gi">8 GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minInstances">最小インスタンス数</Label>
                <Input
                  id="minInstances"
                  type="number"
                  value={config.minInstances}
                  onChange={(e) => setConfig((prev) => ({ ...prev, minInstances: Number.parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="maxInstances">最大インスタンス数</Label>
                <Input
                  id="maxInstances"
                  type="number"
                  value={config.maxInstances}
                  onChange={(e) => setConfig((prev) => ({ ...prev, maxInstances: Number.parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="concurrency">同時実行数</Label>
                <Input
                  id="concurrency"
                  type="number"
                  value={config.concurrency}
                  onChange={(e) => setConfig((prev) => ({ ...prev, concurrency: Number.parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="timeout">タイムアウト (秒)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={config.timeout}
                  onChange={(e) => setConfig((prev) => ({ ...prev, timeout: Number.parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-4">コスト見積もり</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">¥2,400</div>
                <div className="text-xs text-muted-foreground">月額見積もり</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">¥0.08</div>
                <div className="text-xs text-muted-foreground">リクエスト単価</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">30,000</div>
                <div className="text-xs text-muted-foreground">月間リクエスト想定</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              サービス監視
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">稼働状況</span>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    正常
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">アクティブインスタンス</span>
                  <span className="text-sm font-medium">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">平均レスポンス時間</span>
                  <span className="text-sm font-medium">245ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">エラー率</span>
                  <span className="text-sm font-medium">0.02%</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU使用率</span>
                  <div className="flex items-center gap-2">
                    <Progress value={35} className="w-16 h-2" />
                    <span className="text-sm font-medium">35%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">メモリ使用率</span>
                  <div className="flex items-center gap-2">
                    <Progress value={62} className="w-16 h-2" />
                    <span className="text-sm font-medium">62%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">今日のリクエスト数</span>
                  <span className="text-sm font-medium">1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">今月のコスト</span>
                  <span className="text-sm font-medium">¥1,890</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-4">アラート設定</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="text-sm font-medium">エラー率 &gt; 5%</div>
                  <div className="text-xs text-muted-foreground">Slack通知</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  有効
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="text-sm font-medium">レスポンス時間 &gt; 1000ms</div>
                  <div className="text-xs text-muted-foreground">メール通知</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  有効
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="text-sm font-medium">CPU使用率 &gt; 80%</div>
                  <div className="text-xs text-muted-foreground">自動スケール</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  有効
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                デプロイメントログ
              </h4>
              <Button size="sm" variant="outline">
                <FileText className="w-3 h-3 mr-1" />
                ログエクスポート
              </Button>
            </div>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {deploymentStatus.logs.map((log, index) => (
                <div key={index} className="flex gap-2 mb-1">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <span
                    className={
                      log.level === "error"
                        ? "text-red-400"
                        : log.level === "warn"
                          ? "text-yellow-400"
                          : "text-green-400"
                    }
                  >
                    [{log.level.toUpperCase()}]
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={deploymentStatus.status !== "idle"}>
            <Settings className="w-3 h-3 mr-1" />
            設定検証
          </Button>
          <Button size="sm" variant="outline" disabled={deploymentStatus.status !== "running"}>
            <RotateCcw className="w-3 h-3 mr-1" />
            ロールバック
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={deploymentStatus.status === "building" || deploymentStatus.status === "deploying"}
          >
            <Pause className="w-3 h-3 mr-1" />
            停止
          </Button>
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={deploymentStatus.status === "building" || deploymentStatus.status === "deploying"}
          >
            <Play className="w-3 h-3 mr-1" />
            デプロイ
          </Button>
        </div>
      </div>
    </div>
  )
}
