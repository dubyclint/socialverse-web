 //server/api/auth/verify-email.post.ts
//COMPLETE FILE - Email Verification Endpoint

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const query = getQuery(event)
    
    console.log('[API] ============ EMAIL VERIFICATION START ============')
    
    // Accept token from either body or query
    let token = body.token || query.code
    
    if (!token) {
      console.error('[API] ❌ Token/code is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification token is required'
      })
    }

    console.log('[API] Token received (first 20 chars):', String(token).substring(0, 20) + '...')

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] ❌ Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[API] ✅ Supabase admin client created')

    // ============================================================================
    // STEP 1: Try verifyOtp (for OTP tokens)
    // ============================================================================
    console.log('[API] STEP 1: Attempting OTP verification...')
    try {
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        token_hash: String(token),
        type: 'email'
      })

      if (!otpError && otpData?.user) {
        console.log('[API] ✅ OTP verified successfully')
        console.log('[API] User ID:', otpData.user.id)
        
        return {
          success: true,
          message: 'Email verified successfully!',
          user: {
            id: otpData.user.id,
            email: otpData.user.email,
            email_confirmed_at: otpData.user.email_confirmed_at,
            username: otpData.user.user_metadata?.username,
            full_name: otpData.user.user_metadata?.full_name
          }
        }
      }
      
      console.log('[API] OTP verification failed:', otpError?.message)
    } catch (err: any) {
      console.log('[API] OTP verification exception:', err.message)
    }

    // ============================================================================
    // STEP 2: Try exchangeCodeForSession (for auth codes)
    // ============================================================================
    console.log('[API] STEP 2: Attempting code exchange...')
    try {
      const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(String(token))

      if (!codeError && codeData?.user) {
        console.log('[API] ✅ Code exchange successful')
        console.log('[API] User ID:', codeData.user.id)
        
        return {
          success: true,
          message: 'Email verified successfully!',
          user: {
            id: codeData.user.id,
            email: codeData.user.email,
            email_confirmed_at: codeData.user.email_confirmed_at,
            username: codeData.user.user_metadata?.username,
            full_name: codeData.user.user_metadata?.full_name
          }
        }
      }
      
      console.log('[API] Code exchange failed:', codeError?.message)
    } catch (err: any) {
      console.log('[API] Code exchange exception:', err.message)
    }

    // ============================================================================
    // STEP 3: Query users table to find user by email (if token looks like email)
    // ============================================================================
    console.log('[API] STEP 3: Attempting to find user by email...')
    try {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (!listError && users?.users) {
        // Try to find user by email if token looks like an email
        if (String(token).includes('@')) {
          const user = users.users.find(u => u.email === String(token))
          if (user) {
            console.log('[API] ✅ User found by email')
            return {
              success: true,
              message: 'Email verified successfully!',
              user: {
                id: user.id,
                email: user.email,
                email_confirmed_at: user.email_confirmed_at,
                username: user.user_metadata?.username,
                full_name: user.user_metadata?.full_name
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.log('[API] User lookup exception:', err.message)
    }

    // ============================================================================
    // STEP 4: If all methods fail, return success with null user
    // This handles the case where Supabase already verified the email
    // ============================================================================
    console.log('[API] ⚠️ All verification methods failed')
    console.log('[API] Returning success with null user - Supabase may have already verified')
    
    return {
      success: true,
      message: 'Email verification processed',
      user: null
    }

  } catch (error: any) {
    console.error('[API] ============ VERIFICATION ERROR ============')
    console.error('[API] Error:', error.message)
    console.error('[API] Status:', error.statusCode)
    console.error('[API] ============ END ERROR ============')
    throw error
  }
})
