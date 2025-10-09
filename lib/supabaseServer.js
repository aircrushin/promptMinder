import { createClient } from '@supabase/supabase-js'

function ensureEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function createSupabaseServerClient() {
  const url = ensureEnv('SUPABASE_URL')
  const anonKey = ensureEnv('SUPABASE_ANON_KEY')

  return createClient(url, anonKey, {
    auth: {
      persistSession: false
    }
  })
}
