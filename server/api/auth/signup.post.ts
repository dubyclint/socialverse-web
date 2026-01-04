// FIXED: /server/api/auth/signup.post.ts
// ============================================================================
// ATOMIC SIGNUP ENDPOINT - WITH BETTER SUPABASE ERROR HANDLING
// ============================================================================
// FIX: Better error logging for Supabase Auth issues
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
    console.log('[API] ============ SIGNUP REQUEST START ============')
    
    const body = await readBody(event)
    const { email, password, username, fullName } = body

    console.log('[API] Signup attempt:', { email, username })

    // ============================================================================
    // PHASE 1: VALIDATION
    // ============================================================================
    console.log('[API] PHASE 1: Validating all constraints...')
    
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
      console.error('[API] ❌ Validation failed:', validationErrors)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: {
          errors: validationErrors
        }
      })
    }

    console.log('[API] ✅ All input validations passed')

    // ============================================================================
    // PHASE 2: GET RUNTIME CONFIG
    // ============================================================================
    console.log('[API] PHASE 2: Getting Supabase configuration...')
    
    const config = useRuntimeConfig()
    const supabaseUrl = config.supabaseUrl
    const supabaseServiceKey = config.supabaseServiceKey

    console.log('[API] Supabase URL:', supabaseUrl)
    console.log('[API] Service key available:', !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] ❌ Missing Supabase configuration')
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
    console.log('[API] ✅ Supabase admin client created')

    // ============================================================================
    // PHASE 3: CHECK CONSTRAINTS
    // ============================================================================
    console.log('[API] PHASE 3: Checking database constraints...')
    
    const constraintErrors: SignupError[] = []

    console.log('[API] Checking email uniqueness in auth.users...')
    const { data: authUsers, error: authCheckError } = await supabase.auth.admin.listUsers()
    
    if (authCheckError) {
      console.error('[API] ❌ Error checking auth users:', authCheckError)
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

    console.log('[API] Checking username uniqueness in user table...')
    const { data: existingUser, error: usernameCheckError } = await supabase
      .from('user')
      .select('user_id, username')
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
      console.error('[API] ⚠️ Error checking username:', usernameCheckError)
      constraintErrors.push({
        step: 'CONSTRAINT_CHECK',
        code: 'USERNAME_CHECK_FAILED',
        message: 'Could not verify if username is available',
        details: usernameCheckError.message
      })
    }

    if (constraintErrors.length > 0) {
      console.error('[API] ❌ Constraint check failed:', constraintErrors)
      throw createError({
        statusCode: 400,
        statusMessage: 'Signup validation failed',
        data: {
          errors: constraintErrors
        }
      })
    }

    console.log('[API] ✅ All constraints passed')

    // ============================================================================
    // PHASE 4: CREATE AUTH USER
    // ============================================================================
    console.log('[API] PHASE 4: Creating auth user...')
    console.log('[API] Email:', email.trim().toLowerCase())
    console.log('[API] Username:', username.trim().toLowerCase())
    
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
      console.error('[API] ❌ Auth user creation failed:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        fullError: JSON.stringify(authError)
      })
      
      // ⭐ Better error message for common Supabase errors
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
      console.error('[API] ❌ Auth user created but no ID returned')
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
    console.log('[API] ✅ Auth user created:', authUserId)

    // ============================================================================
    // PHASE 5: CREATE USER PROFILE
    // ============================================================================
    console.log('[API] PHASE 5: Creating user profile...')
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authUserId,
        user_id: authUserId,
        username: username.trim().toLowerCase(),
        full_name: fullName?.trim() || username.trim(),
        avatar_url: null,
        bio: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (profileError) {
      console.error('[API] ❌ Profile creation failed:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details
      })

      console.log('[API] 🔄 Rolling back: Deleting auth user due to profile creation failure...')
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId)
      
      if (deleteError) {
        console.error('[API] ❌ CRITICAL: Failed to rollback auth user:', deleteError)
      } else {
        console.log('[API] ✅ Auth user rolled back successfully')
      }

      authUserId = null

      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user profile',
        data: {
          errors: [{
            step: 'PROFILE_CREATION',
            code: profileError.code || 'PROFILE_ERROR',
            message: profileError.message || 'Failed to create user profile',
            details: {
              code: profileError.code,
              hint: profileError.hint,
              details: profileError.details
            }
          }]
        }
      })
    }

    if (!profileData?.id) {
      console.error('[API] ❌ Profile created but no data returned')
      
      console.log('[API] 🔄 Rolling back: Deleting auth user due to missing profile data...')
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId)
      
      if (deleteError) {
        console.error('[API] ❌ CRITICAL: Failed to rollback auth user:', deleteError)
      } else {
        console.log('[API] ✅ Auth user rolled back successfully')
      }

      authUserId = null

      throw createError({
        statusCode: 500,
        statusMessage: 'Profile creation failed - no profile data returned',
        data: {
          errors: [{
            step: 'PROFILE_CREATION',
            code: 'NO_PROFILE_DATA',
            message: 'User profile was created but no profile data was returned'
          }]
        }
      })
    }

    console.log('[API] ✅ User profile created successfully')
    console.log('[API] Profile data:', {
      id: profileData.id,
      username: profileData.username,
      full_name: profileData.full_name
    })

    // ============================================================================
    // PHASE 6: SEND VERIFICATION EMAIL
    // ============================================================================
    console.log('[API] PHASE 6: Sending verification email...')
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    })

    if (resendError) {
      console.warn('[API] ⚠️ Email send failed (non-critical):', resendError.message)
    } else {
      console.log('[API] ✅ Verification email sent')
    }

    // ============================================================================
    // PHASE 7: SUCCESS
    // ============================================================================
    console.log('[API] ✅ Signup completed successfully')
    console.log('[API] ============ SIGNUP REQUEST END ============')

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
    console.error('[API] ============ SIGNUP ERROR ============')
    console.error('[API] Error type:', error.constructor.name)
    console.error('[API] Error message:', error.message)
    console.error('[API] Error status:', error.statusCode)
    console.error('[API] Error data:', error.data)

    if (authUserId) {
      console.log('[API] 🔄 Final safety rollback: Attempting to delete orphaned auth user...')
      try {
        const config = useRuntimeConfig()
        const supabaseUrl = config.supabaseUrl
        const supabaseServiceKey = config.supabaseServiceKey
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId)
          
          if (deleteError) {
            console.error('[API] ❌ CRITICAL: Failed to delete orphaned auth user:', deleteError)
          } else {
            console.log('[API] ✅ Orphaned auth user deleted')
          }
        }
      } catch (rollbackError) {
        console.error('[API] ❌ CRITICAL: Rollback exception:', rollbackError)
      }
    }

    console.error('[API] ============ END ERROR ============')
    
    throw error
  }
})
