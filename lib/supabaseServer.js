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
  // Require anon key for the client creation. Service role key (server) is optional.
  const anonKey = process.env.SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!anonKey) throw new Error('Missing environment variable: SUPABASE_ANON_KEY')

  // Use service key for server-side operations (full access)
  // This key is used to authenticate with PostgREST and determines the database role
  const keyToUse = serviceKey || anonKey

  return createClient(url, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        // Authorization header is automatically set by Supabase client using the key
        // apikey header is needed for Kong/Supabase gateway
        'apikey': keyToUse
      }
    }
  })
}
