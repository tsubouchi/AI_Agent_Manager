import { NextResponse } from "next/server"
import { z } from "zod"

const env = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  stakeholders: z.string().optional(),
  timeline: z.string().optional(),
  context: z.string().optional(),
})

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const e = env()
  if (!e) return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 })
  try {
    const body = await _req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const res = await fetch(`${e.url}/rest/v1/drafts?id=eq.${params.id}`, {
      method: "PATCH",
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
    console.error("/api/drafts/[id] PATCH error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const e = env()
  if (!e) return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 })
  try {
    const res = await fetch(`${e.url}/rest/v1/drafts?id=eq.${params.id}`, {
      method: "DELETE",
      headers: {
        apikey: e.key,
        Authorization: `Bearer ${e.key}`,
      },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json({ error: data }, { status: res.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("/api/drafts/[id] DELETE error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

