// FILE: /server/api/auth/verify-email.post.ts
// ============================================================================

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Verify Email] REQUEST RECEIVED')
    
    const body = await readBody(event)

    if (!body?.token) {
      console.log('[Verify Email] VALIDATION FAILED: Missing token')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Verification token is required'
      }
    }

    const { serverSupabaseClient } = await import('#supabase/server')
    const supabase = await serverSupabaseClient(event)

    // Find profile with token
    console.log('[Verify Email] Looking up token...')
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email_verification_token', body.token)
      .single()

    if (!profile) {
      console.log('[Verify Email] Invalid token')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid verification token'
      }
    }

    // Check expiry
    const expiresAt = new Date(profile.email_verification_expires_at)
    if (new Date() > expiresAt) {
      console.log('[Verify Email] Token expired')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Verification token has expired'
      }
    }

    // Update profile
    console.log('[Verify Email] Updating profile...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null
      })
      .eq('id', profile.id)

    if (updateError) {
      console.log('[Verify Email] Update failed:', updateError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to verify email'
      }
    }

    console.log('[Verify Email] SUCCESS')
    setResponseStatus(event, 200)
    
    return {
      success: true,
      message: 'Email verified successfully',
      nextStep: 'complete_profile'
    }

  } catch (error: any) {
    console.error('[Verify Email] CRITICAL ERROR:', error?.message || error)
    setResponseStatus(event, 500)
    
    return {
      success: false,
      message: error?.message || 'Verification failed'
    }
  }
})

