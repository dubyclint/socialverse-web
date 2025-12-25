// ============================================================================
// FILE: /server/api/auth/verify-email.post.ts - EMAIL VERIFICATION ENDPOINT
// ============================================================================
// This endpoint verifies the email token sent to the user
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    console.log('[API] Email verification request received')

    const { token, type } = body

    // ✅ VALIDATE: Token is required
    if (!token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    // ✅ VALIDATE: Type should be 'email' or 'recovery'
    if (!type || !['email', 'recovery'].includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification type'
      })
    }

    // ✅ Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[API] Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // ✅ STEP 1: Verify the token using Supabase
    console.log('[API] Verifying email token...')
    
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'email' | 'recovery'
    })

    if (error) {
      console.error('[API] Email verification error:', {
        message: error.message,
        status: error.status
      })
      
      let errorMessage = error.message || 'Email verification failed'
      
      if (error.message?.includes('expired')) {
        errorMessage = 'Verification link has expired. Please request a new one.'
      } else if (error.message?.includes('invalid')) {
        errorMessage = 'Invalid verification link'
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: errorMessage
      })
    }

    if (!data.user) {
      console.error('[API] No user data returned from verification')
      throw createError({
        statusCode: 500,
        statusMessage: 'Verification failed: No user data'
      })
    }

    console.log('[API] ✅ Email verified for user:', data.user.id)

    return {
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at
      },
      session: {
        access_token: data.session?.access_token || null,
        refresh_token: data.session?.refresh_token || null
      }
    }

  } catch (error: any) {
    console.error('[API] Email verification error:', {
      message: error.message,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage
    })
    throw error
  }
})
