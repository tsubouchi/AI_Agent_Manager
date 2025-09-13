"use client"

import { useSyncExternalStore } from "react"

type ChatLiveState = {
  assistantId: string | null
  assistantText: string
  streaming: boolean
  sessionId: string | null
}

type Listener = () => void

let current: ChatLiveState = {
  assistantId: null,
  assistantText: "",
  streaming: false,
  sessionId: null,
}

const listeners: Set<Listener> = new Set()

let buffer = ""
let rafId: number | null = null
let flushing = false

function maybeEmit(next: ChatLiveState) {
  // Only notify if something actually changed (by shallow compare)
  if (
    next.assistantId === current.assistantId &&
    next.assistantText === current.assistantText &&
    next.streaming === current.streaming &&
    next.sessionId === current.sessionId
  ) {
    return
  }
  current = next
  for (const l of listeners) l()
}

function flush() {
  if (flushing) return
  if (!buffer) return
  flushing = true
  const nextText = current.assistantText + buffer
  buffer = ""
  if (nextText !== current.assistantText) {
    maybeEmit({ ...current, assistantText: nextText })
  }
  flushing = false
}

function scheduleFlush() {
  if (rafId != null) return
  const raf = typeof window !== "undefined" && window.requestAnimationFrame
    ? window.requestAnimationFrame
    : (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now ? performance.now() : Date.now()), 16) as unknown as number
  rafId = raf(() => {
    rafId = null
    flush()
  })
}

export const chatLiveStore = {
  getSnapshot(): ChatLiveState {
    return current
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  start(assistantId: string, sessionId?: string) {
    const sid = sessionId || assistantId
    maybeEmit({ assistantId, assistantText: "", streaming: true, sessionId: sid })
  },
  appendDelta(text: string) {
    if (!current.streaming) return
    if (!text) return
    buffer += text
    scheduleFlush()
  },
  commit() {
    flush()
    if (current.streaming) {
      maybeEmit({ ...current, streaming: false })
    }
  },
  reset() {
    maybeEmit({ assistantId: null, assistantText: "", streaming: false, sessionId: null })
  },
}

export function useChatLive(enabled: boolean = true) {
  const subscribe = enabled ? chatLiveStore.subscribe : (() => () => {})
  const getClientSnapshot = enabled
    ? chatLiveStore.getSnapshot
    : () => ({ assistantId: null, assistantText: "", streaming: false, sessionId: null })
  const getServerSnapshot = () => ({ assistantId: null, assistantText: "", streaming: false, sessionId: null })
  const snapshot = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
  return snapshot
}
