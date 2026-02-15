import { createClient } from '@supabase/supabase-js'

function ensureEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

let storageClient: ReturnType<typeof createClient> | null = null

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
