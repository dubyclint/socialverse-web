: /server/api/auth/resend-verification.post.ts - CREATE
// Resend verification email
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import { generateEmailVerificationToken } from '~/server/utils/token'
import { sendVerificationEmail } from '~/server/utils/email'

interface ResendVerificationRequest {
  email: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<ResendVerificationRequest>(event)

    // STEP 1: VALIDATE EMAIL
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // STEP 2: FIND PROFILE BY EMAIL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', body.email)
      .single()

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Email not found'
      })
    }

    // STEP 3: CHECK IF ALREADY VERIFIED
    if (profile.email_verified) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is already verified'
      })
    }

    // STEP 4: GENERATE NEW VERIFICATION TOKEN
    const { token: verificationToken, expiresAt: tokenExpiry } = generateEmailVerificationToken()

    // STEP 5: UPDATE PROFILE WITH NEW TOKEN
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verification_token: verificationToken,
        email_verification_expires_at: tokenExpiry,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to generate verification token'
      })
    }

    // STEP 6: SEND VERIFICATION EMAIL
    try {
      await sendVerificationEmail(profile.email, profile.username, verificationToken)
    } catch (emailError) {
      console.warn('[ResendVerification] Email sending failed:', emailError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to send verification email'
      })
    }

    // STEP 7: RETURN SUCCESS
    return {
      success: true,
      message: 'Verification email sent. Check your inbox.'
    }

  } catch (error) {
    console.error('[ResendVerification] Error:', error)
    throw error
  }
})
