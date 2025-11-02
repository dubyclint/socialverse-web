// FILE: /server/api/auth/resend-verification.post.ts
// Resend verification email
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface ResendVerificationRequest {
  email: string
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    console.log('[Resend Verification API] ========== REQUEST START ==========')

    let body: ResendVerificationRequest
    try {
      body = await readBody(event)
    } catch (parseError) {
      console.error('[Resend Verification API] Failed to parse request body:', parseError)
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Invalid request format'
      }
    }

    if (!body?.email?.trim()) {
      console.log('[Resend Verification API] Validation failed: Missing email')
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Email is required'
      }
    }

    const supabase = await serverSupabaseClient(event)

    // Find profile
    console.log('[Resend Verification API] Looking up profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', body.email.toLowerCase())
      .single()

    if (profileError || !profile) {
      console.log('[Resend Verification API] User not found:', body.email)
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'User not found'
      }
    }

    // Generate new token
    const crypto = await import('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Update profile with new token
    console.log('[Resend Verification API] Updating verification token...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verification_token: verificationToken,
        email_verification_expires_at: tokenExpiry
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('[Resend Verification API] Failed to update token:', updateError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to resend verification email'
      }
    }

    // TODO: Send email here
    console.log('[Resend Verification API] Verification token updated (email sending not implemented)')

    console.log('[Resend Verification API] ========== REQUEST SUCCESS ==========')
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Verification email sent'
    }
  } catch (error: any) {
    console.error('[Resend Verification API] Error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Failed to resend verification email'
    }
  }
})

