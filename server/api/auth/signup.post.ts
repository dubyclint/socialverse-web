// FILE: /server/api/auth/signup.post.ts
// ============================================================================
// FIXED SIGNUP - Removes redundant insert
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
    // The trigger automatically creates the user profile, so we just wait a bit
    console.log('[SIGNUP] Waiting for profile creation...')
    await new Promise(resolve => setTimeout(resolve, 500))

    // ============================================================================
    // STEP 4: Send verification email
    // ============================================================================
    console.log('[SIGNUP] Sending verification email...')
    
    const verificationToken = Buffer.from(
      JSON.stringify({
        userId: authUserId,
        email: email.trim().toLowerCase(),
        timestamp: Date.now()
      })
    ).toString('base64')

    const emailResult = await sendVerificationEmail(
      email.trim().toLowerCase(),
      username.trim(),
      verificationToken
    )

    if (!emailResult.success) {
      console.warn('[SIGNUP] Email sending failed:', emailResult.error)
    } else {
      console.log('[SIGNUP] Verification email sent')
    }

    console.log('[SIGNUP] ✓ SIGNUP SUCCESS')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: 'Account created! Check your email to verify.',
      requiresEmailVerification: true
    }

  } catch (error: any) {
    console.error('[SIGNUP] Error:', error?.message || error)
    throw error
  }
})
