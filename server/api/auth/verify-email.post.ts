// FILE: /server/api/auth/verify-email.post.ts
// Email verification
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface VerifyEmailRequest {
  token: string
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Verify Email API] ========== REQUEST START ==========')

    let body: VerifyEmailRequest
    try {
      body = await readBody(event)
    } catch (parseError) {
      console.error('[Verify Email API] Failed to parse request body:', parseError)
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid request format'
      }
    }

    if (!body?.token?.trim()) {
      console.log('[Verify Email API] Validation failed: Missing token')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Verification token is required'
      }
    }

    const supabase = await serverSupabaseClient(event)

    // Find profile with this token
    console.log('[Verify Email API] Looking up verification token...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email_verification_token', body.token)
      .single()

    if (profileError || !profile) {
      console.log('[Verify Email API] Invalid verification token')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid verification token'
      }
    }

    // Check if token is expired
    const expiresAt = new Date(profile.email_verification_expires_at)
    if (new Date() > expiresAt) {
      console.log('[Verify Email API] Verification token has expired')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Verification token has expired'
      }
    }

    // Update profile to mark email as verified
    console.log('[Verify Email API] Updating profile...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('[Verify Email API] Failed to update profile:', updateError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to verify email'
      }
    }

    console.log('[Verify Email API] ========== REQUEST SUCCESS ==========')
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Email verified successfully',
      nextStep: 'complete_profile'
    }
  } catch (error: any) {
    console.error('[Verify Email API] Error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Verification failed'
    }
  }
})
