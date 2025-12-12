// FILE: /server/api/auth/signup.post.ts - FIXED VERSION
// ============================================================================
// SIGNUP ENDPOINT - Create new user account with proper error handling
// ============================================================================

export default defineEventHandler(async (event) => {
  console.log('[Auth/Signup] POST request received')
  
  try {
    const body = await readBody(event)
    console.log('[Auth/Signup] Request data:', { 
      email: body.email, 
      username: body.username,
      hasPassword: !!body.password 
    })

    const { email, password, username, fullName } = body

    // Validate required fields
    if (!email || !password || !username) {
      console.error('[Auth/Signup] Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // Validate username format
    if (!/^[a-z0-9_-]+$/i.test(username)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
      })
    }

    if (username.length < 3 || username.length > 30) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be between 3 and 30 characters'
      })
    }

    // Validate password
    if (password.length < ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters'
      })
    }

    console.log('[Auth/Signup] Validation passed, creating Supabase client...')

    // Get Supabase client - Try multiple methods
    let supabase
    try {
      // Method 1: Try serverSupabaseClient
      supabase = await serverSupabaseClient(event)
    } catch (err) {
      console.warn('[Auth/Signup] serverSupabaseClient failed, trying direct client...')
      // Method 2: Try direct client creation
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured')
      }
      
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }

    if (!supabase) {
      console.error('[Auth/Signup] Supabase client creation failed')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    console.log('[Auth/Signup] Supabase client ready, checking username availability...')

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      console.log('[Auth/Signup] Username already taken:', username)
      throw createError({
        statusCode: 400,
        statusMessage: 'Username already taken'
      })
    }

    console.log('[Auth/Signup] Username available, creating user account...')

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || '',
          display_name: fullName || username
        },
        emailRedirectTo: `${process.env.NUXT_PUBLIC_SITE_URL}/auth/verify-email`
      }
    })

    if (authError) {
      console.error('[Auth/Signup] Supabase auth error:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      })
      
      // Handle specific Supabase errors
      if (authError.message.includes('already registered')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email already registered'
        })
      }
      
      if (authError.message.includes('password')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Password does not meet requirements'
        })
      }
      
      throw createError({
        statusCode: ,
        statusMessage: authError.message || 'Signup failed'
      })
    }

    if (!authData.user) {
      console.error('[Auth/Signup] No user data returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed - no user data'
      })
    }

    console.log('[Auth/Signup] User created successfully:', authData.user.id)

    // Create profile in profiles table
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          email,
          full_name: fullName || '',
          display_name: fullName || username,
          bio: '',
          avatar_url: '',
          email_verified: false,
          profile_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.warn('[Auth/Signup] Profile creation warning:', profileError.message)
        // Don't fail the signup if profile creation fails - it might be handled by triggers
      } else {
        console.log('[Auth/Signup] Profile created successfully')
      }
    } catch (profileErr: any) {
      console.warn('[Auth/Signup] Profile creation exception:', profileErr.message)
      // Continue anyway - profile might be created by database triggers
    }

    console.log('[Auth/Signup] ✅ Signup completed successfully')

    // Return success response
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        full_name: fullName || ''
      },
      token: authData.session?.access_token ||,
      refreshToken: authData.session?.refresh_token || null,
      needsConfirmation: !authData.session,
      message: authData.session 
        ? 'Account created successfully!' 
        : 'Account created! Please check your email to verify your account.'
    }

  } catch (error: any) {
    console.error('[Auth/Signup] Error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    })
    
    // If it's already a createError, throw it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise create a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Signup failed'
    })
  }
})
