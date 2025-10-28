import { serverSupabaseClient } from '#supabase/server'

interface VerifyEmailRequest {
  token: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<VerifyEmailRequest>(event)
    
    const { token } = body

    if (!token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    console.log('[Verify Email] Attempting to verify email with token')

    // ✅ FIX: Use Supabase auth to verify email
    // The token comes from the email link: /auth/confirm?token_hash=xxx&type=email_change
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email_change'
    })

    if (error) {
      console.error('[Verify Email] Verification error:', error)
      throw createError({
        statusCode: 400,
        statusMessage: `Email verification failed: ${error.message}`
      })
    }

    if (!data.user) {
      console.error('[Verify Email] No user returned from verification')
      throw createError({
        statusCode: 500,
        statusMessage: 'Email verification failed: No user found'
      })
    }

    console.log('[Verify Email] User email verified:', data.user.id)

    // ✅ FIX: Update profile to mark email as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user.id)

    if (updateError) {
      console.error('[Verify Email] Profile update error:', updateError)
      // Don't fail verification if profile update fails
      console.warn('[Verify Email] Continuing despite profile update failure')
    }

    console.log('[Verify Email] Email verified successfully')

    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email
        }
      }
    }

  } catch (error) {
    console.error('[Verify Email] Error:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Email verification failed: ${(error as any).message || 'Unknown error'}`
    })
  }
})

