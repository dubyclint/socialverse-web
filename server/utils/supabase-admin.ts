import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

let client: SupabaseClient<Database> | null = null

/**
 * Service-role Supabase client for privileged server-side work. Never expose
 * this client, or the key behind it, to the browser.
 */
export const getServiceClient = (): SupabaseClient<Database> => {
  if (client) return client

  const url = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase service credentials are not configured'
    })
  }

  client = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  })

  return client
}
