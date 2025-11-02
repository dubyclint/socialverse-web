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
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<VerifyEmailRequest>(event)

    if (!body?.token) {
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Verification token is required'
      }
    }

    // Find profile with this token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email_verification_token', body.token)
      .single()

    if (profileError || !profile) {
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid verification token'
      }
    }

    // Check if token is expired
    const expiresAt = new Date(profile.email_verification_expires_at)
    if (new Date() > expiresAt) {
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Verification token has expired'
      }
    }

    // Update profile to mark email as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null
      })
      .eq('id', profile.id)

    if (updateError) {
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to verify email'
      }
    }

    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Email verified successfully',
      nextStep: 'complete_profile'
    }
  } catch (error: any) {
    console.error('[Verify Email] Error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Verification failed'
    }
  }
})

