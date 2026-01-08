// CORRECTED: /server/api/auth/signup.post.ts
// ============================================================================
// FIXED SIGNUP - Email failure doesn't block signup (CORRECTED)
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, username } = body

    console.log('[SIGNUP] Starting signup for:', email)

    // ============================================================================
    // STEP 1: Validate input
    // ============================================================================
    if (!email || !password || !username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    // ============================================================================
    // STEP 2: Create Supabase Auth user
    // ============================================================================
    console.log('[SIGNUP] Creating auth user...')
    
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          username: username.trim().toLowerCase()
        }
      }
    })

    if (authError) {
      console.error('[SIGNUP] Auth error:', authError.message)
      throw createError({
        statusCode: 400,
        statusMessage: authError.message
      })
    }

    const authUserId = authData?.user?.id
    if (!authUserId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    console.log('[SIGNUP] Auth user created:', authUserId)

    // ============================================================================
    // STEP 3: Wait for trigger to create profile
    // ============================================================================
    console.log('[SIGNUP] Waiting for profile creation...')
    await new Promise(resolve => setTimeout(resolve, 500))

    // ============================================================================
    // STEP 4: Send verification email (NON-BLOCKING) - FIXED
    // ============================================================================
    console.log('[SIGNUP] Sending verification email...')
    
    let emailSent = false
    let emailError = null

    try {
      const verificationToken = Buffer.from(
        JSON.stringify({
          userId: authUserId,
          email: email.trim().toLowerCase(),
          timestamp: Date.now()
        })
      ).toString('base64')

      console.log('[SIGNUP] Calling sendVerificationEmail...')
      const emailResult = await sendVerificationEmail(
        email.trim().toLowerCase(),
        username.trim(),
        verificationToken
      )

      console.log('[SIGNUP] Email result:', emailResult)

      if (emailResult && emailResult.success) {
        console.log('[SIGNUP] ✅ Verification email sent successfully')
        emailSent = true
      } else {
        console.warn('[SIGNUP] ⚠️ Email sending failed:', emailResult?.error || 'Unknown error')
        emailError = emailResult?.error || 'Unknown email error'
        // Don't throw - email failure shouldn't block signup
      }
    } catch (emailException: any) {
      console.error('[SIGNUP] ❌ Email exception caught:', emailException?.message || emailException)
      emailError = emailException?.message || 'Email service error'
      // Don't throw - email failure shouldn't block signup
    }

    console.log('[SIGNUP] ✅ SIGNUP SUCCESS')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: emailSent 
        ? 'Account created! Check your email to verify.' 
        : 'Account created! Please check your email for verification (or contact support if you don\'t receive it).',
      requiresEmailVerification: true,
      emailSent: emailSent,
      emailError: emailError || null
    }

  } catch (error: any) {
    console.error('[SIGNUP] ❌ Fatal error:', error?.message || error)
    console.error('[SIGNUP] Error stack:', error?.stack)
    throw error
  }
})
