// ============================================================================
// FILE: /server/api/auth/signup.post.ts - REVERTED TO process.env
// ============================================================================
// ✅ REVERTED: Using process.env directly (what was working before)
// ============================================================================

import { createClient } from '@supabase/supabase-js'

interface SignupError {
  step: string
  code: string
  message: string
  details?: any
}

export default defineEventHandler(async (event) => {
  let authUserId: string | null = null
  
  try {
    console.log('[Signup API] ============ SIGNUP REQUEST START ============')
    
    const body = await readBody(event)
    const { email, password, username, fullName } = body

    console.log('[Signup API] Signup attempt:', { email, username })

    // ============================================================================
    // PHASE 1: VALIDATION
    // ============================================================================
    console.log('[Signup API] PHASE 1: Validating all constraints...')
    
    const validationErrors: SignupError[] = []

    if (!email || typeof email !== 'string') {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'MISSING_EMAIL',
        message: 'Email is required'
      })
    }

    if (!password || typeof password !== 'string') {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'MISSING_PASSWORD',
        message: 'Password is required'
      })
    }

    if (!username || typeof username !== 'string') {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'MISSING_USERNAME',
        message: 'Username is required'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email.trim())) {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'INVALID_EMAIL_FORMAT',
        message: 'Email format is invalid. Expected: user@example.com'
      })
    }

    if (password && password.length < 6) {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'PASSWORD_TOO_SHORT',
        message: 'Password must be at least 6 characters long'
      })
    }

    if (password && password.length > 128) {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'PASSWORD_TOO_LONG',
        message: 'Password must be less than 128 characters'
      })
    }

    if (username && username.length < 3) {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'USERNAME_TOO_SHORT',
        message: 'Username must be at least 3 characters long'
      })
    }

    if (username && username.length > 30) {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'USERNAME_TOO_LONG',
        message: 'Username must be less than 30 characters'
      })
    }

    const usernameRegex = /^[a-z0-9_-]+$/
    if (username && !usernameRegex.test(username.toLowerCase())) {
      validationErrors.push({
        step: 'INPUT_VALIDATION',
        code: 'INVALID_USERNAME_FORMAT',
        message: 'Username can only contain lowercase letters, numbers, underscore (_), and hyphen (-)'
      })
    }

    if (validationErrors.length > 0) {
      console.error('[Signup API] ❌ Validation failed:', validationErrors)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: {
          errors: validationErrors
        }
      })
    }

    console.log('[Signup API] ✅ All input validations passed')

    // ============================================================================
    // PHASE 2: GET SUPABASE CREDENTIALS FROM process.env
    // ============================================================================
    console.log('[Signup API] PHASE 2: Getting Supabase credentials from process.env...')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[Signup API] Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('[Signup API] Service key available:', supabaseServiceKey ? '✅ Set' : '❌ Missing')

    if (!supabaseUrl) {
      console.error('[Signup API] ❌ SUPABASE_URL is not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error - SUPABASE_URL not configured',
        data: {
          errors: [{'step': 'SUPABASE_CONFIG', 'code': 'MISSING_URL', 'message': 'SUPABASE_URL environment variable is not configured'}]
        }
      })
    }

    if (!supabaseServiceKey) {
      console.error('[Signup API] ❌ SUPABASE_SERVICE_ROLE_KEY is not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error - SUPABASE_SERVICE_ROLE_KEY not configured',
        data: {
          errors: [{'step': 'SUPABASE_CONFIG', 'code': 'MISSING_SERVICE_KEY', 'message': 'SUPABASE_SERVICE_ROLE_KEY environment variable is not configured'}]
        }
      })
    }

    if (!supabaseUrl.includes('supabase.co')) {
      console.error('[Signup API] ❌ SUPABASE_URL format is invalid:', supabaseUrl)
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error - Invalid SUPABASE_URL format',
        data: {
          errors: [{'step': 'SUPABASE_CONFIG', 'code': 'INVALID_URL_FORMAT', 'message': 'SUPABASE_URL must be a valid Supabase URL'}]
        }
      })
    }

    if (supabaseServiceKey.length < 100) {
      console.error('[Signup API] ❌ SUPABASE_SERVICE_ROLE_KEY format is invalid (too short)')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error - Invalid SUPABASE_SERVICE_ROLE_KEY format',
        data: {
          errors: [{'step': 'SUPABASE_CONFIG', 'code': 'INVALID_KEY_FORMAT', 'message': 'SUPABASE_SERVICE_ROLE_KEY appears to be invalid'}]
        }
      })
    }

    console.log('[Signup API] ✅ Supabase credentials validated')

    // ============================================================================
    // PHASE 3: CREATE SUPABASE CLIENT
    // ============================================================================
    console.log('[Signup API] PHASE 3: Creating Supabase client...')

    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log('[Signup API] ✅ Supabase client created successfully')
    } catch (clientError: any) {
      console.error('[Signup API] ❌ Failed to create Supabase client:', clientError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to initialize Supabase client',
        data: {
          errors: [{'step': 'SUPABASE_CLIENT_CREATION', 'code': 'CLIENT_INIT_FAILED', 'message': clientError.message}]
        }
      })
    }

    // ============================================================================
    // PHASE 4: CHECK CONSTRAINTS
    // ============================================================================
    console.log('[Signup API] PHASE 4: Checking database constraints...')
    
    const constraintErrors: SignupError[] = []

    console.log('[Signup API] Checking email uniqueness in auth.users...')
    let authUsers
    try {
      const result = await supabase.auth.admin.listUsers()
      authUsers = result.data
      console.log('[Signup API] ✅ Successfully fetched auth users')
    } catch (authCheckError: any) {
      console.error('[Signup API] ❌ Error checking auth users:', authCheckError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify email uniqueness',
        data: {
          errors: [{'step': 'EMAIL_UNIQUENESS_CHECK', 'code': 'AUTH_CHECK_FAILED', 'message': 'Could not verify if email is already registered'}]
        }
      })
    }

    const emailExists = authUsers?.users?.some(u => u.email?.toLowerCase() === email.trim().toLowerCase())
    if (emailExists) {
      console.warn('[Signup API] ⚠️ Email already exists:', email)
      constraintErrors.push({
        step: 'CONSTRAINT_CHECK',
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'This email is already registered. Please use a different email or try logging in.'
      })
    }

    console.log('[Signup API] Checking username uniqueness in user table...')
    let existingUser
    try {
      const result = await supabase
        .from('user')
        .select('id, username')
        .ilike('username', username.trim().toLowerCase())
        .single()
      
      existingUser = result.data
      
      if (existingUser) {
        console.warn('[Signup API] ⚠️ Username already exists:', username)
      } else {
        console.log('[Signup API] ✅ Username is available')
      }
    } catch (error: any) {
      if (error.code !== 'PGRST116') {
        console.error('[Signup API] ⚠️ Error checking username:', error.message)
      }
    }

    if (existingUser) {
      constraintErrors.push({
        step: 'CONSTRAINT_CHECK',
        code: 'USERNAME_ALREADY_EXISTS',
        message: `Username "${username}" is already taken. Please choose a different username.`
      })
    }

    if (constraintErrors.length > 0) {
      console.error('[Signup API] ❌ Constraint check failed:', constraintErrors)
      throw createError({
        statusCode: 400,
        statusMessage: 'Signup validation failed',
        data: {
          errors: constraintErrors
        }
      })
    }

    console.log('[Signup API] ✅ All constraints passed')

    // ============================================================================
    // PHASE 5: CREATE AUTH USER
    // ============================================================================
    console.log('[Signup API] PHASE 5: Creating auth user...')
    
    let authData
    let authError
    try {
      const result = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: false,
        user_metadata: {
          username: username.trim().toLowerCase(),
          full_name: fullName?.trim() || username.trim(),
          avatar_url: null
        }
      })
      
      authData = result.data
      authError = result.error
    } catch (error: any) {
      console.error('[Signup API] ❌ Exception during auth user creation:', error.message)
      authError = error
    }

    if (authError) {
      console.error('[Signup API] ❌ Auth user creation failed:', authError.message)
      
      let userMessage = authError.message || 'Failed to create authentication user'
      
      if (authError.message?.includes('already exists')) {
        userMessage = 'This email is already registered'
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user account',
        data: {
          errors: [{'step': 'AUTH_USER_CREATION', 'code': authError.code || 'AUTH_ERROR', 'message': userMessage}]
        }
      })
    }

    if (!authData?.user?.id) {
      console.error('[Signup API] ❌ Auth user created but no ID returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed - no user ID returned',
        data: {
          errors: [{'step': 'AUTH_USER_CREATION', 'code': 'NO_USER_ID', 'message': 'Authentication user was created but no user ID was returned'}]
        }
      })
    }

    authUserId = authData.user.id
    console.log('[Signup API] ✅ Auth user created:', authUserId)

    // ============================================================================
    // PHASE 6: CREATE USER RECORD
    // ============================================================================
    console.log('[Signup API] PHASE 6: Creating user record...')
    
    let userData
    let userError
    try {
      const result = await supabase
        .from('user')
        .insert([{
          id: authUserId,
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      userData = result.data
      userError = result.error
    } catch (error: any) {
      console.error('[Signup API] ❌ Exception during user record creation:', error.message)
      userError = error
    }

    if (userError) {
      console.error('[Signup API] ❌ User record creation failed:', userError.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user record',
        data: {
          errors: [{'step': 'USER_RECORD_CREATION', 'code': userError.code || 'USER_ERROR', 'message': userError.message}]
        }
      })
    }

    if (!userData?.id) {
      console.error('[Signup API] ❌ User record created but no data returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'User record creation failed - no data returned',
        data: {
          errors: [{'step': 'USER_RECORD_CREATION', 'code': 'NO_USER_DATA', 'message': 'User record was created but no data was returned'}]
        }
      })
    }

    console.log('[Signup API] ✅ User record created successfully')

    // ============================================================================
    // PHASE 7: CREATE PROFILE RECORD
    // ============================================================================
    console.log('[Signup API] PHASE 7: Creating profile record...')
    
    let profileData
    let profileError
    try {
      const result = await supabase
        .from('profiles')
        .insert([{
          user_id: authUserId,
          full_name: fullName?.trim() || username.trim(),
          bio: null,
          avatar_url: null,
          location: null,
          website: null,
          interests: [],
          colors: {},
          items: [],
          profile_completed: false,
          rank: 'Bronze I',
          rank_points: 0,
          rank_level: 1,
          is_verified: false,
          verified_badge_type: null,
          verified_at: null,
          verification_status: 'none',
          badge_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      profileData = result.data
      profileError = result.error
    } catch (error: any) {
      console.error('[Signup API] ❌ Exception during profile creation:', error.message)
      profileError = error
    }

    if (profileError) {
      console.error('[Signup API] ❌ Profile creation failed:', profileError.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create profile',
        data: {
          errors: [{'step': 'PROFILE_CREATION', 'code': profileError.code || 'PROFILE_ERROR', 'message': profileError.message}]
        }
      })
    }

    if (!profileData?.user_id) {
      console.error('[Signup API] ❌ Profile created but no data returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile creation failed - no data returned',
        data: {
          errors: [{'step': 'PROFILE_CREATION', 'code': 'NO_PROFILE_DATA', 'message': 'Profile was created but no data was returned'}]
        }
      })
    }

    console.log('[Signup API] ✅ Profile created successfully')

    // ============================================================================
    // PHASE 8: SEND VERIFICATION EMAIL
    // ============================================================================
    console.log('[Signup API] PHASE 8: Sending verification email...')
    
    try {
      const resendResult = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase()
      })

      if (resendResult.error) {
        console.warn('[Signup API] ⚠️ Email send failed (non-critical):', resendResult.error.message)
      } else {
        console.log('[Signup API] ✅ Verification email sent')
      }
    } catch (emailError: any) {
      console.warn('[Signup API] ⚠️ Exception during email send (non-critical):', emailError.message)
    }

    // ============================================================================
    // PHASE 9: SUCCESS
    // ============================================================================
    console.log('[Signup API] ✅ Signup completed successfully')
    console.log('[Signup API] ============ SIGNUP REQUEST END ============')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        full_name: fullName?.trim() || username.trim(),
        avatar_url: null
      },
      message: 'Account created successfully! Check your email to verify your account.',
      requiresEmailVerification: true
    }

  } catch (error: any) {
    console.error('[Signup API] ============ SIGNUP ERROR ============')
    console.error('[Signup API] Error:', error.message)
    throw error
  }
})
