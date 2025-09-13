import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { createSupabaseServer } from "@/lib/supabase-server"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string }
}) {
  const supabase = createSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session) redirect(searchParams?.redirect || "/")

  return (
    <div className="min-h-[calc(100vh-49px)] flex items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
