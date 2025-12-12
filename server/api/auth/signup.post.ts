// FILE: /server/api/auth/signup.post.ts - FINAL CORRECTED VERSION
// ============================================================================
// SIGNUP ENDPOINT with comprehensive error handling and validation
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
      console.error('[Auth/Signup] ❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // Username validation
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

    // Password validation
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters'
      })
    }

    console.log('[Auth/Signup] ✅ Validation passed')

    // ============================================================================
    // SUPABASE CLIENT INITIALIZATION
    // ============================================================================
    
    let supabase
    try {
      // Try using Nuxt's serverSupabaseClient first
      supabase = await serverSupabaseClient(event)
      console.log('[Auth/Signup] ✅ Using serverSupabaseClient')
    } catch (err) {
      console.warn('[Auth/Signup] ⚠️ serverSupabaseClient failed, creating direct client')
      
      // Fallback: Create client directly
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('[Auth/Signup] ❌ Missing Supabase credentials')
        throw createError({
          statusCode: 500,
          statusMessage: 'Database configuration error'
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
    }

    if (!supabase) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to initialize database connection'
      })
    }

    // ============================================================================
    // CHECK USERNAME AVAILABILITY
    // ============================================================================
    
    console.log('[Auth/Signup] 🔍 Checking username availability...')
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle()

    if (existingProfile) {
      console.log('[Auth/Signup] ❌ Username already taken:', username)
      throw createError({
        statusCode: 400,
        statusMessage: 'Username already taken'
      })
    }

    console.log('[Auth/Signup] ✅ Username available')

    // ============================================================================
    // CREATE USER ACCOUNT
    // ============================================================================
    
    console.log('[Auth/Signup] 👤 Creating user account...')

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

    // Handle Supabase auth errors
    if (authError) {
      console.error('[Auth/Signup] ❌ Supabase auth error:', {
        message: authError.message,
        status: authError.status,
        code: authError.code
      })
      
      // Specific error handling
      if (authError.message.toLowerCase().includes('already registered') || 
          authError.message.toLowerCase().includes('already been registered')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'This email is already registered. Please sign in instead.'
        })
      }
      
      if (authError.message.toLowerCase().includes('password')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Password does not meet security requirements. Use at least 6 characters.'
        })
      }

      if (authError.message.toLowerCase().includes('email')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid email address'
        })
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: authError.message || 'Signup failed'
      })
    }

    if (!authData?.user) {
      console.error('[Auth/Signup] ❌ No user data returned from Supabase')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed - no user data returned'
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
      token: authData.session?.access_token || null,
      refreshToken: authData.session?.refresh_token || null,
      needsConfirmation,
      message: successMessage
    }

  } catch (error: any) {
    console.error('[Auth/Signup] ❌ Error:', {
      message: error.message,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage
    })
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'An unexpected error occurred during signup'
    })
  }
})
