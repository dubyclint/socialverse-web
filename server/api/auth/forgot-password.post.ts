import { serverSupabaseClient } from '#supabase/server'

interface ForgotPasswordRequest {
  email: string
  newPassword: string
  token: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<ForgotPasswordRequest>(event)

    const { email, newPassword, token } = body

    // Validate required fields
    if (!email || !newPassword || !token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, new password, and token are required'
      })
    }

    console.log('[Forgot Password] Processing password reset for:', email)

    // ✅ FIX: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('[Forgot Password] Invalid email format:', email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // ✅ FIX: Validate password strength
    if (newPassword.length < 8) {
      console.error('[Forgot Password] Password too short')
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters long'
      })
    }

    console.log('[Forgot Password] Validating reset token')

    // ✅ FIX: Use Supabase auth to verify OTP and update password
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery'
    })

    if (error) {
      console.error('[Forgot Password] Token verification error:', error)
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid or expired reset token: ${error.message}`
      })
    }

    if (!data.user) {
      console.error('[Forgot Password] No user returned from token verification')
      throw createError({
        statusCode: 500,
        statusMessage: 'Password reset failed: No user found'
      })
    }

    console.log('[Forgot Password] Token verified, updating password for user:', data.user.id)

    // ✅ FIX: Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('[Forgot Password] Password update error:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update password: ${updateError.message}`
      })
    }

    console.log('[Forgot Password] Password updated successfully')

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    }

  } catch (error) {
    console.error('[Forgot Password] Error:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Password reset failed: ${(error as any).message || 'Unknown error'}`
    })
  }
})

