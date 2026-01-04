// ============================================================================
// FILE: /server/api/auth/signup.post.ts
// SIGNUP ENDPOINT - COMPLETE CORRECTED VERSION
// ============================================================================
// FIXES:
// ✅ Uses backend endpoint (not direct Supabase)
// ✅ Inserts into 'user' table via profiles view
// ✅ Proper error handling and validation
// ✅ Returns complete user data
// ✅ Sends verification email
// ✅ Comprehensive logging
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] ============ SIGNUP REQUEST START ============')
    
    const body = await readBody(event)
    const { email, password, username, fullName } = body

    console.log('[API] Signup attempt:', { email, username })

    // ============================================================================
    // STEP 1: Validate Input
    // ============================================================================
    console.log('[API] STEP 1: Validating input...')
    
    if (!email || !password || !username) {
      console.error('[API] ❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    if (password.length < 6) {
      console.error('[API] ❌ Password too short')
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters'
      })
    }

    if (username.length < 3) {
      console.error('[API] ❌ Username too short')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be at least 3 characters'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('[API] ❌ Invalid email format')
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    console.log('[API] ✅ Input validation passed')

    // ============================================================================
    // STEP 2: Initialize Supabase Admin Client
    // ============================================================================
    console.log('[API] STEP 2: Initializing Supabase...')
    
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
    // STEP 3: Create Auth User
    // ============================================================================
    console.log('[API] STEP 3: Creating auth user...')
    console.log('[API] Email:', email.trim().toLowerCase())
    console.log('[API] Username:', username.trim().toLowerCase())
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: false,  // User must verify email
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
      
      if (authError.message?.includes('already exists')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'This email is already registered'
        })
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: authError.message || 'Failed to create user'
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
    // STEP 4: Create Profile via profiles view
    // ============================================================================
    // The profiles view has INSTEAD OF INSERT trigger
    // So inserting into profiles will automatically insert into user table
    
    console.log('[API] STEP 4: Creating user profile via profiles view...')
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')  // ✅ Insert into profiles view
      .insert([{
        id: userId,  // ✅ Use userId as id
        user_id: userId,  // ✅ Also set user_id
        username: username.trim().toLowerCase(),
        full_name: fullName?.trim() || username.trim(),
        avatar_url: null,
        bio: '',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (profileError) {
      console.warn('[API] ⚠️ Profile creation warning:', {
        message: profileError.message,
        code: profileError.code
      })
      // Don't fail signup if profile creation fails
      // User is already created in auth
      // The auto-profile trigger should create it
    } else {
      console.log('[API] ✅ Profile created successfully')
      console.log('[API] Profile data:', {
        id: profileData?.id,
        username: profileData?.username,
        full_name: profileData?.full_name
      })
    }

    // ============================================================================
    // STEP 5: Send Verification Email
    // ============================================================================
    console.log('[API] STEP 5: Sending verification email...')
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    })

    if (resendError) {
      console.warn('[API] ⚠️ Email send warning:', resendError.message)
      // Don't fail signup if email fails
    } else {
      console.log('[API] ✅ Verification email sent')
    }

    // ============================================================================
    // STEP 6: Return Success Response
    // ============================================================================
    console.log('[API] ✅ Signup successful')
    console.log('[API] ============ SIGNUP REQUEST END ============')

    return {
      success: true,
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        full_name: fullName?.trim() || username.trim(),
        avatar_url: null
      },
      message: 'Account created successfully! Check your email to verify your account.',
      requiresEmailVerification: true
    }

  } catch (error: any) {
    console.error('[API] ============ SIGNUP ERROR ============')
    console.error('[API] Error type:', error.constructor.name)
    console.error('[API] Error message:', error.message)
    console.error('[API] Error status:', error.statusCode)
    console.error('[API] ============ END ERROR ============')
    
    throw error
  }
})
