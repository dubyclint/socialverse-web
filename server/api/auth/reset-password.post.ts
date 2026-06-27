// ============================================================================
// FILE: /server/api/auth/reset-password.post.ts - PRODUCTION RECONCILED
// ============================================================================
import { defineEventHandler, readBody, createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

interface ResetPasswordRequest {
  email: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<ResetPasswordRequest>(event)

    if (!body || !body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email address is required.'
      })
    }

    const email = body.email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format provided.'
      })
    }

    console.log('[Reset Password] Processing challenge request routing for:', email)

    // Verify account presence securely
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle()

    if (!profile) {
      console.warn('[Reset Password] Target email not found on system. Masking response for security.')
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      }
    }

    // ✅ FIXED: Points directly to your flat root level recovery page component
    const siteUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${siteUrl}/reset-password-confirm`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    })

    if (resetError) {
      console.error('[Reset Password] Supabase communication failed:', resetError.message)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to transmit recovery data payload: ${resetError.message}`
      })
    }

    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    }

  } catch (error: any) {
    console.error('[Reset Password] Critical pipeline fault:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal password reset pipeline error.'
    })
  }
})
