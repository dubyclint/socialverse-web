// /server/api/auth/verify-email.post.ts - NEW IMPLEMENTATION
import { serverSupabaseClient } from '#supabase/server'

interface VerifyEmailRequest {
  token: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<VerifyEmailRequest>(event)

    if (!body.token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    // Find user with this token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email_verification_token', body.token)
      .single()

    if (userError || !user) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification token'
      })
    }

    // Check if token has expired
    const tokenExpiry = new Date(user.email_verification_expires_at)
    if (tokenExpiry < new Date()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token has expired'
      })
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null
      })
      .eq('id', user.id)

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify email'
      })
    }

    return {
      success: true,
      message: 'Email verified successfully. You can now log in.',
      userId: user.id,
      email: user.email
    }
  } catch (error) {
    console.error('[Verify Email] Error:', error)
    throw error
  }
})
