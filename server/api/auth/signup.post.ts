// File: /server/api/auth/signup.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

const NIL_UUID = '00000000-0000-0000-0000-000000000000'

interface SignupRequest {
  email: string
  username: string
  password: string
  phone?: string
  phoneCountry?: string
  location?: string
}

const withTimeout = <T>(promise: PromiseLike<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ])
}

export default defineEventHandler(async (event) => {
  console.log('[Signup API] ============ SIGNUP PIPELINE START ============')

  try {
    const body = await readBody<SignupRequest>(event)
    console.log('[Signup API] Step 1: Body parsed successfully -> User:', body.username)

    if (!body.email || !body.username || !body.password) {
      console.error('[Signup API] Missing required core fields')
      return { success: false, error: 'Email, username, and password are required.' }
    }

    const username = body.username.trim().replace(/^@/, '').toLowerCase()
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      return { success: false, error: 'Username must be 3-30 characters: letters, numbers, underscore or dot.' }
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Signup API] ❌ CRITICAL: Configuration variables missing on host system.')
      return { success: false, error: 'Server configuration error.' }
    }

    const clientOptions = { auth: { autoRefreshToken: false, persistSession: false } }
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, clientOptions)
    // signUp stores the new user's session on the client it runs on, which would
    // downgrade every later query from service role to that user, so it gets its own.
    const authClient = createClient<Database>(supabaseUrl, supabaseServiceKey, clientOptions)

    // Usernames released by another account stay reserved for 90 days.
    let available: boolean | null = null
    try {
      const response = await withTimeout(
        supabase.rpc('username_is_free', { p_username: username, p_user: NIL_UUID }),
        4000,
        'DATABASE_QUERY_TIMEOUT_HANG'
      )
      if (response.error) {
        console.error('[Signup API] ❌ Username lookup failed ->', response.error)
        return { success: false, error: 'Database verification failed' }
      }
      available = response.data
    } catch (timeoutErr: unknown) {
      console.error('[Signup API] Username check error:', timeoutErr)
      return { success: false, error: 'Database connection timeout.' }
    }

    if (!available) {
      return { success: false, error: 'Username already taken' }
    }

    // The on-insert trigger on auth.users (handle_new_user_signup) creates the
    // profile row keyed by the auth UUID from this metadata: username,
    // display name = username, E.164 phone (or a pending claim when another
    // account holds it), country, location and the wallet.
    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          username,
          phone: body.phone?.trim() || null,
          phone_country: body.phoneCountry?.trim().toUpperCase() || null,
          location: body.location?.trim() || null
        }
      }
    })

    if (authError) {
      console.error('[Signup API] ❌ Auth rejected ->', authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user || !authData.session) {
      console.error('[Signup API] ❌ Null user or session instance.')
      return { success: false, error: 'Account setup failed.' }
    }

    const userId = authData.user.id
    const [{ data: row, error: rowError }, { data: pending }] = await Promise.all([
      supabase.from('user').select('user_id, username, phone').eq('user_id', userId).maybeSingle(),
      supabase.from('phone_verifications').select('phone').eq('user_id', userId).maybeSingle()
    ])

    if (rowError || !row) {
      console.error('[Signup API] ❌ Profile row missing after signup ->', rowError)
      await supabase.auth.admin.deleteUser(userId)
      return { success: false, error: 'Account setup failed. Please try again.' }
    }

    const phoneStatus = row.phone ? 'linked' : pending?.phone ? 'pending_verification' : 'none'
    console.log('[Signup API] ✅ Account linked:', userId, phoneStatus)

    return {
      success: true,
      message: phoneStatus === 'pending_verification'
        ? 'Account created. Your phone number is linked to another account; verify it from Edit profile to move it here.'
        : 'Account created successfully',
      token: authData.session.access_token,
      user: {
        id: userId,
        email: authData.user.email!,
        username: row.username
      },
      phoneStatus,
      redirectTo: '/feed'
    }

  } catch (err: any) {
    console.error('[Signup API] 💥 Fatal Exception Catch-All ->', err)
    return { success: false, error: err.message || 'Pipeline Exception' }
  }
})
