import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
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
    }
  )
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const email = data.user.email || null
  const id = data.user.id || null
  const org_id = (data.user.user_metadata as any)?.org_id || (data.user.app_metadata as any)?.org_id || null
  return NextResponse.json({ id, email, orgId: org_id })
}
