"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export function AuthControls() {
  const supabase = getSupabaseClient() as any
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setEmail(session?.user?.email || null)
    })
    return () => sub?.subscription?.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {email ? (
        <>
          <span className="text-xs text-muted-foreground hidden md:inline">{email}</span>
          <Button size="sm" variant="outline" onClick={signOut} disabled={loading}>
            Sign out
          </Button>
        </>
      ) : null}
    </div>
  )
}
