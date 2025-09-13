"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { HomeNavigation } from "@/components/home-navigation"

// Simple SVG icon components to replace lucide-react
const FileText = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
)

const Users = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m22 21-3-3m0 0a2 2 0 0 0 0-4 2 2 0 0 0 0 4z" />
  </svg>
)

const Target = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

export function NewIssueFlow() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "",
    category: "",
    stakeholders: "",
    timeline: "",
    context: "",
  })
  const [draftId, setDraftId] = useState<string | null>(null)
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    try {
      setSaving("saving")
      // Ensure latest save
      await persistDraft()
      setSaving("saved")
      console.log("Issue saved:", { id: draftId, ...formData })
      alert("下書きを保存しました。サイドバーに反映されます。")
    } catch (e) {
      console.error(e)
      setSaving("error")
      alert("保存に失敗しました。環境設定をご確認ください。")
    }
  }

  async function persistDraft() {
    const payload = {
      title: formData.title || "(無題の課題)",
      description: formData.description || undefined,
      priority: formData.priority || undefined,
      category: formData.category || undefined,
      stakeholders: formData.stakeholders || undefined,
      timeline: formData.timeline || undefined,
      context: formData.context || undefined,
    }
    if (!draftId) {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Create draft failed")
      const created = (await res.json()) as { id: string }
      setDraftId(created.id)
      return created
    } else {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Update draft failed")
      return await res.json()
    }
  }

  // Auto-save (debounced) on form changes
  useEffect(() => {
    setSaving("saving")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await persistDraft()
        setSaving("saved")
      } catch (e) {
        console.error(e)
        setSaving("error")
      }
    }, 800)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  return (
    <div className="h-full flex flex-col bg-background">
      <HomeNavigation />

      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">新規課題作成</h1>
            <p className="text-muted-foreground">ビジネス課題を定義してAIエージェント開発を開始</p>
          </div>
          <Badge variant="outline">ステップ {step}/3</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  基本情報
                </CardTitle>
                <CardDescription>課題の基本的な情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">課題タイトル</Label>
                  <Input
                    id="title"
                    placeholder="例: 顧客データの可視化不足"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">課題の詳細</Label>
                  <Textarea
                    id="description"
                    placeholder="課題の詳細な説明を入力してください..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">優先度</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="low">低</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">カテゴリ</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data">データ分析</SelectItem>
                        <SelectItem value="automation">自動化</SelectItem>
                        <SelectItem value="customer">顧客対応</SelectItem>
                        <SelectItem value="operations">業務効率</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  ステークホルダーと影響範囲
                </CardTitle>
                <CardDescription>関係者と課題の影響範囲を定義してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="stakeholders">関係者</Label>
                  <Textarea
                    id="stakeholders"
                    placeholder="営業チーム、マーケティング部門、経営陣..."
                    rows={3}
                    value={formData.stakeholders}
                    onChange={(e) => setFormData({ ...formData, stakeholders: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="timeline">希望タイムライン</Label>
                  <Input
                    id="timeline"
                    placeholder="例: 3ヶ月以内"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="context">ビジネスコンテキスト</Label>
                  <Textarea
                    id="context"
                    placeholder="現在の状況、制約条件、期待する成果..."
                    rows={4}
                    value={formData.context}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  確認と作成
                </CardTitle>
                <CardDescription>入力内容を確認して課題を作成してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">課題タイトル</h4>
                    <p className="text-sm text-muted-foreground">{formData.title || "未入力"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">優先度・カテゴリ</h4>
                    <div className="flex gap-2">
                      {formData.priority && (
                        <Badge variant={formData.priority === "high" ? "destructive" : "secondary"}>
                          {formData.priority === "high"
                            ? "高優先度"
                            : formData.priority === "medium"
                              ? "中優先度"
                              : "低優先度"}
                        </Badge>
                      )}
                      {formData.category && <Badge variant="outline">{formData.category}</Badge>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">タイムライン</h4>
                    <p className="text-sm text-muted-foreground">{formData.timeline || "未設定"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
              戻る
            </Button>
            <div className="flex gap-2">
              <span className="text-xs text-muted-foreground self-center min-w-[80px] text-right">
                {saving === "saving" && "保存中..."}
                {saving === "saved" && "保存済み"}
                {saving === "error" && "保存失敗"}
              </span>
              {step < 3 ? (
                <Button onClick={handleNext}>次へ</Button>
              ) : (
                <Button onClick={handleSubmit}>課題を作成</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
