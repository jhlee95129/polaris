import { createClient } from "@supabase/supabase-js"

export function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set")
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}
