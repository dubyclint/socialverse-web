// FILE: /server/api/auth/resend-verification.post.ts
// ============================================================================

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Resend Verification] REQUEST RECEIVED')
    
    const body = await readBody(event)

    if (!body?.email) {
      console.log('[Resend Verification] VALIDATION FAILED: Missing email')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Email is required'
      }
    }

    const { serverSupabaseClient } = await import('#supabase/server')
    const crypto = await import('crypto')
    const supabase = await serverSupabaseClient(event)

    // Find profile
    console.log('[Resend Verification] Looking up profile...')
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', body.email.toLowerCase())
      .single()

    if (!profile) {
      console.log('[Resend Verification] User not found')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'User not found'
      }
    }

    // Generate new token
    const verificationToken = crypto.default.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Update profile
    console.log('[Resend Verification] Updating token...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verification_token: verificationToken,
        email_verification_expires_at: tokenExpiry
      })
      .eq('id', profile.id)

    if (updateError) {
      console.log('[Resend Verification] Update failed:', updateError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to resend verification email'
      }
    }

    console.log('[Resend Verification] SUCCESS')
    setResponseStatus(event, 200)
    
    return {
      success: true,
      message: 'Verification email sent'
    }

  } catch (error: any) {
    console.error('[Resend Verification] CRITICAL ERROR:', error?.message || error)
    setResponseStatus(event, 500)
    
    return {
      success: false,
      message: error?.message || 'Failed to resend verification email'
    }
  }
})

