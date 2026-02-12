import { createClient } from '@supabase/supabase-js'

function ensureEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

let storageClient = null

export function getSupabaseStorage() {
  if (!storageClient) {
    const url = ensureEnv('SUPABASE_URL')
    const anonKey = ensureEnv('SUPABASE_ANON_KEY')
    storageClient = createClient(url, anonKey, {
      auth: { persistSession: false }
    })
  }
  return storageClient.storage
}
