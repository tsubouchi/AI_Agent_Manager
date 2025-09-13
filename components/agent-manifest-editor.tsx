"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertCircle, FileText, Download, Upload, Play, Settings, Plus, X, Code } from "lucide-react"

interface AgentManifest {
  apiVersion: string
  kind: string
  metadata: {
    name: string
    version: string
    owner: string
  }
  spec: {
    role: string
    inputs: Array<{ name: string; schema: string }>
    outputs: Array<{ name: string; schema: string }>
    tasks: string[]
    tools: Array<{
      name: string
      type: string
      params: Record<string, any>
    }>
    policies: {
      sla: { timeout_sec: number; retries: number }
      pii: { mask: string[] }
      fairness: { deny_features: string[] }
    }
    runtime: {
      type: string
      image: string
      env: string[]
    }
    observability: {
      tracing: boolean
      log_level: string
    }
  }
}

export function AgentManifestEditor() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["resume-parser", "skill-normalizer"])
  const [activeAgent, setActiveAgent] = useState<string>("resume-parser")
  const [validationStatus, setValidationStatus] = useState<"valid" | "invalid" | "pending">("valid")
  const [viewMode, setViewMode] = useState<"form" | "yaml">("form")

  const [manifest, setManifest] = useState<AgentManifest>({
    apiVersion: "v1",
    kind: "Agent",
    metadata: {
      name: "resume-parser",
      version: "1.0.0",
      owner: "hr-automation-team",
    },
    spec: {
      role: "履歴書やプロフィール情報からスキル・経験を抽出・正規化し、構造化データとして出力する",
      inputs: [
        { name: "resume_text", schema: "#/schemas/ResumeText" },
        { name: "profile_data", schema: "#/schemas/ProfileData" },
      ],
      outputs: [
        { name: "structured_profile", schema: "#/schemas/StructuredProfile" },
        { name: "skill_tags", schema: "#/schemas/SkillTags" },
      ],
      tasks: [
        "テキストから技術スキル・経験年数を抽出",
        "スキル名の正規化・カテゴライズ",
        "経験レベルの推定・評価",
        "構造化プロフィールデータの生成",
      ],
      tools: [
        {
          name: "llm",
          type: "openai",
          params: {
            model: "gpt-4o-mini",
            temperature: 0.1,
          },
        },
        {
          name: "supabase",
          type: "database",
          params: {
            table: "candidate_profiles",
          },
        },
      ],
      policies: {
        sla: { timeout_sec: 60, retries: 2 },
        pii: { mask: ["email", "phone", "address"] },
        fairness: { deny_features: ["age_bias", "gender_bias"] },
      },
      runtime: {
        type: "cloud-run",
        image: "asia-northeast1-docker.pkg.dev/project/agents/resume-parser:1.0.0",
        env: ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      },
      observability: {
        tracing: true,
        log_level: "info",
      },
    },
  })

  const availableAgents = [
    { id: "resume-parser", name: "Resume Parser", description: "履歴書解析エージェント" },
    { id: "skill-normalizer", name: "Skill Normalizer", description: "スキル正規化エージェント" },
    { id: "matcher-core", name: "Matcher Core", description: "マッチングエンジン" },
    { id: "fairness-review", name: "Fairness Review", description: "公平性チェックエージェント" },
  ]

  const generateYAML = () => {
    return `apiVersion: ${manifest.apiVersion}
kind: ${manifest.kind}
metadata:
  name: "${manifest.metadata.name}"
  version: "${manifest.metadata.version}"
  owner: "${manifest.metadata.owner}"
spec:
  role: "${manifest.spec.role}"
  inputs:${manifest.spec.inputs
    .map(
      (input) => `
    - name: ${input.name}
      schema: "${input.schema}"`,
    )
    .join("")}
  outputs:${manifest.spec.outputs
    .map(
      (output) => `
    - name: ${output.name}
      schema: "${output.schema}"`,
    )
    .join("")}
  tasks:${manifest.spec.tasks
    .map(
      (task) => `
    - "${task}"`,
    )
    .join("")}
  tools:${manifest.spec.tools
    .map(
      (tool) => `
    - name: "${tool.name}"
      type: "${tool.type}"
      params:${Object.entries(tool.params)
        .map(
          ([key, value]) => `
        ${key}: ${typeof value === "string" ? `"${value}"` : value}`,
        )
        .join("")}`,
    )
    .join("")}
  policies:
    sla:
      timeout_sec: ${manifest.spec.policies.sla.timeout_sec}
      retries: ${manifest.spec.policies.sla.retries}
    pii:
      mask: [${manifest.spec.policies.pii.mask.map((item) => `"${item}"`).join(", ")}]
    fairness:
      deny_features: [${manifest.spec.policies.fairness.deny_features.map((item) => `"${item}"`).join(", ")}]
  runtime:
    type: "${manifest.spec.runtime.type}"
    image: "${manifest.spec.runtime.image}"
    env:${manifest.spec.runtime.env
      .map(
        (env) => `
      - "${env}"`,
      )
      .join("")}
  observability:
    tracing: ${manifest.spec.observability.tracing}
    log_level: "${manifest.spec.observability.log_level}"`
  }

  const addInput = () => {
    setManifest((prev) => ({
      ...prev,
      spec: {
        ...prev.spec,
        inputs: [...prev.spec.inputs, { name: "", schema: "" }],
      },
    }))
  }

  const removeInput = (index: number) => {
    setManifest((prev) => ({
      ...prev,
      spec: {
        ...prev.spec,
        inputs: prev.spec.inputs.filter((_, i) => i !== index),
      },
    }))
  }

  const addOutput = () => {
    setManifest((prev) => ({
      ...prev,
      spec: {
        ...prev.spec,
        outputs: [...prev.spec.outputs, { name: "", schema: "" }],
      },
    }))
  }

  const removeOutput = (index: number) => {
    setManifest((prev) => ({
      ...prev,
      spec: {
        ...prev.spec,
        outputs: prev.spec.outputs.filter((_, i) => i !== index),
      },
    }))
  }

  const addTask = () => {
    setManifest((prev) => ({
      ...prev,
      spec: {
        ...prev.spec,
        tasks: [...prev.spec.tasks, ""],
      },
    }))
  }

  const removeTask = (index: number) => {
    setManifest((prev) => ({
      ...prev,
      spec: {
        ...prev.spec,
        tasks: prev.spec.tasks.filter((_, i) => i !== index),
      },
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Agent Manifest エディタ
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setViewMode(viewMode === "form" ? "yaml" : "form")}>
            <Code className="w-3 h-3 mr-1" />
            {viewMode === "form" ? "YAML" : "Form"}
          </Button>
          <Button size="sm" variant="outline">
            <Upload className="w-3 h-3 mr-1" />
            インポート
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-3 h-3 mr-1" />
            エクスポート
          </Button>
        </div>
      </div>

      {/* Agent Selection */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Agent選択</h4>
        <div className="grid grid-cols-2 gap-3">
          {availableAgents.map((agent) => (
            <label
              key={agent.id}
              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selectedAgents.includes(agent.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAgents([...selectedAgents, agent.id])
                  } else {
                    setSelectedAgents(selectedAgents.filter((id) => id !== agent.id))
                  }
                }}
                className="rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Active Agent Editor */}
      {selectedAgents.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">編集中: {activeAgent}</h4>
              <Select value={activeAgent} onValueChange={setActiveAgent}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedAgents.map((agentId) => (
                    <SelectItem key={agentId} value={agentId}>
                      {availableAgents.find((a) => a.id === agentId)?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {validationStatus === "valid" && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  検証OK
                </Badge>
              )}
              {validationStatus === "invalid" && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  エラーあり
                </Badge>
              )}
            </div>
          </div>

          {viewMode === "form" ? (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">基本情報</TabsTrigger>
                <TabsTrigger value="io">入出力</TabsTrigger>
                <TabsTrigger value="tasks">タスク</TabsTrigger>
                <TabsTrigger value="tools">ツール</TabsTrigger>
                <TabsTrigger value="policies">ポリシー</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Agent名</Label>
                    <Input
                      id="name"
                      value={manifest.metadata.name}
                      onChange={(e) =>
                        setManifest((prev) => ({
                          ...prev,
                          metadata: { ...prev.metadata, name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">バージョン</Label>
                    <Input
                      id="version"
                      value={manifest.metadata.version}
                      onChange={(e) =>
                        setManifest((prev) => ({
                          ...prev,
                          metadata: { ...prev.metadata, version: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="owner">オーナー</Label>
                  <Input
                    id="owner"
                    value={manifest.metadata.owner}
                    onChange={(e) =>
                      setManifest((prev) => ({
                        ...prev,
                        metadata: { ...prev.metadata, owner: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="role">役割・目的</Label>
                  <Textarea
                    id="role"
                    value={manifest.spec.role}
                    onChange={(e) =>
                      setManifest((prev) => ({
                        ...prev,
                        spec: { ...prev.spec, role: e.target.value },
                      }))
                    }
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="io" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>入力</Label>
                    <Button size="sm" variant="outline" onClick={addInput}>
                      <Plus className="w-3 h-3 mr-1" />
                      追加
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {manifest.spec.inputs.map((input, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="入力名"
                          value={input.name}
                          onChange={(e) => {
                            const newInputs = [...manifest.spec.inputs]
                            newInputs[index].name = e.target.value
                            setManifest((prev) => ({
                              ...prev,
                              spec: { ...prev.spec, inputs: newInputs },
                            }))
                          }}
                        />
                        <Input
                          placeholder="スキーマ"
                          value={input.schema}
                          onChange={(e) => {
                            const newInputs = [...manifest.spec.inputs]
                            newInputs[index].schema = e.target.value
                            setManifest((prev) => ({
                              ...prev,
                              spec: { ...prev.spec, inputs: newInputs },
                            }))
                          }}
                        />
                        <Button size="sm" variant="outline" onClick={() => removeInput(index)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>出力</Label>
                    <Button size="sm" variant="outline" onClick={addOutput}>
                      <Plus className="w-3 h-3 mr-1" />
                      追加
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {manifest.spec.outputs.map((output, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="出力名"
                          value={output.name}
                          onChange={(e) => {
                            const newOutputs = [...manifest.spec.outputs]
                            newOutputs[index].name = e.target.value
                            setManifest((prev) => ({
                              ...prev,
                              spec: { ...prev.spec, outputs: newOutputs },
                            }))
                          }}
                        />
                        <Input
                          placeholder="スキーマ"
                          value={output.schema}
                          onChange={(e) => {
                            const newOutputs = [...manifest.spec.outputs]
                            newOutputs[index].schema = e.target.value
                            setManifest((prev) => ({
                              ...prev,
                              spec: { ...prev.spec, outputs: newOutputs },
                            }))
                          }}
                        />
                        <Button size="sm" variant="outline" onClick={() => removeOutput(index)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>実行タスク</Label>
                  <Button size="sm" variant="outline" onClick={addTask}>
                    <Plus className="w-3 h-3 mr-1" />
                    追加
                  </Button>
                </div>
                <div className="space-y-2">
                  {manifest.spec.tasks.map((task, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="タスク内容"
                        value={task}
                        onChange={(e) => {
                          const newTasks = [...manifest.spec.tasks]
                          newTasks[index] = e.target.value
                          setManifest((prev) => ({
                            ...prev,
                            spec: { ...prev.spec, tasks: newTasks },
                          }))
                        }}
                      />
                      <Button size="sm" variant="outline" onClick={() => removeTask(index)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tools" className="space-y-4">
                <div>
                  <Label className="mb-3 block">使用ツール</Label>
                  <div className="space-y-3">
                    {manifest.spec.tools.map((tool, index) => (
                      <Card key={index} className="p-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Input
                            placeholder="ツール名"
                            value={tool.name}
                            onChange={(e) => {
                              const newTools = [...manifest.spec.tools]
                              newTools[index].name = e.target.value
                              setManifest((prev) => ({
                                ...prev,
                                spec: { ...prev.spec, tools: newTools },
                              }))
                            }}
                          />
                          <Select
                            value={tool.type}
                            onValueChange={(value) => {
                              const newTools = [...manifest.spec.tools]
                              newTools[index].type = value
                              setManifest((prev) => ({
                                ...prev,
                                spec: { ...prev.spec, tools: newTools },
                              }))
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="database">Database</SelectItem>
                              <SelectItem value="http">HTTP</SelectItem>
                              <SelectItem value="storage">Storage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="text-xs text-muted-foreground">パラメータ: {JSON.stringify(tool.params)}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="policies" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>タイムアウト (秒)</Label>
                    <Input
                      type="number"
                      value={manifest.spec.policies.sla.timeout_sec}
                      onChange={(e) =>
                        setManifest((prev) => ({
                          ...prev,
                          spec: {
                            ...prev.spec,
                            policies: {
                              ...prev.spec.policies,
                              sla: { ...prev.spec.policies.sla, timeout_sec: Number.parseInt(e.target.value) },
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>リトライ回数</Label>
                    <Input
                      type="number"
                      value={manifest.spec.policies.sla.retries}
                      onChange={(e) =>
                        setManifest((prev) => ({
                          ...prev,
                          spec: {
                            ...prev.spec,
                            policies: {
                              ...prev.spec.policies,
                              sla: { ...prev.spec.policies.sla, retries: Number.parseInt(e.target.value) },
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>PII マスク対象</Label>
                  <Input
                    placeholder="email, phone, address (カンマ区切り)"
                    value={manifest.spec.policies.pii.mask.join(", ")}
                    onChange={(e) =>
                      setManifest((prev) => ({
                        ...prev,
                        spec: {
                          ...prev.spec,
                          policies: {
                            ...prev.spec.policies,
                            pii: { mask: e.target.value.split(",").map((s) => s.trim()) },
                          },
                        },
                      }))
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">{generateYAML()}</pre>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Settings className="w-3 h-3 mr-1" />
                Lint
              </Button>
              <Button size="sm" variant="outline">
                署名
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Play className="w-3 h-3 mr-1" />
                テスト実行
              </Button>
              <Button size="sm">保存</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
