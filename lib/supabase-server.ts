import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }))
        },
        setAll(cookies) {
          for (const c of cookies) cookieStore.set({ name: c.name!, value: c.value, ...c.options })
        },
      },
    },
  )
}
