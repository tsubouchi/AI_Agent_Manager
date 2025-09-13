"use client"

import type React from "react"
import { useWorkflow } from "@/hooks/use-workflow"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase"
import { chatLiveStore } from "@/hooks/use-chat-store"
import { getAuthHeaders } from "@/lib/auth-headers"

const Send = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

const Paperclip = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const Tag = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
)

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
  </svg>
)

export function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: "system-1",
      role: "assistant" as const,
      content:
        "まず課題の概要を教えてください。ビジネス課題からPain分析、ソリューション設計まで一気通貫でサポートします。",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [phaseAnimation, setPhaseAnimation] = useState("")
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [isOcrLoading, setIsOcrLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [nearBottom, setNearBottom] = useState(true)
  const realtimeSeenIds = useRef<Set<string>>(new Set())

  const { stages, context, isRunning, startWorkflow, currentPhase } = useWorkflow()

  useEffect(() => {
    if (isRunning && currentPhase) {
      let dots = 0
      const interval = setInterval(() => {
        dots = (dots + 1) % 4
        setPhaseAnimation(`${currentPhase} ${".".repeat(dots)}`)
      }, 100)

      return () => clearInterval(interval)
    } else {
      setPhaseAnimation("")
    }
  }, [isRunning, currentPhase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isRunning || isComposing) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    // Persist user message if workflow exists
    try {
      if (context.workflowId) {
        const auth = await getAuthHeaders()
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...auth },
          body: JSON.stringify({ workflow_id: context.workflowId, role: "user", content: input }),
        })
      }
    } catch (_) {}
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: context,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      const assistantId = Date.now().toString()
      chatLiveStore.start(assistantId, assistantId)
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
        },
      ])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const data = JSON.parse(line.slice(2))
                if (data.type === "text-delta") {
                  assistantMessage += data.text
                  // push to live store for right panel
                  chatLiveStore.appendDelta(data.text)
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: assistantMessage.replace(/###\s*/g, "").replace(/\*\*(.*?)\*\*/g, "$1") }
                        : msg,
                    ),
                  )
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      }

      if (!assistantMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    "すみません、現在AIサービスに接続できません。OpenAI APIキーが設定されているか確認してください。",
                }
              : msg,
          ),
        )
      }
      // finalize live stream
      chatLiveStore.commit()

      if (assistantMessage.includes("課題") || assistantMessage.includes("問題") || input.includes("Pain")) {
        setTimeout(() => {
          startWorkflow(input)
        }, 1000)
      }
      // Persist assistant message after streaming ends
      try {
        if (context.workflowId && assistantMessage) {
          const auth = await getAuthHeaders()
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...auth },
            body: JSON.stringify({ workflow_id: context.workflowId, role: "assistant", content: assistantMessage }),
          })
        }
      } catch (_) {}
    } catch (error) {
      console.error("Chat error:", error)
      chatLiveStore.commit()
      setMessages((prev) =>
        prev.map((msg) =>
          msg.role === "assistant" && msg.content === ""
            ? { ...msg, content: "エラーが発生しました。OpenAI APIキーが正しく設定されているか確認してください。" }
            : msg,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleAIExecution = async () => {
    if (!input.trim()) return

    await startWorkflow(input)
    setInput("")
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAttachmentPreview(url)
    try {
      setIsOcrLoading(true)
      const form = new FormData()
      form.append("image", file)
      const res = await fetch("/api/ocr", { method: "POST", body: form })
      if (!res.ok) throw new Error("OCR failed")
      const data = (await res.json()) as { text?: string }
      const text = data.text?.trim() || "(No text recognized)"
      // Prefill input with OCR text and add a system-like message
      setInput(text)
      setMessages((prev) => [
        ...prev,
        {
          id: `ocr-${Date.now()}`,
          role: "assistant" as const,
          content: `OCR抽出結果:\n${text}`,
        },
      ])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: `ocr-error-${Date.now()}`,
          role: "assistant" as const,
          content: "画像の解析に失敗しました。時間をおいて再度お試しください。",
        },
      ])
    } finally {
      setIsOcrLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (isComposing) {
        setIsComposing(false)
      } else {
        handleSubmit(e)
      }
    }
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  // Auto-scroll handling
  const scrollToBottom = (smooth = true) => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
    }
  }

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const threshold = 64 // px
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
    setNearBottom(distanceFromBottom <= threshold)
  }

  useEffect(() => {
    // On mount, jump to bottom without animation
    scrollToBottom(false)
  }, [])

  useEffect(() => {
    // While new messages stream in, keep view pinned to bottom if user is near bottom
    if (nearBottom) scrollToBottom(true)
  }, [messages, isLoading, isRunning, isOcrLoading, phaseAnimation, nearBottom])

  // Supabase Realtime subscription for messages (optional)
  useEffect(() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anon) return
      const supabase = getSupabaseClient() as any
      const channel = supabase
        .channel("messages-stream")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload: any) => {
            const row = payload.new
            if (!row?.id) return
            if (realtimeSeenIds.current.has(row.id)) return
            if (context.workflowId && row.workflow_id && row.workflow_id !== context.workflowId) return
            if (row.role === "user") return
            realtimeSeenIds.current.add(row.id)
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev
              return [...prev, { id: row.id, role: row.role, content: row.content }]
            })
          },
        )
        .subscribe()
      return () => {
        try {
          supabase.removeChannel(channel)
        } catch {}
      }
    } catch {
      // optional
    }
  }, [context.workflowId])

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-lg" style={{ color: "#1e40af" }}>
              🧠
            </span>
          </div>
          <div>
            <h2 className="font-medium">コンサル型AI</h2>
            <p className="text-xs text-muted-foreground">
              {phaseAnimation ||
                (isRunning
                  ? `実行中: ${stages.find((s) => s.status === "running")?.name || "準備中"}`
                  : "Mode: general")}{" "}
              | ctx: problem.yaml / personas / logs
            </p>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 scroll-smooth"
      >
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-[80%] p-4 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-70 mt-2" suppressHydrationWarning>
                  {new Date().toLocaleTimeString()}
                </p>
              </Card>
            </div>
          ))}
          {attachmentPreview && (
            <div className="flex justify-end">
              <Card className="max-w-[80%] p-3 bg-primary text-primary-foreground">
                <p className="text-xs opacity-80 mb-2">添付画像プレビュー</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachmentPreview} alt="attachment preview" className="max-h-40 rounded" />
              </Card>
            </div>
          )}
          {(isLoading || isRunning) && (
            <div className="flex justify-start">
              <Card className="bg-card p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-sm text-muted-foreground">{phaseAnimation || "分析中..."}</p>
                </div>
              </Card>
            </div>
          )}
          {isOcrLoading && (
            <div className="flex justify-start">
              <Card className="bg-card p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-sm text-muted-foreground">画像を解析中...</p>
                </div>
              </Card>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-3 overflow-x-auto whitespace-nowrap">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground mr-2">Pain:</span>
          {context.painAnalysis?.pains.map((pain, index) => (
            <span
              key={pain.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: pain.severity === "high" ? "#dc2626" : "#d97706",
                color: "#ffffff",
                border: `1px solid ${pain.severity === "high" ? "#dc2626" : "#d97706"}`,
              }}
            >
              {pain.severity === "high" ? "●" : "○"}
              {pain.id} {pain.title}
            </span>
          )) || (
            <>
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "1px solid #dc2626",
                }}
              >
                ●P-001 可視化不足
              </span>
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "#d97706",
                  color: "#ffffff",
                  border: "1px solid #d97706",
                }}
              >
                ○P-002 粒度不整合
              </span>
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "#d97706",
                  color: "#ffffff",
                  border: "1px solid #d97706",
                }}
              >
                ○P-003 面談調整遅延
              </span>
            </>
          )}
          <Button variant="link" size="sm" className="text-xs">
            すべて見る
          </Button>

          <span className="text-xs text-muted-foreground ml-4 mr-2">Agents:</span>
          {context.agentGeneration?.agents.map((agent, index) => (
            <span
              key={agent.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "1px solid #2563eb",
              }}
            >
              {agent.name}
            </span>
          )) || (
            <>
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "1px solid #2563eb",
                }}
              >
                resume-parser
              </span>
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "1px solid #2563eb",
                }}
              >
                skill-normalizer
              </span>
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "1px solid #2563eb",
                }}
              >
                matcher-core
              </span>
            </>
          )}
          <Button variant="link" size="sm" className="text-xs">
            一括Manifest
          </Button>
        </div>
      </div>

      <div className="sticky bottom-0 p-4 bg-background border-t border-border">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-2">
            <Button variant="outline" size="sm" type="button" onClick={handleAttachClick} disabled={isOcrLoading}>
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" size="sm" type="button">
              <Tag className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder={
                  isComposing ? "Enterで確定、もう一度Enterで送信..." : "課題について詳しく教えてください..."
                }
                className="min-h-[3.5rem] max-h-[8rem] resize-y text-base leading-6"
                autoFocus
                disabled={isLoading || isRunning}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleAIExecution}
              disabled={isLoading || isRunning || !input.trim()}
            >
              <Zap className="w-4 h-4 mr-1" />
              {isRunning ? "実行中..." : "AI実行(解析→設計→出力)"}
            </Button>
            <Button type="submit" size="sm" disabled={isLoading || isRunning || isComposing}>
              <Send className="w-4 h-4 mr-1" />
              {isComposing ? "確定" : "送信"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
