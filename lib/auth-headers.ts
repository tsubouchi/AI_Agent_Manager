"use client"

import { getSupabaseClient } from "@/lib/supabase"

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseClient() as any
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (token) return { Authorization: `Bearer ${token}` }
  } catch {
    // ignore
  }
  return {}
}

