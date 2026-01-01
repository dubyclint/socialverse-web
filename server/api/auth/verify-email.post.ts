// ============================================================================
// FILE: /server/api/auth/verify-email.post.ts - COMPLETE FIX
// ============================================================================
// This endpoint verifies the email token sent to the user
// Handles Supabase session tokens from email verification links
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

    // ✅ Create Supabase client with ANON key (for client-side operations)
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
    // STEP 1: Try to verify using the token as a session token (PRIMARY METHOD)
    // ============================================================================
    // When user clicks email link, Supabase returns an access_token
    // This is a session token, not an OTP token
    console.log('[API] STEP 1: Attempting to verify token as session token...')
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token)

      if (!sessionError && sessionData?.user) {
        console.log('[API] ✅ Token verified as session token')
        console.log('[API] User ID:', sessionData.user.id)
        console.log('[API] Email:', sessionData.user.email)
        console.log('[API] Email confirmed at:', sessionData.user.email_confirmed_at)

        // ✅ SUCCESS: Email is confirmed (Supabase confirms it automatically)
        console.log('[API] ✅ Email verification successful via session token')
        
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

      if (sessionError) {
        console.log('[API] Session verification failed:', sessionError.message)
      }
    } catch (sessionErr: any) {
      console.log('[API] Session verification error:', sessionErr.message)
    }

    // ============================================================================
    // STEP 2: Try to verify using verifyOtp (FALLBACK METHOD)
    // ============================================================================
    // For OTP-based verification (if type is 'email' or 'recovery')
    console.log('[API] STEP 2: Attempting to verify token as OTP...')
    
    try {
      // ✅ FIX: Only use verifyOtp for 'email' and 'recovery' types
      // 'signup' type should use session token verification
      if (type === 'email' || type === 'recovery') {
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'email' | 'recovery'
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

        if (otpError) {
          console.log('[API] OTP verification failed:', otpError.message)
        }
      }
    } catch (otpErr: any) {
      console.log('[API] OTP verification error:', otpErr.message)
    }

    // ============================================================================
    // STEP 3: Try to verify using exchangeCodeForSession (ALTERNATIVE METHOD)
    // ============================================================================
    // For code-based verification
    console.log('[API] STEP 3: Attempting to verify token as code...')
    
    try {
      const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(token)

      if (!codeError && codeData?.user) {
        console.log('[API] ✅ Token verified as code')
        console.log('[API] User ID:', codeData.user.id)
        console.log('[API] Email confirmed at:', codeData.user.email_confirmed_at)

        return {
          success: true,
          message: 'Email verified successfully!',
          user: {
            id: codeData.user.id,
            email: codeData.user.email,
            email_confirmed_at: codeData.user.email_confirmed_at
          },
          session: {
            access_token: codeData.session?.access_token || null,
            refresh_token: codeData.session?.refresh_token || null
          }
        }
      }

      if (codeError) {
        console.log('[API] Code verification failed:', codeError.message)
      }
    } catch (codeErr: any) {
      console.log('[API] Code verification error:', codeErr.message)
    }

    // ============================================================================
    // STEP 4: All methods failed - return error
    // ============================================================================
    console.error('[API] ❌ All verification methods failed')
    
    let errorMessage = 'Email verification failed. Please try again or request a new verification link.'
    
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
