import { z } from "zod"
import { NextResponse } from "next/server"

const env = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon) return null
  return { url, anon, service }
}

const createSchema = z.object({
  workflow_id: z.string().uuid().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const e = env()
    if (!e) return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 })
    if (process.env.SUPABASE_REQUIRE_JWT === "true" && !req.headers.get("authorization")) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const authHeader = req.headers.get("authorization")
    const headers: Record<string, string> = {
      apikey: e.anon!,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }
    if (authHeader) {
      headers.Authorization = authHeader
    } else if (e.service) {
      headers.Authorization = `Bearer ${e.service}`
      headers.apikey = e.service
    }

    const res = await fetch(`${e.url}/rest/v1/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify(parsed.data),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json(Array.isArray(data) ? data[0] : data)
  } catch (err) {
    console.error("/api/messages POST error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
