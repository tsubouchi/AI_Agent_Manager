"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Send, Paperclip, Tag, Zap } from "lucide-react"

export function ChatInterface() {
  const [currentMode, setCurrentMode] = useState<"pain-analysis" | "solution-design" | "agent-generation" | "general">(
    "general",
  )
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
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
          mode: currentMode,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      const assistantId = Date.now().toString()
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
    } catch (error) {
      console.error("Chat error:", error)
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

  const handleAIExecution = () => {
    if (currentMode === "general") {
      setCurrentMode("pain-analysis")
    } else if (currentMode === "pain-analysis") {
      setCurrentMode("solution-design")
    } else if (currentMode === "solution-design") {
      setCurrentMode("agent-generation")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

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
            <p className="text-xs text-muted-foreground">Mode: {currentMode} | ctx: problem.yaml / personas / logs</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-[56vh]">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-[80%] p-4 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-70 mt-2">{new Date().toLocaleTimeString()}</p>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-sm text-muted-foreground">分析中...</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-2 overflow-x-auto whitespace-nowrap">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground mr-2">Pain:</span>
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "#fecaca",
              color: "#991b1b",
              border: "1px solid #f87171",
            }}
          >
            ●P-001 可視化不足
          </span>
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "#e5e7eb",
              color: "#374151",
              border: "1px solid #d1d5db",
            }}
          >
            ○P-002 粒度不整合
          </span>
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "#e5e7eb",
              color: "#374151",
              border: "1px solid #d1d5db",
            }}
          >
            ○P-003 面談調整遅延
          </span>
          <Button variant="link" size="sm" className="text-xs">
            すべて見る
          </Button>

          <span className="text-xs text-muted-foreground ml-4 mr-2">Agents:</span>
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              border: "1px solid #93c5fd",
            }}
          >
            resume-parser
          </span>
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              border: "1px solid #93c5fd",
            }}
          >
            skill-normalizer
          </span>
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              border: "1px solid #93c5fd",
            }}
          >
            matcher-core
          </span>
          <Button variant="link" size="sm" className="text-xs">
            一括Manifest
          </Button>
        </div>
      </div>

      <div className="sticky bottom-0 p-4 bg-background border-t border-border">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-2">
            <Button variant="outline" size="sm" type="button">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" type="button">
              <Tag className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="課題について詳しく教えてください..."
                className="min-h-[10rem] max-h-[22rem] resize-y text-lg leading-7"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" type="button" onClick={handleAIExecution} disabled={isLoading}>
              <Zap className="w-4 h-4 mr-1" />
              AI実行(解析→設計→出力)
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              <Send className="w-4 h-4 mr-1" />
              送信
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
