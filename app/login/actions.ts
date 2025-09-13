"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"

export async function guestSignIn(redirectTo?: string) {
  // Simple in-memory rate limit: 5 requests/min per IP (best-effort; dev-focused)
  try {
    const h = headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
    if (!globalThis.__guestRate) {
      ;(globalThis as any).__guestRate = new Map<string, number[]>()
    }
    const store: Map<string, number[]> = (globalThis as any).__guestRate
    const now = Date.now()
    const windowMs = 60_000
    const limit = 5
    const list = (store.get(ip!) || []).filter((t) => now - t < windowMs)
    if (list.length >= limit) {
      throw new Error("Rate limit exceeded for guest sign-in. Please try again later.")
    }
    list.push(now)
    store.set(ip!, list)
  } catch {
    // ignore rate-limit errors in non-request contexts
  }

  const email = process.env.DEMO_GUEST_EMAIL
  const password = process.env.DEMO_GUEST_PASSWORD
  if (!email || !password) {
    throw new Error("Guest credentials are not configured on server")
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  redirect(redirectTo || "/")
}
