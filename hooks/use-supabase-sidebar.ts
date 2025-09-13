"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"

export type SidebarProject = { id: string; name: string }
export type SidebarDraft = { id: string; title: string }
export type SidebarDefinition = { id: string; name: string }

type Result<T> = { data: T[]; error?: string }

export function useSupabaseSidebar() {
  const [projects, setProjects] = useState<SidebarProject[] | null>(null)
  const [drafts, setDrafts] = useState<SidebarDraft[] | null>(null)
  const [definitions, setDefinitions] = useState<SidebarDefinition[] | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)

  const supabase = useMemo(() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anon) return null
      return getSupabaseClient() as any
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!supabase) return
      setLoading(true)
      try {
        // Fetch user info via server (cookie-based) to avoid client auth desync
        const res = await fetch("/api/auth/user", { cache: "no-store" })
        let uid: string | null = null
        let email: string | null = null
        let org: string | null = null
        if (res.ok) {
          const j = await res.json()
          uid = (j?.id as string) || null
          email = (j?.email as string) || null
          org = (j?.orgId as string) || null
        }
        if (mounted) setUserId(uid)
        if (mounted) setUserEmail(email)
        if (mounted) setOrgId(org)
        const [proj, dr, defs] = await Promise.all([
          fetchProjects(supabase, uid),
          fetchDrafts(supabase, uid),
          fetchDefinitions(supabase, uid),
        ])
        if (!mounted) return
        if (proj.data.length) setProjects(proj.data)
        if (dr.data.length) setDrafts(dr.data)
        if (defs.data.length) setDefinitions(defs.data)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [supabase])

  // Realtime subscriptions: refresh lists on INSERT/UPDATE
  useEffect(() => {
    if (!supabase) return

    let active = true

    const refreshProjects = async () => {
      if (!active) return
      try {
        const res = await fetchProjects(supabase, userId)
        if (res.data.length) setProjects(res.data)
      } catch {}
    }

    const refreshDrafts = async () => {
      if (!active) return
      try {
        const res = await fetchDrafts(supabase, userId)
        if (res.data.length) setDrafts(res.data)
      } catch {}
    }

    const refreshDefinitions = async () => {
      if (!active) return
      try {
        const res = await fetchDefinitions(supabase, userId)
        if (res.data.length) setDefinitions(res.data)
      } catch {}
    }

    const channel = supabase
      .channel("sidebar-stream")
      // projects
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "projects" }, refreshProjects)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects" }, refreshProjects)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "projects" }, refreshProjects)
      // drafts
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "drafts" }, refreshDrafts)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "drafts" }, refreshDrafts)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "drafts" }, refreshDrafts)
      // definitions
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "definitions" }, refreshDefinitions)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "definitions" }, refreshDefinitions)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "definitions" }, refreshDefinitions)
      // fallbacks: workflows (affects projects/drafts), manifests (affects definitions)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "workflows" }, async () => {
        await Promise.all([refreshProjects(), refreshDrafts()])
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "workflows" }, async () => {
        await Promise.all([refreshProjects(), refreshDrafts()])
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "workflows" }, async () => {
        await Promise.all([refreshProjects(), refreshDrafts()])
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "manifests" }, refreshDefinitions)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "manifests" }, refreshDefinitions)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "manifests" }, refreshDefinitions)
      .subscribe()

    return () => {
      active = false
      try {
        supabase.removeChannel(channel)
      } catch {}
    }
  }, [supabase, userId])

  return { projects, drafts, definitions, loading, userId, userEmail, orgId }
}

async function fetchProjects(supabase: any, uid?: string | null): Promise<Result<SidebarProject>> {
  // Try a few likely schemas; gracefully ignore table-missing errors
  const out: SidebarProject[] = []
  // projects: { id, name | title }
  try {
    let query = supabase.from("projects").select("id,name,title").order("updated_at", { ascending: false })
    if (uid) query = query.eq("user_id", uid)
    const { data, error } = await query
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const name = (row?.name || row?.title || "").toString().trim()
        if (row?.id && name) out.push({ id: row.id as string, name })
      }
      if (out.length) return { data: out }
    }
  } catch {}
  // fallback: workflows grouped (if a project_name column exists)
  try {
    let q2 = supabase.from("workflows").select("id, project_name, user_id").order("created_at", { ascending: false })
    if (uid) q2 = q2.eq("user_id", uid)
    const { data, error } = await q2
    if (!error && Array.isArray(data)) {
      const seen = new Set<string>()
      for (const row of data) {
        const name = (row?.project_name || "").toString().trim()
        if (name && !seen.has(name)) {
          seen.add(name)
          out.push({ id: row.id as string, name })
        }
      }
      if (out.length) return { data: out }
    }
  } catch {}
  return { data: [] }
}

async function fetchDrafts(supabase: any, uid?: string | null): Promise<Result<SidebarDraft>> {
  const out: SidebarDraft[] = []
  try {
    let query = supabase.from("drafts").select("id,title,name,user_id").order("updated_at", { ascending: false })
    if (uid) query = query.eq("user_id", uid)
    const { data, error } = await query
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const title = (row?.title || row?.name || "").toString().trim()
        if (row?.id && title) out.push({ id: row.id as string, title })
      }
      if (out.length) return { data: out }
    }
  } catch {}
  // fallback: workflows where status='pending' (if column exists)
  try {
    let q2 = supabase.from("workflows").select("id,input_text,status,user_id").order("created_at", { ascending: false })
    if (uid) q2 = q2.eq("user_id", uid)
    const { data, error } = await q2
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const isDraft = (row?.status === "pending") || false
        if (row?.id && isDraft) {
          const title = (row?.input_text || "(draft)").toString().slice(0, 40)
          out.push({ id: row.id as string, title })
        }
      }
      if (out.length) return { data: out }
    }
  } catch {}
  return { data: [] }
}

async function fetchDefinitions(supabase: any, uid?: string | null): Promise<Result<SidebarDefinition>> {
  const out: SidebarDefinition[] = []
  try {
    let query = supabase.from("definitions").select("id, name, filename, title, user_id").order("updated_at", { ascending: false })
    if (uid) query = query.eq("user_id", uid)
    const { data, error } = await query
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const name = (row?.filename || row?.name || row?.title || "").toString().trim()
        if (row?.id && name) out.push({ id: row.id as string, name })
      }
      if (out.length) return { data: out }
    }
  } catch {}
  // fallback: manifests -> agent_name as a proxy
  try {
    let q2 = supabase.from("manifests").select("id, agent_name, created_at, workflow_id").order("created_at", { ascending: false })
    const { data, error } = await q2
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const name = (row?.agent_name || "").toString().trim()
        if (row?.id && name) out.push({ id: row.id as string, name })
      }
      if (out.length) return { data: out }
    }
  } catch {}
  return { data: [] }
}
