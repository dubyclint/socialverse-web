// ============================================================================
// FILE: /server/api/auth/resend-verification.post.ts - RESEND VERIFICATION EMAIL
// ============================================================================
// This endpoint resends the verification email to the user
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    console.log('[API] Resend verification email request received')

    const { email } = body

    // ✅ VALIDATE: Email is required
    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // ✅ Create Supabase client with service role
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ✅ STEP 1: Check if user exists
    console.log('[API] Checking if user exists:', email)
    
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers()

    if (getUserError) {
      console.error('[API] Error listing users:', getUserError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to check user'
      })
    }

    const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.error('[API] User not found:', email)
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // ✅ STEP 2: Check if email is already confirmed
    if (user.email_confirmed_at) {
      console.log('[API] Email already confirmed for user:', email)
      return {
        success: true,
        message: 'Email is already verified',
        alreadyVerified: true
      }
    }

    // ✅ STEP 3: Resend verification email
    console.log('[API] Resending verification email to:', email)
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase()
    })

    if (resendError) {
      console.error('[API] Resend verification error:', {
        message: resendError.message,
        status: resendError.status
      })
      
      let errorMessage = resendError.message || 'Failed to resend verification email'
      
      if (resendError.message?.includes('rate')) {
        errorMessage = 'Too many requests. Please try again later.'
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: errorMessage
      })
    }

    console.log('[API] ✅ Verification email resent to:', email)

    return {
      success: true,
      message: 'Verification email sent! Check your inbox and spam folder.',
      email: email
    }

  } catch (error: any) {
    console.error('[API] Resend verification error:', {
      message: error.message,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage
    })
    throw error
  }
})
