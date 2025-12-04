// FILE: /server/api/auth/verify-email.post.ts - UPDATED
// ============================================================================

import { getSupabaseClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Verify Email] ========== START ==========')

    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Verify Email] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { token, type = 'signup' } = body || {}

    if (!token) {
      console.log('[Verify Email] Missing token')
      setResponseStatus(event, 400)
      return { success: false, message: 'Verification token is required' }
    }

  // Use consolidated Supabase client
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'phone_change',
    })

    if (error) {
      console.error('[Verify Email] Verification error:', error.message)
      setResponseStatus(event, 400)
      return { success: false, message: error.message }
    }

    console.log('[Verify Email] ========== SUCCESS ==========')
    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Email verified successfully',
    }
  } catch (error: any) {
    console.error('[Verify Email] Unexpected error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Email verification failed',
    }
  }
})
