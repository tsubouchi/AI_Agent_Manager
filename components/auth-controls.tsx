"use client"

import { useEffect, useState } from "react"
import { serverSignOut } from "@/app/login/actions"
import { Button } from "@/components/ui/button"

export function AuthControls() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // Fetch via server to reflect cookie-based session
    fetch("/api/auth/user", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setEmail(j?.email || null))
      .catch(() => setEmail(null))
  }, [])

  return (
    <div className="flex items-center gap-2">
      {email ? (
        <>
          <span className="text-xs text-muted-foreground hidden md:inline">{email}</span>
          <form action={serverSignOut}>
            <Button size="sm" variant="outline" type="submit" disabled={loading}>
              Sign out
            </Button>
          </form>
        </>
      ) : null}
    </div>
  )
}
