//server/api/auth/verify-email.post.ts - UPDATE
// Email verification endpoint
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import { isTokenExpired } from '~/server/utils/token'
import { sendWelcomeEmail } from '~/server/utils/email'

interface VerifyEmailRequest {
  token: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<VerifyEmailRequest>(event)

    // STEP 1: VALIDATE TOKEN
    if (!body.token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    // STEP 2: FIND USER WITH TOKEN
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email_verification_token', body.token)
      .single()

    if (profileError || !profile) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification token'
      })
    }

    // STEP 3: CHECK TOKEN EXPIRY
    if (isTokenExpired(profile.email_verification_expires_at)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token has expired'
      })
    }

    // STEP 4: UPDATE PROFILE - MARK EMAIL AS VERIFIED
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify email'
      })
    }

    // STEP 5: SEND WELCOME EMAIL
    try {
      await sendWelcomeEmail(profile.email, profile.username)
    } catch (emailError) {
      console.warn('[VerifyEmail] Welcome email failed:', emailError)
      // Don't fail verification if welcome email fails
    }

    // STEP 6: RETURN SUCCESS
    return {
      success: true,
      message: 'Email verified successfully',
      nextStep: 'profile_completion'
    }

  } catch (error) {
    console.error('[VerifyEmail] Error:', error)
    throw error
  }
})
