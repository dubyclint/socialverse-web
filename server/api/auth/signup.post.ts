// ============================================================================
// FILE: /server/api/auth/signup.post.ts - COMPLETE UPDATED VERSION
// ============================================================================
// Progressive signup - Phase 1: Basic info only (email, password, username)
// Profile creation happens automatically
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
    // PHASE 2: GET RUNTIME CONFIG
    // ============================================================================
    console.log('[Signup API] PHASE 2: Getting Supabase configuration...')
    
    const config = useRuntimeConfig()
    const supabaseUrl = config.supabaseUrl
    const supabaseServiceKey = config.supabaseServiceKey

    console.log('[Signup API] Supabase URL:', supabaseUrl)
    console.log('[Signup API] Service key available:', !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Signup API] ❌ Missing Supabase configuration')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error - Supabase credentials not configured',
        data: {
          errors: [{
            step: 'SUPABASE_CONFIG',
            code: 'MISSING_CREDENTIALS',
            message: 'Supabase URL or Service Role Key is not configured'
          }]
        }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[Signup API] ✅ Supabase admin client created')

    // ============================================================================
    // PHASE 3: CHECK CONSTRAINTS
    // ============================================================================
    console.log('[Signup API] PHASE 3: Checking database constraints...')
    
    const constraintErrors: SignupError[] = []

    console.log('[Signup API] Checking email uniqueness in auth.users...')
    const { data: authUsers, error: authCheckError } = await supabase.auth.admin.listUsers()
    
    if (authCheckError) {
      console.error('[Signup API] ❌ Error checking auth users:', authCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify email uniqueness',
        data: {
          errors: [{
            step: 'EMAIL_UNIQUENESS_CHECK',
            code: 'AUTH_CHECK_FAILED',
            message: 'Could not verify if email is already registered',
            details: authCheckError.message
          }]
        }
      })
    }

    const emailExists = authUsers?.users?.some(u => u.email?.toLowerCase() === email.trim().toLowerCase())
    if (emailExists) {
      constraintErrors.push({
        step: 'CONSTRAINT_CHECK',
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'This email is already registered. Please use a different email or try logging in.'
      })
    }

    console.log('[Signup API] Checking username uniqueness in user table...')
    const { data: existingUser, error: usernameCheckError } = await supabase
      .from('user')
      .select('id, username')
      .ilike('username', username.trim().toLowerCase())
      .single()

    if (existingUser) {
      constraintErrors.push({
        step: 'CONSTRAINT_CHECK',
        code: 'USERNAME_ALREADY_EXISTS',
        message: `Username "${username}" is already taken. Please choose a different username.`
      })
    }

    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      console.error('[Signup API] ⚠️ Error checking username:', usernameCheckError)
      constraintErrors.push({
        step: 'CONSTRAINT_CHECK',
        code: 'USERNAME_CHECK_FAILED',
        message: 'Could not verify if username is available',
        details: usernameCheckError.message
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
    // PHASE 4: CREATE AUTH USER
    // ============================================================================
    console.log('[Signup API] PHASE 4: Creating auth user...')
    console.log('[Signup API] Email:', email.trim().toLowerCase())
    console.log('[Signup API] Username:', username.trim().toLowerCase())
    
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
      console.error('[Signup API] ❌ Auth user creation failed:', {
        message: authError.message,
        status: authError.status,
        code: authError.code
      })
      
      let userMessage = authError.message || 'Failed to create authentication user'
      
      if (authError.message?.includes('already exists')) {
        userMessage = 'This email is already registered'
      } else if (authError.message?.includes('Database error')) {
        userMessage = 'Database error. Please try again or contact support.'
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user account',
        data: {
          errors: [{
            step: 'AUTH_USER_CREATION',
            code: authError.code || 'AUTH_ERROR',
            message: userMessage,
            details: {
              status: authError.status,
              code: authError.code,
              originalMessage: authError.message
            }
          }]
        }
      })
    }

    if (!authData?.user?.id) {
      console.error('[Signup API] ❌ Auth user created but no ID returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed - no user ID returned',
        data: {
          errors: [{
            step: 'AUTH_USER_CREATION',
            code: 'NO_USER_ID',
            message: 'Authentication user was created but no user ID was returned'
          }]
        }
      })
    }

    authUserId = authData.user.id
    console.log('[Signup API] ✅ Auth user created:', authUserId)

    // ============================================================================
    // PHASE 5: CREATE USER RECORD
    // ============================================================================
    console.log('[Signup API] PHASE 5: Creating user record...')
    
    const { data: userData, error: userError } = await supabase
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

    if (userError) {
      console.error('[Signup API] ❌ User record creation failed:', {
        message: userError.message,
        code: userError.code
      })

      console.log('[Signup API] 🔄 Rolling back: Deleting auth user due to user record creation failure...')
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId)
      
      if (deleteError) {
        console.error('[Signup API] ❌ CRITICAL: Failed to rollback auth user:', deleteError)
      } else {
        console.log('[Signup API] ✅ Auth user rolled back successfully')
      }

      authUserId = null

      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user record',
        data: {
          errors: [{
            step: 'USER_RECORD_CREATION',
            code: userError.code || 'USER_ERROR',
            message: userError.message || 'Failed to create user record',
            details: {
              code: userError.code,
              hint: userError.hint,
              details: userError.details
            }
          }]
        }
      })
    }

    if (!userData?.id) {
      console.error('[Signup API] ❌ User record created but no data returned')
      
      console.log('[Signup API] 🔄 Rolling back: Deleting auth user due to missing user data...')
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId)
      
      if (deleteError) {
        console.error('[Signup API] ❌ CRITICAL: Failed to rollback auth user:', deleteError)
      } else {
        console.log('[Signup API] ✅ Auth user rolled back successfully')
      }

      authUserId = null

      throw createError({
        statusCode: 500,
        statusMessage: 'User record creation failed - no data returned',
        data: {
          errors: [{
            step: 'USER_RECORD_CREATION',
            code: 'NO_USER_DATA',
            message: 'User record was created but no data was returned'
          }]
        }
      })
    }

    console.log('[Signup API] ✅ User record created successfully')

    // ============================================================================
    // PHASE 6: CREATE PROFILE RECORD
    // ============================================================================
    console.log('[Signup API] PHASE 6: Creating profile record...')
    
    const { data: profileData, error: profileError } = await supabase
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

    if (profileError) {
      console.error('[Signup API] ❌ Profile creation failed:', {
        message: profileError.message,
        code: profileError.code
      })

      console.log('[Signup API] 🔄 Rolling back: Deleting auth user and user record due to profile creation failure...')
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId)
      const { error: userDeleteError } = await supabase.from('user').delete().eq('id', authUserId)
      
      if (deleteError) {
        console.error('[Signup API] ❌ CRITICAL: Failed to rollback auth user:', deleteError)
      } else {
        console.log('[Signup API] ✅ Auth user rolled back successfully')
      }

      if (userDeleteError) {
        console.error('[Signup API] ❌ CRITICAL: Failed to rollback user record:', userDeleteError)
      } else {
        console.log('[Signup API] ✅ User record rolled back successfully')
      }

      authUserId = null

      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create profile',
        data: {
          errors: [{
            step: 'PROFILE_CREATION',
            code: profileError.code || 'PROFILE_ERROR',
            message: profileError.message || 'Failed to create profile',
            details: {
              code: profileError.code,
              hint: profileError.hint,
              details: profileError.details
            }
          }]
        }
      })
    }

    if (!profileData?.user_id) {
      console.error('[Signup API] ❌ Profile created but no data returned')
      
      console.log('[Signup API] 🔄 Rolling back: Deleting auth user and user record due to missing profile data...')
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId)
      const { error: userDeleteError } = await supabase.from('user').delete().eq('id', authUserId)
      
      if (deleteError) {
        console.error('[Signup API] ❌ CRITICAL: Failed to rollback auth user:', deleteError)
      } else {
        console.log('[Signup API] ✅ Auth user rolled back successfully')
      }

      if (userDeleteError) {
        console.error('[Signup API] ❌ CRITICAL: Failed to rollback user record:', userDeleteError)
      } else {
        console.log('[Signup API] ✅ User record rolled back successfully')
      }

      authUserId = null

      throw createError({
        statusCode: 500,
        statusMessage: 'Profile creation failed - no data returned',
        data: {
          errors: [{
            step: 'PROFILE_CREATION',
            code: 'NO_PROFILE_DATA',
            message: 'Profile was created but no data was returned'
          }]
        }
      })
    }

    console.log('[Signup API] ✅ Profile created successfully')

    // ============================================================================
    // PHASE 7: SEND VERIFICATION EMAIL
    // ============================================================================
    console.log('[Signup API] PHASE 7: Sending verification email...')
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    })

    if (resendError) {
      console.warn('[Signup API] ⚠️ Email send failed (non-critical):', resendError.message)
    } else {
      console.log('[Signup API] ✅ Verification email sent')
    }

    // ============================================================================
    // PHASE 8: SUCCESS
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
    console.error('[Signup API] Error type:', error.constructor.name)
    console.error('[Signup API] Error message:', error.message)
    console.error('[Signup API] Error status:', error.statusCode)
    console.error('[Signup API] Error data:', error.data)

    if (authUserId) {
      console.log('[Signup API] 🔄 Final safety rollback: Attempting to delete orphaned auth user...')
      try {
        const config = useRuntimeConfig()
        const supabaseUrl = config.supabaseUrl
        const supabaseServiceKey = config.supabaseServiceKey
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId)
          
          if (deleteError) {
            console.error('[Signup API] ❌ CRITICAL: Failed to delete orphaned auth user:', deleteError)
          } else {
            console.log('[Signup API] ✅ Orphaned auth user deleted')
          }
        }
      } catch (rollbackError) {
        console.error('[Signup API] ❌ CRITICAL: Rollback exception:', rollbackError)
      }
    }

    console.error('[Signup API] ============ END ERROR ============')
    
    throw error
  }
})
