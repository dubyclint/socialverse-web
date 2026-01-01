// ============================================================================
// FILE: /server/api/auth/verify-email.post.ts - SIMPLIFIED FIX
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

    console.log('[API] Token received (first 20 chars):', token.substring(0, 20) + '...')
    console.log('[API] Type:', type || 'not specified')

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
    // STEP 1: Try session token verification (PRIMARY)
    // ============================================================================
    console.log('[API] STEP 1: Attempting session token verification...')
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token)

      if (!sessionError && sessionData?.user) {
        console.log('[API] ✅ Session token verified')
        console.log('[API] User ID:', sessionData.user.id)
        
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
    } catch (err: any) {
      console.log('[API] Session verification error:', err.message)
    }

    // ============================================================================
    // STEP 2: Try OTP verification (FALLBACK)
    // ============================================================================
    console.log('[API] STEP 2: Attempting OTP verification...')
    
    try {
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      })

      if (!otpError && otpData?.user) {
        console.log('[API] ✅ OTP verified')
        
        return {
          success: true,
          message: 'Email verified successfully!',
          user: {
            id: otpData.user.id,
            email: otpData.user.email,
            email_confirmed_at: otpData.user.email_confirmed_at
          }
        }
      }
    } catch (err: any) {
      console.log('[API] OTP verification error:', err.message)
    }

    // ============================================================================
    // STEP 3: Try code exchange (ALTERNATIVE)
    // ============================================================================
    console.log('[API] STEP 3: Attempting code exchange...')
    
    try {
      const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(token)

      if (!codeError && codeData?.user) {
        console.log('[API] ✅ Code exchange verified')
        
        return {
          success: true,
          message: 'Email verified successfully!',
          user: {
            id: codeData.user.id,
            email: codeData.user.email,
            email_confirmed_at: codeData.user.email_confirmed_at
          }
        }
      }
    } catch (err: any) {
      console.log('[API] Code exchange error:', err.message)
    }

    // ============================================================================
    // All methods failed
    // ============================================================================
    console.error('[API] ❌ All verification methods failed')
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Email verification failed. Please try again or request a new verification link.'
    })

  } catch (error: any) {
    console.error('[API] ============ VERIFICATION ERROR ============')
    console.error('[API] Error:', error.message)
    throw error
  }
})
