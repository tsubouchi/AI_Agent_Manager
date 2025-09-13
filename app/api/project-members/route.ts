import { NextResponse } from "next/server"
import { z } from "zod"

const env = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

const upsertSchema = z.object({ project_id: z.string().uuid(), member_id: z.string().uuid(), role: z.string().optional() })

export async function POST(req: Request) {
  const e = env()
  if (!e) return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 })
  try {
    const body = await req.json()
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const res = await fetch(`${e.url}/rest/v1/project_members`, {
      method: "POST",
      headers: {
        apikey: e.key,
        Authorization: `Bearer ${e.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(parsed.data),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json(Array.isArray(data) ? data[0] : data)
  } catch (err) {
    console.error("/api/project-members POST error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const e = env()
  if (!e) return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 })
  try {
    const { searchParams } = new URL(req.url)
    const project_id = searchParams.get("project_id")
    const member_id = searchParams.get("member_id")
    if (!project_id || !member_id) return NextResponse.json({ error: "Missing ids" }, { status: 400 })
    const res = await fetch(
      `${e.url}/rest/v1/project_members?project_id=eq.${project_id}&member_id=eq.${member_id}`,
      { method: "DELETE", headers: { apikey: e.key, Authorization: `Bearer ${e.key}` } },
    )
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json({ error: data }, { status: res.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("/api/project-members DELETE error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

