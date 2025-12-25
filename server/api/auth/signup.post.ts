// ============================================================================
// FILE: /server/api/auth/signup.post.ts - FIXED VERSION (Remove createSession)
// ============================================================================
// Removed the problematic createSession call - not needed for signup
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    console.log('[API] Signup request body:', body)

    const { email, password, username, fullName, phone, bio, location } = body

    // ✅ VALIDATE: Only email and password are required for auth.users
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // ✅ VALIDATE: Username is required for public.user profile
    if (!username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required'
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

    // ✅ Validate password length
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters'
      })
    }

    // ✅ Create Supabase client with service role (for server-side)
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[API] Supabase URL configured:', !!supabaseUrl)
    console.log('[API] Service role key configured:', !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error: Missing Supabase credentials'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ✅ STEP 1: Create user in auth.users
    // The trigger will automatically create the profile in public.user
    console.log('[API] Creating auth user with email:', email)
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        username: username.trim().toLowerCase(),
        full_name: fullName?.trim() || username.trim(),
        avatar_url: null
      }
    })

    if (authError) {
      console.error('[API] Auth creation error:', {
        message: authError.message,
        status: authError.status,
        code: authError.code
      })
      
      // ⚠️ IMPORTANT: Provide more specific error messages
      let errorMessage = authError.message || 'Failed to create user'
      
      if (authError.message?.includes('already exists')) {
        errorMessage = 'This email is already registered'
      } else if (authError.message?.includes('invalid')) {
        errorMessage = 'Invalid email or password'
      } else if (authError.status === 500) {
        errorMessage = 'Supabase service error. Please try again later.'
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: errorMessage
      })
    }

    if (!authData.user) {
      console.error('[API] Auth user creation returned no user data')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed: No user data returned'
      })
    }

    const userId = authData.user.id
    console.log('[API] ✅ Auth user created:', userId)
    console.log('[API] ℹ️ Profile will be created automatically by trigger')

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
    console.error('[API] Signup error:', {
      message: error.message,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      stack: error.stack
    })
    throw error
  }
})
