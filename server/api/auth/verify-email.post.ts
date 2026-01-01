// ============================================================================
// FILE: /server/api/auth/verify-email.post.ts - FIXED EMAIL VERIFICATION
// ============================================================================
// This endpoint verifies the email token sent to the user
// Handles both OTP tokens and Supabase session tokens
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    console.log('[API] ============ EMAIL VERIFICATION START ============')
    console.log('[API] Email verification request received')

    const { token, type } = body

    // ✅ VALIDATE: Token is required
    if (!token) {
      console.error('[API] ❌ Token is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    // ✅ VALIDATE: Type should be 'email', 'recovery', or 'signup'
    const validTypes = ['email', 'recovery', 'signup']
    if (!type || !validTypes.includes(type)) {
      console.error('[API] ❌ Invalid verification type:', type)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification type'
      })
    }

    console.log('[API] Token received (first 20 chars):', token.substring(0, 20) + '...')
    console.log('[API] Type:', type)

    // ✅ Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NUXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[API] ❌ Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('[API] ✅ Supabase client created')

    // ============================================================================
    // STEP 1: Try to verify using the token as a session token
    // ============================================================================
    console.log('[API] STEP 1: Attempting to verify token as session token...')
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token)

    if (!sessionError && sessionData?.user) {
      console.log('[API] ✅ Token verified as session token')
      console.log('[API] User ID:', sessionData.user.id)
      console.log('[API] Email confirmed at:', sessionData.user.email_confirmed_at)

      // If email is already confirmed, return success
      if (sessionData.user.email_confirmed_at) {
        console.log('[API] ✅ Email already confirmed')
        return {
          success: true,
          message: 'Email verified successfully!',
          user: {
            id: sessionData.user.id,
            email: sessionData.user.email,
            email_confirmed_at: sessionData.user.email_confirmed_at
          }
        }
      }
    }

    // ============================================================================
    // STEP 2: Try to verify using verifyOtp (for OTP tokens)
    // ============================================================================
    console.log('[API] STEP 2: Attempting to verify token as OTP...')
    
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'email' | 'recovery' | 'signup'
    })

    if (!otpError && otpData?.user) {
      console.log('[API] ✅ Token verified as OTP')
      console.log('[API] User ID:', otpData.user.id)
      console.log('[API] Email confirmed at:', otpData.user.email_confirmed_at)

      return {
        success: true,
        message: 'Email verified successfully!',
        user: {
          id: otpData.user.id,
          email: otpData.user.email,
          email_confirmed_at: otpData.user.email_confirmed_at
        },
        session: {
          access_token: otpData.session?.access_token || null,
          refresh_token: otpData.session?.refresh_token || null
        }
      }
    }

    // ============================================================================
    // STEP 3: Both methods failed - return error
    // ============================================================================
    console.error('[API] ❌ Both verification methods failed')
    console.error('[API] Session error:', sessionError?.message)
    console.error('[API] OTP error:', otpError?.message)
    
    let errorMessage = 'Email verification failed'
    
    if (otpError?.message?.includes('expired')) {
      errorMessage = 'Verification link has expired. Please request a new one.'
    } else if (otpError?.message?.includes('invalid')) {
      errorMessage = 'Invalid verification link'
    } else if (otpError?.message?.includes('used')) {
      errorMessage = 'This verification link has already been used'
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })

  } catch (error: any) {
    console.error('[API] ============ VERIFICATION ERROR ============')
    console.error('[API] Error message:', error.message)
    console.error('[API] Error status:', error.statusCode)
    console.error('[API] Error details:', error.statusMessage)
    console.error('[API] ============ END ERROR ============')
    throw error
  }
})
