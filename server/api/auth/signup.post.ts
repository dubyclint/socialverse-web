// FILE: /server/api/auth/signup.post.ts - FINAL FIXED VERSION
// ============================================================================
// SIGNUP ENDPOINT with detailed error messages for debugging
// ============================================================================

export default defineEventHandler(async (event) => {
  console.log('[Auth/Signup] 📝 POST request received')
  
  try {
    const body = await readBody(event)
    console.log('[Auth/Signup] Request:', { 
      email: body.email, 
      username: body.username,
      hasPassword: !!body.password,
      hasFullName: !!body.fullName
    })

    const { email, password, username, fullName } = body

    // ============================================================================
    // VALIDATION
    // ============================================================================
    
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

    // Password validation
    if (password.length < 6) {
      const errorMsg = 'Password must be at least 6 characters'
      console.error('[Auth/Signup] ❌', errorMsg)
      throw createError({
        statusCode: 400,
        statusMessage: errorMsg,
        data: { details: errorMsg }
      })
    }

    console.log('[Auth/Signup] ✅ Validation passed')

    // ============================================================================
    // SUPABASE CLIENT INITIALIZATION
    // ============================================================================
    
    console.log('[Auth/Signup] 🔌 Initializing Supabase client...')
    
    let supabase
    try {
      supabase = await serverSupabaseClient(event)
      console.log('[Auth/Signup] ✅ serverSupabaseClient initialized')
    } catch (err: any) {
      console.error('[Auth/Signup] ⚠️ serverSupabaseClient failed:', err.message)
      
      // Fallback: Create client directly
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY
        
        console.log('[Auth/Signup] 🔧 Attempting direct client creation...')
        console.log('[Auth/Signup] URL:', supabaseUrl)
        console.log('[Auth/Signup] Has Key:', !!supabaseKey)
        
        if (!supabaseUrl || !supabaseKey) {
          const errorMsg = 'Supabase configuration missing'
          console.error('[Auth/Signup] ❌', errorMsg)
          throw createError({
            statusCode: 500,
            statusMessage: errorMsg,
            data: { details: 'SUPABASE_URL or SUPABASE_KEY not configured' }
          })
        }
        
        supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }
        })
        console.log('[Auth/Signup] ✅ Direct client created')
      } catch (createErr: any) {
        const errorMsg = 'Failed to create Supabase client'
        console.error('[Auth/Signup] ❌', errorMsg, createErr.message)
        throw createError({
          statusCode: 500,
          statusMessage: errorMsg,
          data: { details: createErr.message }
        })
      }
    }

    if (!supabase) {
      const errorMsg = 'Supabase client is'
      console.error('[Auth/Signup] ❌', errorMsg)
      throw createError({
        statusCode: 500,
        statusMessage: errorMsg,
        data: { details: 'Failed to initialize database connection' }
      })
    }

    // ============================================================================
    // CHECK USERNAME AVAILABILITY
    // ============================================================================
    
    console.log('[Auth/Signup] 🔍 Checking username availability...')
    
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle()

      if (checkError) {
        console.warn('[Auth/Signup] ⚠️ Username check error:', checkError.message)
        // Continue anyway - table might not exist yet
      }

      if (existingProfile) {
        const errorMsg = 'Username already taken'
        console.log('[Auth/Signup] ❌', errorMsg, username)
        throw createError({
          statusCode: 400,
          statusMessage: errorMsg,
          data: { details: `Username "${username}" is already in use` }
        })
      }

      console.log('[Auth/Signup] ✅ Username available')
    } catch (err: any) {
      if (err.statusCode === 400) {
        throw err
      }
      console.warn('[Auth/Signup] ⚠️ Username check failed, continuing...', err.message)
    }

    // ============================================================================
    // CREATE USER ACCOUNT
    // ============================================================================
    
    console.log('[Auth/Signup] 👤 Creating user account...')
    console.log('[Auth/Signup] Email:', email)
    console.log('[Auth/Signup] Username:', username)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || '',
          display_name: fullName || username
        },
        emailRedirectTo: `${process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse-web.zeabur.app'}/auth/verify-email`
      }
    })

    // Handle Supabase auth errors with detailed logging
    if (authError) {
      console.error('[Auth/Signup] ❌ Supabase auth error:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        name: authError.name
      })
      
      // Specific error handling with detailed messages
      if (authError.message.toLowerCase().includes('already registered') || 
          authError.message.toLowerCase().includes('already been registered')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email already registered',
          data: { details: 'This email is already registered. Please sign in instead.' }
        })
      }
      
      if (authError.message.toLowerCase().includes('password')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Password validation failed',
          data: { details: authError.message }
        })
      }

      if (authError.message.toLowerCase().includes('email')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email validation failed',
          data: { details: authError.message }
        })
      }

      if (authError.message.toLowerCase().includes('user already registered')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'User already exists',
          data: { details: 'This email is already registered' }
        })
      }
      
      // Generic Supabase error
      throw createError({
        statusCode: ,
        statusMessage: authError.message || 'Signup failed',
        data: { 
          details: authError.message,
          code: authError.code,
          status: authError.status
        }
      })
    }

    if (!authData?.user) {
      const errorMsg = 'No user data returned from Supabase'
      console.error('[Auth/Signup] ❌', errorMsg)
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed',
        data: { details: errorMsg }
      })
    }

    console.log('[Auth/Signup] ✅ User account created:', authData.user.id)

    // ============================================================================
    // CREATE USER PROFILE
    // ============================================================================
    
    console.log('[Auth/Signup] 📋 Creating user profile...')

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
        console.warn('[Auth/Signup] ⚠️ Profile creation warning:', profileError.message)
      } else {
        console.log('[Auth/Signup] ✅ Profile created')
      }
    } catch (profileErr: any) {
      console.warn('[Auth/Signup] ⚠️ Profile creation exception:', profileErr.message)
    }

    // ============================================================================
    // RETURN SUCCESS RESPONSE
    // ============================================================================
    
    const needsConfirmation = !authData.session
    const successMessage = needsConfirmation
      ? 'Account created! Please check your email to verify your account.'
      : 'Account created successfully!'

    console.log('[Auth/Signup] ✅ Signup completed:', {
      userId: authData.user.id,
      needsConfirmation,
      hasSession: !!authData.session
    })

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
      needsConfirmation,
      message: successMessage
    }

  } catch (error: any) {
    console.error('[Auth/Signup] ❌ Final Error:', {
      message: error.message,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data
    })
    
    // Re-throw if it's already a formatted error
    if (error.statusCode) {
      throw error
    }
    
    // Create generic error for unexpected issues
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'An unexpected error occurred during signup',
      data: { details: error.message, stack: error.stack }
    })
  }
})
