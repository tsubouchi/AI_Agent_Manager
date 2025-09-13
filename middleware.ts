import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PROTECTED_PREFIXES = ["/"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }))
        },
        setAll(cookies) {
          for (const c of cookies) res.cookies.set({ name: c.name!, value: c.value, ...c.options })
        },
      },
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname
  const isLogin = path === "/login"
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))

  if (isProtected && !isLogin && !session) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|assets|public|login).*)"],
}
