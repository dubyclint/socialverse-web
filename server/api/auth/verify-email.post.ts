import { serverSupabaseClient } from '#supabase/server'

interface VerifyEmailRequest {
  token: string
  verifyType?: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<VerifyEmailRequest>(event)
    
    const { token, verifyType = 'signup' } = body

    if (!token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    console.log('[Verify Email] Attempting to verify email with token, type:', verifyType)

    // ✅ FIX: Use correct OTP type for signup verification
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: verifyType as 'signup' | 'email_change' | 'phone_change'
    })

    if (error) {
      console.error('[Verify Email] Verification error:', error)
      throw createError({
        statusCode: 400,
        statusMessage: `Email verification failed: ${error.message}`
      })
    }

    if (!data.user) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email verification failed: No user found'
      })
    }

    // ✅ FIX: Update profile email_verified status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', data.user.id)

    if (updateError) {
      console.error('[Verify Email] Failed to update profile:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update profile: ${updateError.message}`
      })
    }

    console.log('[Verify Email] ✅ Email verified successfully for user:', data.user.id)

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      },
      message: 'Email verified successfully!'
    }

  } catch (err: any) {
    console.error('[Verify Email] Error:', err)
    throw err
  }
})
