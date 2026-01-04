// FILE 1: server/api/auth/verify-email.post.ts
// ISSUE: Frontend sends code via query param, backend expects token in body
 // FIX: Accept code from query params and handle it properly

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
    console.log('[API] ✅ Supabase client created')

    // Try to verify the OTP
    console.log('[API] Attempting OTP verification...')
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: String(token),
      type: 'email'
    })

    if (!otpError && otpData?.user) {
      console.log('[API] ✅ Email verified successfully')
      console.log('[API] User ID:', otpData.user.id)
      
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

    console.error('[API] ❌ Verification failed:', otpError?.message)
    throw createError({
      statusCode: 400,
      statusMessage: 'Email verification failed. The verification link may have expired.'
    })

  } catch (error: any) {
    console.error('[API] Verification error:', error.message)
    throw error
  }
})
