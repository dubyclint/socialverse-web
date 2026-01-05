// ============================================================================
// FILE: /server/api/auth/signup.post.ts - WITH DETAILED ERROR LOGGING
// ============================================================================
// ✅ IMPROVED: Better error logging and atomic transaction handling
// ============================================================================

import { createClient } from '@supabase/supabase-js'

interface SignupError {
  step: string
  code: string
  message: string
  details?: any
}

// Helper function to log errors with full context
function logError(phase: string, error: any, context?: any) {
  console.error(`[Signup API] ❌ ${phase}`)
  console.error(`[Signup API] Error Type: ${error?.constructor?.name}`)
  console.error(`[Signup API] Error Message: ${error?.message}`)
  console.error(`[Signup API] Error Code: ${error?.code}`)
  console.error(`[Signup API] Error Status: ${error?.status}`)
  console.error(`[Signup API] Error Details:`, error?.details || error?.hint || 'N/A')
  if (context) {
    console.error(`[Signup API] Context:`, context)
  }
  console.error(`[Signup API] Stack:`, error?.stack)
}

export default defineEventHandler(async (event) => {
  let authUserId: string | null = null
  let supabase: any = null
  
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

    if (validationErrors.length > 0) {
      console.error('[Signup API] ❌ Validation failed:', validationErrors)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validationErrors }
      })
    }

    console.log('[Signup API] ✅ All input validations passed')

    // ============================================================================
    // PHASE 2: GET SUPABASE CREDENTIALS
    // ============================================================================
    console.log('[Signup API] PHASE 2: Getting Supabase credentials...')
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3ODMyNiwiZXhwIjoyMDc0OTU0MzI2fQ.4gjaVgOV9j_1PsVmylhwbqXnTm3zch6LmS4sFFGeGMg'

    console.log('[Signup API] Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('[Signup API] Service key available:', supabaseServiceKey ? '✅ Set' : '❌ Missing')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error',
        data: { errors: [{'step': 'SUPABASE_CONFIG', 'code': 'MISSING_CREDENTIALS', 'message': 'Supabase credentials not configured'}] }
      })
    }

    // ============================================================================
    // PHASE 3: CREATE SUPABASE CLIENT
    // ============================================================================
    console.log('[Signup API] PHASE 3: Creating Supabase client...')

    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log('[Signup API] ✅ Supabase client created successfully')
    } catch (clientError: any) {
      logError('PHASE 3: Supabase Client Creation', clientError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to initialize Supabase client',
        data: { errors: [{'step': 'SUPABASE_CLIENT_CREATION', 'code': 'CLIENT_INIT_FAILED', 'message': clientError.message}] }
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
      logError('PHASE 4: Email Uniqueness Check', authCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify email uniqueness',
        data: { errors: [{'step': 'EMAIL_UNIQUENESS_CHECK', 'code': 'AUTH_CHECK_FAILED', 'message': authCheckError.message}] }
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
        logError('PHASE 4: Username Uniqueness Check', error)
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
        data: { errors: constraintErrors }
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
          display_name: fullName?.trim() || username.trim(),
          avatar_url: null
        }
      })
      
      authData = result.data
      authError = result.error
    } catch (error: any) {
      logError('PHASE 5: Auth User Creation Exception', error)
      authError = error
    }

    if (authError) {
      logError('PHASE 5: Auth User Creation Error', authError, { email, username })
      
      let userMessage = authError.message || 'Failed to create authentication user'
      
      if (authError.message?.includes('already exists')) {
        userMessage = 'This email is already registered'
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user account',
        data: { errors: [{'step': 'AUTH_USER_CREATION', 'code': authError.code || 'AUTH_ERROR', 'message': userMessage}] }
      })
    }

    if (!authData?.user?.id) {
      console.error('[Signup API] ❌ Auth user created but no ID returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed - no user ID returned',
        data: { errors: [{'step': 'AUTH_USER_CREATION', 'code': 'NO_USER_ID', 'message': 'Authentication user was created but no user ID was returned'}] }
      })
    }

    authUserId = authData.user.id
    console.log('[Signup API] ✅ Auth user created:', authUserId)

    // ============================================================================
    // PHASE 6: CREATE USER RECORD - ATOMIC TRANSACTION
    // ============================================================================
    console.log('[Signup API] PHASE 6: Creating user record...')
    
    let userData
    let userError
    try {
      const result = await supabase
        .from('user')
        .insert([{
          user_id: authUserId,
          username: username.trim().toLowerCase(),
          display_name: fullName?.trim() || username.trim(),
          email: email.trim().toLowerCase(),
          email_lower: email.trim().toLowerCase(),
          username_lower: username.trim().toLowerCase(),
          status: 'active',
          is_verified: false,
          verification_status: 'unverified',
          profile_completed: false,
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      userData = result.data
      userError = result.error
    } catch (error: any) {
      logError('PHASE 6: User Record Creation Exception', error, { authUserId, username })
      userError = error
    }

    if (userError) {
      logError('PHASE 6: User Record Creation Error', userError, { authUserId, username, email })
      
      // ATOMIC ROLLBACK: Delete auth user
      console.log('[Signup API] 🔄 ATOMIC ROLLBACK: Deleting auth user...')
      try {
        await supabase.auth.admin.deleteUser(authUserId)
        console.log('[Signup API] ✅ Auth user rolled back successfully')
      } catch (deleteError: any) {
        logError('ATOMIC ROLLBACK: Failed to delete auth user', deleteError, { authUserId })
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user record',
        data: { errors: [{'step': 'USER_RECORD_CREATION', 'code': userError.code || 'USER_ERROR', 'message': userError.message}] }
      })
    }

    if (!userData?.id) {
      console.error('[Signup API] ❌ User record created but no data returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'User record creation failed - no data returned',
        data: { errors: [{'step': 'USER_RECORD_CREATION', 'code': 'NO_USER_DATA', 'message': 'User record was created but no data was returned'}] }
      })
    }

    console.log('[Signup API] ✅ User record created successfully')

    // ============================================================================
    // PHASE 7: SEND VERIFICATION EMAIL
    // ============================================================================
    console.log('[Signup API] PHASE 7: Sending verification email...')
    
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
        display_name: fullName?.trim() || username.trim(),
        avatar_url: null
      },
      message: 'Account created successfully! Check your email to verify your account.',
      requiresEmailVerification: true
    }

  } catch (error: any) {
    console.error('[Signup API] ============ SIGNUP ERROR ============')
    logError('SIGNUP ENDPOINT', error)
    console.error('[Signup API] ============ END SIGNUP ERROR ============')
    throw error
  }
})
