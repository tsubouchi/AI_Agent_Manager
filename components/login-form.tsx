"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { guestSignIn } from "@/app/login/actions"

export function LoginForm() {
  const supabase = getSupabaseClient() as any
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const signIn = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message || "ログインに失敗しました")
        return
      }
      const redirectTo = searchParams.get("redirect") || "/"
      router.replace(redirectTo)
    } finally {
      setLoading(false)
    }
  }

  const guestLogin = () =>
    startTransition(async () => {
      try {
        const redirectTo = searchParams.get("redirect") || "/"
        await guestSignIn(redirectTo)
      } catch (e) {
        console.error(e)
        alert("ゲストログインに失敗しました。時間をおいて再度お試しください。")
      }
    })

  return (
    <div className="w-full max-w-sm mx-auto p-6 border rounded-lg bg-card">
      <h1 className="text-lg font-semibold mb-4">ログイン</h1>
      <form className="space-y-3" onSubmit={signIn}>
        <div className="space-y-1">
          <label className="block text-sm text-muted-foreground">メールアドレス</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-muted-foreground">パスワード</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "処理中..." : "ログイン"}
          </Button>
          <Button type="button" variant="outline" onClick={guestLogin} disabled={pending} className="flex-1">
            ゲストユーザーログイン
          </Button>
        </div>
      </form>
    </div>
  )
}
