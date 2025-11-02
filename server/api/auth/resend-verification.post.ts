// FILE: /server/api/auth/resend-verification.post.ts
// Resend verification email
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import { generateEmailVerificationToken } from '~/server/utils/token'
import { sendVerificationEmail } from '~/server/utils/email'

interface ResendVerificationRequest {
  email: string
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<ResendVerificationRequest>(event)

    if (!body?.email) {
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'Email is required'
      }
    }

    // Find profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', body.email)
      .single()

    if (profileError || !profile) {
      setResponseStatus(event, 400)
      return {
        success: false,
        message: 'User not found'
      }
    }

    // Generate new token
    const { token: verificationToken, expiresAt: tokenExpiry } = generateEmailVerificationToken()

    // Update profile with new token
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verification_token: verificationToken,
        email_verification_expires_at: tokenExpiry
      })
      .eq('id', profile.id)

    if (updateError) {
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Failed to resend verification email'
      }
    }

    // Send email
    try {
      await sendVerificationEmail(profile.email, profile.username, verificationToken)
    } catch (emailError) {
      console.warn('[Resend Verification] Email sending failed:', emailError)
    }

    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Verification email sent'
    }
  } catch (error: any) {
    console.error('[Resend Verification] Error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Failed to resend verification email'
    }
  }
})

