// FILE: /server/api/auth/signup.post.ts - FIXED FOR PROFILES VIEW
// ============================================================================
// SIGNUP ENDPOINT - FIXED: Works with profiles view and consistent table usage
// ✅ FIXED: Uses 'profiles' table consistently
// ✅ FIXED: Proper profile creation verification with retries
// ✅ FIXED: Comprehensive error handling and logging
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
    // STEP 3: Check if username already exists (FIXED: Use 'profiles' table)
    // ============================================================================
    console.log('[Auth/Signup] Step 3: Checking if username exists...')
    
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')  // ✅ FIXED: Use 'profiles' table consistently
        .select('id')
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
    // STEP 5: Verify profile was created by database trigger (WITH RETRIES)
    // ============================================================================
    console.log('[Auth/Signup] Step 5: Verifying profile creation...')
    
    let profileCreated = false
    let retries = 0
    const maxRetries = 5
    const retryDelay = 200 // milliseconds

    while (!profileCreated && retries < maxRetries) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!profileError && profile) {
          profileCreated = true
          console.log('[Auth/Signup] ✅ Profile verified by trigger:', profile.id)
          break
        }

        retries++
        if (retries < maxRetries) {
          console.log(`[Auth/Signup] ⏳ Profile not found yet, retrying... (${retries}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      } catch (err: any) {
        console.warn('[Auth/Signup] ⚠️ Profile check error:', err.message)
        retries++
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }

    // ============================================================================
    // STEP 6: If trigger failed, manually create profile
    // ============================================================================
    if (!profileCreated) {
      console.warn('[Auth/Signup] ⚠️ Profile not auto-created by trigger, creating manually...')
      
      try {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            username: username.toLowerCase(),
            full_name: fullName || username,
            email: email,
            avatar_url: null,
            bio: null,
            profile_completed: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('[Auth/Signup] ❌ Manual profile creation failed:', createError.message)
          throw createError
        }

        console.log('[Auth/Signup] ✅ Profile created manually:', newProfile.id)
        profileCreated = true
      } catch (err: any) {
        console.error('[Auth/Signup] ❌ Failed to create profile:', err.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create user profile: ' + err.message
        })
      }
    }

    // ============================================================================
    // STEP 7: Log signup event
    // ============================================================================
    try {
      await supabase
        .from('auth_logs')
        .insert({
          user_id: authUser.id,
          action: 'signup',
          details: {
            email,
            username: username.toLowerCase(),
            timestamp: new Date().toISOString()
          }
        })
        .catch(err => console.warn('[Auth/Signup] ⚠️ Failed to log signup:', err.message))
    } catch (err: any) {
      console.warn('[Auth/Signup] ⚠️ Logging error:', err.message)
    }

    // ============================================================================
    // STEP 8: Return success response
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
