// ============================================================================
// FILE: /server/api/auth/signup.post.ts - FIXED SYNTAX ERROR
// ============================================================================
// ✅ FIXED: Proper destructuring syntax
// ============================================================================

import { createClient } from '@supabase/supabase-js'

interface SignupError {
  step: string
  code: string
  message: string
  details?: any
}

function logError(phase: string, error: any, context?: any) {
  console.error(`[Signup API] ❌ ${phase}`)
  console.error(`[Signup API] Error Type: ${error?.constructor?.name}`)
  console.error(`[Signup API] Error Message: ${error?.message}`)
  console.error(`[Signup API] Error Code: ${error?.code}`)
  console.error(`[Signup API] Error Status: ${error?.status}`)
  if (context) {
    console.error(`[Signup API] Context:`, context)
  }
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
    console.log('[Signup API] PHASE 1: Validating input...')
    
    const validationErrors: SignupError[] = []

    if (!email || typeof email !== 'string') {
      validationErrors.push({ step: 'INPUT_VALIDATION', code: 'MISSING_EMAIL', message: 'Email is required' })
    }
    if (!password || typeof password !== 'string') {
      validationErrors.push({ step: 'INPUT_VALIDATION', code: 'MISSING_PASSWORD', message: 'Password is required' })
    }
    if (!username || typeof username !== 'string') {
      validationErrors.push({ step: 'INPUT_VALIDATION', code: 'MISSING_USERNAME', message: 'Username is required' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email.trim())) {
      validationErrors.push({ step: 'INPUT_VALIDATION', code: 'INVALID_EMAIL_FORMAT', message: 'Invalid email format' })
    }
    if (password && password.length < 6) {
      validationErrors.push({ step: 'INPUT_VALIDATION', code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 6 characters' })
    }

    if (validationErrors.length > 0) {
      console.error('[Signup API] ❌ Validation failed')
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validationErrors }
      })
    }

    console.log('[Signup API] ✅ Validation passed')

    // ============================================================================
    // PHASE 2: CREATE SUPABASE CLIENT
    // ============================================================================
    console.log('[Signup API] PHASE 2: Creating Supabase client...')
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://cvzrhucbvezqwbesthek.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enJodWNidmV6cXdiZXN0aGVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3ODMyNiwiZXhwIjoyMDc0OTU0MzI2fQ.4gjaVgOV9j_1PsVmylhwbqXnTm3zch6LmS4sFFGeGMg'

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error',
        data: { errors: [{ step: 'CONFIG', code: 'MISSING_CREDENTIALS', message: 'Supabase credentials not configured' }] }
      })
    }

    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      })
      console.log('[Signup API] ✅ Supabase client created')
    } catch (error: any) {
      logError('PHASE 2: Client Creation', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create Supabase client',
        data: { errors: [{ step: 'CLIENT_CREATION', code: 'INIT_FAILED', message: error.message }] }
      })
    }

    // ============================================================================
    // PHASE 3: CHECK EMAIL UNIQUENESS
    // ============================================================================
    console.log('[Signup API] PHASE 3: Checking email uniqueness...')
    
    try {
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        logError('PHASE 3: List Users Error', listError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to verify email',
          data: { errors: [{ step: 'EMAIL_CHECK', code: 'FETCH_FAILED', message: listError.message }] }
        })
      }

      const emailExists = authUsers?.some(u => u.email?.toLowerCase() === email.trim().toLowerCase())
      if (emailExists) {
        console.warn('[Signup API] ⚠️ Email already exists')
        throw createError({
          statusCode: 400,
          statusMessage: 'Email already registered',
          data: { errors: [{ step: 'EMAIL_CHECK', code: 'EMAIL_EXISTS', message: 'This email is already registered' }] }
        })
      }

      console.log('[Signup API] ✅ Email is available')
    } catch (error: any) {
      if (error.statusCode) throw error
      logError('PHASE 3: Email Check Exception', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Email verification failed',
        data: { errors: [{ step: 'EMAIL_CHECK', code: 'EXCEPTION', message: error.message }] }
      })
    }

    // ============================================================================
    // PHASE 4: CHECK USERNAME UNIQUENESS
    // ============================================================================
    console.log('[Signup API] PHASE 4: Checking username uniqueness...')
    
    try {
      const { data: existingUser, error: queryError } = await supabase
        .from('user')
        .select('id, username')
        .ilike('username', username.trim().toLowerCase())
        .single()

      if (queryError && queryError.code !== 'PGRST116') {
        logError('PHASE 4: Username Query Error', queryError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Username verification failed',
          data: { errors: [{ step: 'USERNAME_CHECK', code: 'FETCH_FAILED', message: queryError.message }] }
        })
      }

      if (existingUser) {
        console.warn('[Signup API] ⚠️ Username already exists')
        throw createError({
          statusCode: 400,
          statusMessage: 'Username already taken',
          data: { errors: [{ step: 'USERNAME_CHECK', code: 'USERNAME_EXISTS', message: 'This username is already taken' }] }
        })
      }

      console.log('[Signup API] ✅ Username is available')
    } catch (error: any) {
      if (error.statusCode) throw error
      logError('PHASE 4: Username Check Exception', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Username verification failed',
        data: { errors: [{ step: 'USERNAME_CHECK', code: 'EXCEPTION', message: error.message }] }
      })
    }

    // ============================================================================
    // PHASE 5: CREATE AUTH USER
    // ============================================================================
    console.log('[Signup API] PHASE 5: Creating auth user...')
    
    let authData
    try {
      const { data, error: authCreateError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: false,
        user_metadata: {
          username: username.trim().toLowerCase(),
          display_name: fullName?.trim() || username.trim()
        }
      })

      if (authCreateError) {
        logError('PHASE 5: Create Auth Error', authCreateError, { email, username })
        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to create user',
          data: { errors: [{ step: 'AUTH_CREATE', code: authCreateError.code || 'CREATE_FAILED', message: authCreateError.message }] }
        })
      }

      authData = data
      authUserId = data?.user?.id

      if (!authUserId) {
        throw createError({
          statusCode: 500,
          statusMessage: 'User creation failed',
          data: { errors: [{ step: 'AUTH_CREATE', code: 'NO_USER_ID', message: 'No user ID returned' }] }
        })
      }

      console.log('[Signup API] ✅ Auth user created:', authUserId)
    } catch (error: any) {
      if (error.statusCode) throw error
      logError('PHASE 5: Auth Create Exception', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user',
        data: { errors: [{ step: 'AUTH_CREATE', code: 'EXCEPTION', message: error.message }] }
      })
    }

    // ============================================================================
    // PHASE 6: CREATE USER RECORD
    // ============================================================================
    console.log('[Signup API] PHASE 6: Creating user record...')
    
    try {
      const { data: userData, error: insertError } = await supabase
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

      if (insertError) {
        logError('PHASE 6: Insert Error', insertError, { authUserId })
        
        // ROLLBACK: Delete auth user
        console.log('[Signup API] 🔄 Rolling back auth user...')
        try {
          await supabase.auth.admin.deleteUser(authUserId)
          console.log('[Signup API] ✅ Rollback successful')
        } catch (deleteError: any) {
          console.error('[Signup API] ⚠️ Rollback failed:', deleteError.message)
        }

        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to create user record',
          data: { errors: [{ step: 'USER_RECORD', code: insertError.code || 'INSERT_FAILED', message: insertError.message }] }
        })
      }

      if (!userData?.id) {
        throw createError({
          statusCode: 500,
          statusMessage: 'User record creation failed',
          data: { errors: [{ step: 'USER_RECORD', code: 'NO_DATA', message: 'No data returned' }] }
        })
      }

      console.log('[Signup API] ✅ User record created')
    } catch (error: any) {
      if (error.statusCode) throw error
      logError('PHASE 6: Insert Exception', error)
      
      // ROLLBACK
      try {
        await supabase.auth.admin.deleteUser(authUserId)
      } catch (e) {
        console.error('[Signup API] ⚠️ Rollback failed')
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user record',
        data: { errors: [{ step: 'USER_RECORD', code: 'EXCEPTION', message: error.message }] }
      })
    }

    // ============================================================================
    // PHASE 7: SUCCESS
    // ============================================================================
    console.log('[Signup API] ✅ Signup completed successfully')
    console.log('[Signup API] ============ SIGNUP REQUEST END ============')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        display_name: fullName?.trim() || username.trim()
      },
      message: 'Account created successfully!',
      requiresEmailVerification: true
    }

  } catch (error: any) {
    console.error('[Signup API] ============ SIGNUP ERROR ============')
    console.error('[Signup API] Error:', error?.message || error)
    console.error('[Signup API] ============ END SIGNUP ERROR ============')
    throw error
  }
})
