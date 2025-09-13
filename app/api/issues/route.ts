import { NextResponse } from "next/server"
import { z } from "zod"

const env = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

const createSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
})

export async function GET() {
  const e = env()
  if (!e) return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 })
  try {
    const res = await fetch(
      `${e.url}/rest/v1/issues?select=*,projects(id,name)&order=updated_at.desc,nullsLast&limit=100`,
      { headers: { apikey: e.key, Authorization: `Bearer ${e.key}` }, cache: "no-store" },
    )
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json(data)
  } catch (err) {
    console.error("/api/issues GET error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const e = env()
  if (!e) return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 })
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const res = await fetch(`${e.url}/rest/v1/issues`, {
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
    console.error("/api/issues POST error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

