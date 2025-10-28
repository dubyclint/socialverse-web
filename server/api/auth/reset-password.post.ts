import { serverSupabaseClient } from '#supabase/server'

interface ResetPasswordRequest {
  email: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<ResetPasswordRequest>(event)

    const { email } = body

    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    console.log('[Reset Password] Password reset request for:', email)

    // ✅ FIX: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('[Reset Password] Invalid email format:', email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // ✅ FIX: Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      console.error('[Reset Password] User not found:', email)
      // Don't reveal if email exists (security best practice)
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      }
    }

    console.log('[Reset Password] User found, sending reset email')

    // ✅ FIX: Use Supabase auth to send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password-confirm`
    })

    if (resetError) {
      console.error('[Reset Password] Reset email error:', resetError)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to send reset email: ${resetError.message}`
      })
    }

    console.log('[Reset Password] Password reset email sent successfully')

    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    }

  } catch (error) {
    console.error('[Reset Password] Error:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Password reset failed: ${(error as any).message || 'Unknown error'}`
    })
  }
})
