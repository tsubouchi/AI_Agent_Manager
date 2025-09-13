import { NextResponse } from "next/server"
import { z } from "zod"

const env = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

const createSchema = z.object({
  name: z.string().min(1),
})

export async function GET() {
  const e = env()
  if (!e) return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 })
  try {
    // include team members via FK relationship project_members -> members
    const select = encodeURIComponent(
      [
        "id,name,description,status,priority,progress,due_date,created_at,updated_at",
        "project_members(members(id,name,avatar_url),role)",
      ].join(","),
    )
    const res = await fetch(`${e.url}/rest/v1/projects?select=${select}&order=updated_at.desc,nullsLast&limit=50`, {
      headers: { apikey: e.key, Authorization: `Bearer ${e.key}` },
      cache: "no-store",
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json(data)
  } catch (err) {
    console.error("/api/projects GET error", err)
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
    const res = await fetch(`${e.url}/rest/v1/projects`, {
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
    console.error("/api/projects POST error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
