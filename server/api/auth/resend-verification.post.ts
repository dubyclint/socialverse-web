// FILE: /server/api/auth/resend-verification.post.ts
// ============================================================================

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Resend Verification] ========== START ==========')

    let body: any
    try {
      body = await readBody(event)
    } catch (e) {
      console.error('[Resend Verification] Body parse error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body' }
    }

    const { email } = body || {}

    if (!email) {
      console.log('[Resend Verification] Missing email')
      setResponseStatus(event, 400)
      return { success: false, message: 'Email is required' }
    }

    let supabase: any
    try {
      const { serverSupabaseClient } = await import('#supabase/server')
      supabase = await serverSupabaseClient(event)
    } catch (e) {
      console.error('[Resend Verification] Supabase init error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Database connection failed' }
    }

    // Find profile
    let profile: any
    try {
      const { data: foundProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (!foundProfile) {
        console.log('[Resend Verification] User not found')
        setResponseStatus(event, 400)
        return { success: false, message: 'User not found' }
      }

      profile = foundProfile
    } catch (e) {
      console.error('[Resend Verification] Profile query error:', e)
      setResponseStatus(event, 400)
      return { success: false, message: 'User not found' }
    }

    // Generate new token
    let verificationToken: string
    try {
      const crypto = await import('crypto')
      verificationToken = crypto.default.randomBytes(32).toString('hex')
    } catch (e) {
      console.error('[Resend Verification] Token generation error:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to generate token' }
    }

    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Update profile
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_verification_token: verificationToken,
          email_verification_expires_at: tokenExpiry
        })
        .eq('id', profile.id)

      if (updateError) {
        console.error('[Resend Verification] Update error:', updateError)
        setResponseStatus(event, 500)
        return { success: false, message: 'Failed to resend verification email' }
      }
    } catch (e) {
      console.error('[Resend Verification] Update exception:', e)
      setResponseStatus(event, 500)
      return { success: false, message: 'Failed to resend verification email' }
    }

    console.log('[Resend Verification] ========== SUCCESS ==========')
    setResponseStatus(event, 200)

    return {
      success: true,
      message: 'Verification email sent'
    }

  } catch (error: any) {
    console.error('[Resend Verification] ========== CRITICAL ERROR ==========')
    console.error('[Resend Verification] Error:', error?.message || error)

    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Failed to resend verification email'
    }
  }
})

