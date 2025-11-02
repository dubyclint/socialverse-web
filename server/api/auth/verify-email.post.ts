// FILE: /server/api/auth/verify-email.post.ts
// ============================================================================

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

    const { token } = body || {}

    if (!token) {
      console.log('[Verify Email] Missing token')
      setResponseStatus(event, 400)
      return { success: false, message: 'Verification token is required' }
    }

    let supabase: any
    try {
      const { serverSupabaseClient } = await import('#supabase/server')
      supabase = await serverSupabaseClient(event)
    } catch (e) {
      console.error('[Verify Email] Supabase init error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Database connection failed' }
    }

    // Find profile with token
    let profile: any
    try {
      const { data: foundProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email_verification_token', token)
        .single()

      if (!foundProfile) {
        console.log('[Verify Email] Invalid token')
        setResponseStatus(event, 400)
        return { success: false, message: 'Invalid verification token' }
      }

      profile = foundProfile
    } catch (e) {
      console.error('[Verify Email] Profile query error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid verification token' }
    }

    // Check expiry
    const expiresAt = new Date(profile.email_verification_expires_at)
    if (new Date() > expiresAt) {
      console.log('[Verify Email] Token expired')
      setResponseStatus(event, 400)
      return { success: false, message: 'Verification token has expired' }
    }

    // Update profile
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_verified: true,
          email_verification_token: null,
          email_verification_expires_at: null
        })
        .eq('id', profile.id)

      if (updateError) {
        console.error('[Verify Email] Update error:', updateError)
        setResponseStatus(event, 500)
        return { success: false, message: 'Failed to verify email' }
      }
    } catch (e) {
      console.error('[Verify Email] Update exception:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to verify email' }
    }

    console.log('[Verify Email] ========== SUCCESS ==========')
    setResponseStatus(event, 200)

    return {
      success: true,
      message: 'Email verified successfully',
      nextStep: 'complete_profile'
    }

  } catch (error: any) {
    console.error('[Verify Email] ========== CRITICAL ERROR ==========')
    console.error('[Verify Email] Error:', error?.message || error)

    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Verification failed'
    }
  }
})
