// FILE: /server/api/auth/signup.post.ts - CORRECTED WITH SERVICE ROLE KEY
// ============================================================================
// SIGNUP ENDPOINT - Use service role key for profile creation
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
    // SUPABASE CLIENT INITIALIZATION - ANON KEY FOR AUTH
    // ============================================================================
    
    console.log('[Auth/Signup] 🔌 Initializing Supabase client (anon key)...')
    
    let supabaseAnon
    
    try {
      supabaseAnon = await serverSupabaseClient(event)
      console.log('[Auth/Signup] ✅ Anon client initialized successfully')
    } catch (err: any) {
      console.error('[Auth/Signup] ⚠️ Anon client failed:', err.message)
      
      try {
        const { createClient } = await import('@supabase/supabase-js')
        
        const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY
        
        console.log('[Auth/Signup] 🔧 Creating anon client directly...')
        
        if (!supabaseUrl || !supabaseKey) {
          const errorMsg = 'Supabase configuration missing'
          console.error('[Auth/Signup] ❌', errorMsg)
          throw createError({
            statusCode: 500,
            statusMessage: errorMsg,
            data: { details: 'SUPABASE_URL or SUPABASE_KEY not configured' }
          })
        }
        
        supabaseAnon = createClient(supabaseUrl, supabaseKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }
        })
        console.log('[Auth/Signup] ✅ Anon client created successfully')
      } catch (createErr: any) {
        const errorMsg = 'Failed to create Supabase anon client'
        console.error('[Auth/Signup] ❌', errorMsg, createErr.message)
        throw createError({
          statusCode: 500,
          statusMessage: errorMsg,
          data: { details: createErr.message }
        })
      }
    }

    if (!supabaseAnon) {
      const errorMsg = 'Supabase anon client is not initialized'
      console.error('[Auth/Signup] ❌', errorMsg)
      throw createError({
        statusCode: 500,
        statusMessage: errorMsg,
        data: { details: 'Failed to initialize auth client' }
      })
    }

    // ============================================================================
    // SUPABASE SERVICE ROLE CLIENT - FOR PROFILE CREATION
    // ============================================================================
    
    console.log('[Auth/Signup] 🔌 Initializing Supabase service role client...')
    
    let supabaseServiceRole
    
    try {
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      console.log('[Auth/Signup] URL exists:', !!supabaseUrl)
      console.log('[Auth/Signup] Service key exists:', !!supabaseServiceKey)
      
      if (!supabaseUrl || !supabaseServiceKey) {
        const errorMsg = 'Supabase service role configuration missing'
        console.error('[Auth/Signup] ❌', errorMsg)
        throw createError({
          statusCode: 500,
          statusMessage: errorMsg,
          data: { details: 'SUPABASE_SERVICE_ROLE_KEY not configured' }
        })
      }
      
      supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      })
      console.log('[Auth/Signup] ✅ Service role client created successfully')
    } catch (err: any) {
      const errorMsg = 'Failed to create service role client'
      console.error('[Auth/Signup] ❌', errorMsg, err.message)
      throw createError({
        statusCode: 500,
        statusMessage: errorMsg,
        data: { details: err.message }
      })
    }

    // ============================================================================
    // CHECK USERNAME AVAILABILITY
    // ============================================================================
    
    console.log('[Auth/Signup] 🔍 Checking username availability...')
    
    try {
      const { data: existingUser, error: checkError } = await supabaseAnon
        .from('user')
        .select('username')
        .eq('username', username)
        .maybeSingle()

      if (checkError) {
        console.warn('[Auth/Signup] ⚠️ Username check error:', checkError.message)
      }

      if (existingUser) {
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
    // CREATE USER ACCOUNT (using anon key)
    // ============================================================================
    
    console.log('[Auth/Signup] 👤 Creating user account...')
    console.log('[Auth/Signup] Email:', email)
    console.log('[Auth/Signup] Username:', username)

    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || ''
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
        statusCode: 500,
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
    // CREATE USER PROFILE (using service role key to bypass RLS)
    // ============================================================================
    
    console.log('[Auth/Signup] 📋 Creating user profile with service role...')

    try {
      const { error: profileError } = await supabaseServiceRole
        .from('user')
        .insert({
          user_id: authData.user.id,
          username,
          display_name: fullName || username,
          email,
          bio: '',
          avatar_url: '',
          status: 'active',
          email_lower: email.toLowerCase(),
          username_lower: username.toLowerCase(),
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('[Auth/Signup] ❌ Profile creation error:', profileError.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create user profile',
          data: { details: profileError.message }
        })
      } else {
        console.log('[Auth/Signup] ✅ Profile created successfully')
      }
    } catch (profileErr: any) {
      console.error('[Auth/Signup] ❌ Profile creation exception:', profileErr.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user profile',
        data: { details: profileErr.message }
      })
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
      token: authData.session?.access_token || null,
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
    
    // Create a generic error response
    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred during signup',
      data: { details: error.message }
    })
  }
})
