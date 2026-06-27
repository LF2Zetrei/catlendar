import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

// ─── Row types (reflect the DB schema exactly) ────────────────────────────────

export type EventRow = {
  id: string
  title: string
  start_at: string   // ISO string
  end_at: string
  color: string | null
  created_at: string
}

export type TaskRow = {
  id: string
  label: string
  color: string
  completed: boolean
  created_at: string
}
