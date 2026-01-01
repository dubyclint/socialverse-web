// ============================================================================
// FILE: /server/api/auth/signup.post.ts - COMPLETE FIX WITH DETAILED LOGGING
// ============================================================================
// Signup endpoint with comprehensive error handling and logging
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] ============ SIGNUP REQUEST START ============')
    
    const body = await readBody(event)
    
    console.log('[API] Request body received:', {
      email: body.email,
      username: body.username,
      password: body.password ? '***' : 'MISSING',
      fullName: body.fullName
    })

    const { email, password, username, fullName, phone, bio, location } = body

    // ============================================================================
    // VALIDATION STEP 1: Email and Password
    // ============================================================================
    console.log('[API] VALIDATION: Checking email and password...')
    
    if (!email) {
      console.error('[API] ❌ Email is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    if (!password) {
      console.error('[API] ❌ Password is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'Password is required'
      })
    }

    // ============================================================================
    // VALIDATION STEP 2: Username
    // ============================================================================
    console.log('[API] VALIDATION: Checking username...')
    
    if (!username) {
      console.error('[API] ❌ Username is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required'
      })
    }

    if (username.length < 3) {
      console.error('[API] ❌ Username too short:', username.length)
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be at least 3 characters'
      })
    }

    // ============================================================================
    // VALIDATION STEP 3: Email Format
    // ============================================================================
    console.log('[API] VALIDATION: Checking email format...')
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('[API] ❌ Invalid email format:', email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // ============================================================================
    // VALIDATION STEP 4: Password Length
    // ============================================================================
    console.log('[API] VALIDATION: Checking password length...')
    
    if (password.length < 6) {
      console.error('[API] ❌ Password too short:', password.length)
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters'
      })
    }

    // ============================================================================
    // VALIDATION STEP 5: Supabase Configuration
    // ============================================================================
    console.log('[API] VALIDATION: Checking Supabase configuration...')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[API] Supabase URL configured:', !!supabaseUrl)
    console.log('[API] Service role key configured:', !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] ❌ Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    // ============================================================================
    // CREATE SUPABASE CLIENT
    // ============================================================================
    console.log('[API] Creating Supabase client...')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[API] ✅ Supabase client created')

    // ============================================================================
    // STEP 1: Create Auth User
    // ============================================================================
    console.log('[API] STEP 1: Creating auth user...')
    console.log('[API] Email:', email.trim().toLowerCase())
    console.log('[API] Username:', username.trim().toLowerCase())
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: false,
      user_metadata: {
        username: username.trim().toLowerCase(),
        full_name: fullName?.trim() || username.trim(),
        avatar_url: null
      }
    })

    if (authError) {
      console.error('[API] ❌ Auth creation error:', {
        message: authError.message,
        status: authError.status,
        code: authError.code
      })
      
      let errorMessage = authError.message || 'Failed to create user'
  
      if (authError.message?.includes('already exists')) {
        errorMessage = 'This email is already registered'
      } else if (authError.message?.includes('invalid')) {
        errorMessage = 'Invalid email or password'
      } else if (authError.message?.includes('password')) {
        errorMessage = 'Password does not meet requirements'
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: errorMessage
      })
    }

    if (!authData?.user) {
      console.error('[API] ❌ No user data returned from auth creation')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    const userId = authData.user.id
    console.log('[API] ✅ Auth user created:', userId)

    // ============================================================================
    // STEP 2: Send Verification Email
    // ============================================================================
    console.log('[API] STEP 2: Sending verification email...')
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    })

    if (resendError) {
      console.warn('[API] ⚠️ Error sending verification email:', resendError.message)
      // Don't throw - user was created successfully
    } else {
      console.log('[API] ✅ Verification email sent')
    }

    // ============================================================================
    // SUCCESS RESPONSE
    // ============================================================================
    console.log('[API] ✅ Signup successful for user:', userId)
    console.log('[API] ============ SIGNUP REQUEST END ============')

    return {
      success: true,
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        display_name: fullName?.trim() || username.trim()
      },
      needsConfirmation: true,
      message: 'Account created successfully! Please check your email to verify your account.'
    }

  } catch (error: any) {
    console.error('[API] ============ SIGNUP ERROR ============')
    console.error('[API] Error message:', error.message)
    console.error('[API] Error status:', error.statusCode)
    console.error('[API] Error details:', error.statusMessage)
    console.error('[API] ============ END ERROR ============')
    
    throw error
  }
})
