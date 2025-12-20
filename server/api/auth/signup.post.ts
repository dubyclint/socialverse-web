// FILE: /server/api/auth/signup.post.ts - FIXED FOR PROFILES VIEW
// ============================================================================
// SIGNUP ENDPOINT - FIXED: Works with profiles view and user table
// ✅ FIXED: Corrected import path for serverSupabaseClient
// ============================================================================

import { serverSupabaseClient } from '~/server/utils/supabase-server'

interface SignupResponse {
  success: boolean
  user?: {
    id: string
    email: string
    username: string
    full_name: string | null
  }
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<SignupResponse> => {
  console.log('[Auth/Signup] 📝 POST request received')
  
  try {
    const body = await readBody(event)
    console.log('[Auth/Signup] Request:', { 
      email: body.email, 
      username: body.username,
      hasPassword: !!body.password,
    })

    const { email, password, username, fullName } = body

    // ============================================================================
    // STEP 1: VALIDATION
    // ============================================================================
    console.log('[Auth/Signup] Step 1: Validating input...')
    
    if (!email || !password || !username) {
      const errorMsg = 'Email, password, and username are required'
      console.error('[Auth/Signup] ❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: errorMsg,
        data: { details: errorMsg }
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      const errorMsg = 'Invalid email format'
      console.error('[Auth/Signup] ❌', errorMsg)
      throw createError({
        statusCode: 400,
        statusMessage: errorMsg,
        data: { details: errorMsg }
      })
    }

    // Username validation
    if (!/^[a-z0-9_-]+$/i.test(username)) {
      const errorMsg = 'Username can only contain letters, numbers, underscores, and hyphens'
      console.error('[Auth/Signup] ❌', errorMsg)
      throw createError({
        statusCode: 400,
        statusMessage: errorMsg,
        data: { details: errorMsg }
      })
    }

    if (username.length < 3 || username.length > 30) {
      const errorMsg = 'Username must be between 3 and 30 characters'
      console.error('[Auth/Signup] ❌', errorMsg)
      throw createError({
        statusCode: 400,
        statusMessage: errorMsg,
        data: { details: errorMsg }
      })
    }

    console.log('[Auth/Signup] ✅ Input validation passed')

    // ============================================================================
    // STEP 2: Initialize Supabase client
    // ============================================================================
    console.log('[Auth/Signup] Step 2: Initializing Supabase client...')
    
    let supabase
    try {
      supabase = await serverSupabaseClient(event)
    } catch (err: any) {
      console.error('[Auth/Signup] ❌ Supabase initialization error:', err.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Database initialization failed'
      })
    }

    if (!supabase) {
      console.error('[Auth/Signup] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database client not available'
      })
    }

    console.log('[Auth/Signup] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 3: Check if username already exists
    // ============================================================================
    console.log('[Auth/Signup] Step 3: Checking if username exists...')
    
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user')
        .select('user_id')
        .eq('username', username.toLowerCase())
        .single()

      if (!checkError && existingProfile) {
        console.error('[Auth/Signup] ❌ Username already taken:', username)
        throw createError({
          statusCode: 400,
          statusMessage: 'Username already taken',
          data: { details: 'This username is already in use' }
        })
      }

      console.log('[Auth/Signup] ✅ Username is available')
    } catch (err: any) {
      if (err.statusCode === 400) {
        throw err
      }
      // PGRST116 = not found, which is what we want
      if (err.code !== 'PGRST116') {
        console.warn('[Auth/Signup] ⚠️ Username check warning:', err.message)
      }
    }

    // ============================================================================
    // STEP 4: Create user in Supabase Auth
    // ============================================================================
    console.log('[Auth/Signup] Step 4: Creating user in Supabase Auth...')
    
    let authUser
    try {
      const { data: { user }, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
            full_name: fullName || username,
            avatar_url: null
          }
        }
      })

      if (signupError) {
        console.error('[Auth/Signup] ❌ Auth signup error:', signupError.message)
        throw createError({
          statusCode: 400,
          statusMessage: signupError.message,
          data: { details: signupError.message }
        })
      }

      if (!user) {
        console.error('[Auth/Signup] ❌ No user returned from signup')
        throw createError({
          statusCode: 500,
          statusMessage: 'Signup failed - no user created'
        })
      }

      authUser = user
      console.log('[Auth/Signup] ✅ User created in auth:', user.id)
    } catch (err: any) {
      if (err.statusCode) {
        throw err
      }
      console.error('[Auth/Signup] ❌ Signup error:', err.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user: ' + err.message
      })
    }

    // ============================================================================
    // STEP 5: Profile auto-created by database trigger
    // ============================================================================
    console.log('[Auth/Signup] Step 5: Profile auto-created by database trigger')
    
    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify profile was created
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.warn('[Auth/Signup] ⚠️ Profile verification warning:', profileError.message)
      } else if (profile) {
        console.log('[Auth/Signup] ✅ Profile verified:', profile.id)
      }
    } catch (err: any) {
      console.warn('[Auth/Signup] ⚠️ Profile verification error:', err.message)
    }

    // ============================================================================
    // STEP 6: Return success response
    // ============================================================================
    console.log('[Auth/Signup] ✅ Signup completed successfully')

    return {
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        username: username.toLowerCase(),
        full_name: fullName || username
      },
      message: 'Signup successful! Please check your email to verify your account.'
    }

  } catch (err: any) {
    console.error('[Auth/Signup] ❌ Unexpected error:', err)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred during signup',
      data: { details: err.message }
    })
  }
})

