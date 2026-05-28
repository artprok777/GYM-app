import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const USER_ID = (import.meta.env.VITE_USER_ID as string | undefined) ?? ""

export const cloudEnabled = Boolean(url && anonKey && USER_ID)

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null
