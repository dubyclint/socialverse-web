import { createClient } from '@supabase/supabase-js'
import { createError } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'

export const USERNAME_RE = /^[a-z0-9_.]{3,30}$/

export const normaliseUsername = (value: string): string => value.trim().replace(/^@/, '').toLowerCase()

const STATUS_BY_SQLSTATE: Record<string, number> = {
  '22023': 400,
  '23505': 409,
  '54000': 429,
  P0002: 404
}

/** Re-authenticate with the account password before a sensitive identity change. */
export const verifyPassword = async (email: string | null, password: string | undefined): Promise<void> => {
  if (!email || !password) {
    throw createError({ statusCode: 401, statusMessage: 'Enter your current password to change your username' })
  }
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const anonKey = config.public.supabaseKey
  if (!url || !anonKey) throw createError({ statusCode: 500, statusMessage: 'Supabase is not configured' })

  const verifier = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  })
  const { error } = await verifier.auth.signInWithPassword({ email, password })
  if (error) throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })
  await verifier.auth.signOut({ scope: 'local' })
}

/** Apply a username change through the rate-limited, history-keeping RPC. */
export const changeUsername = async (userId: string, username: string): Promise<string> => {
  const { data, error } = await getServiceClient().rpc('change_username', { p_user: userId, p_new: username })
  if (error) {
    throw createError({ statusCode: STATUS_BY_SQLSTATE[error.code] ?? 500, statusMessage: error.message })
  }
  return data
}
