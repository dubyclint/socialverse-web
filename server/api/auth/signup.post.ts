// ============================================================================
// FILE: /server/api/auth/signup.post.ts - COMPLETE FIXED VERSION
// ============================================================================
// Key fix: email_confirm: true (auto-confirm email)
// ============================================================================

import { createClient } from '@supabase/supabase-js'

interface SignupError {
  step: string
  code: string
  message: string
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
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
      console.error('[Signup API] ❌ Client Creation Error:', error.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create Supabase client',
        data: { errors: [{ step: 'CLIENT_CREATION', code: 'INIT_FAILED', message: error.message }] }
      })
    }

    // ============================================================================
    // PHASE 3: CHECK USERNAME UNIQUENESS
    // ============================================================================
    console.log('[Signup API] PHASE 3: Checking username uniqueness...')
    
    try {
      const { data: existingUser, error: queryError } = await supabase
        .from('user')
        .select('id, username')
        .ilike('username', username.trim().toLowerCase())
        .single()

      if (queryError && queryError.code !== 'PGRST116') {
        console.error('[Signup API] ❌ Username Query Error:', queryError.message)
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
      console.error('[Signup API] ❌ Username Check Exception:', error.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Username verification failed',
        data: { errors: [{ step: 'USERNAME_CHECK', code: 'EXCEPTION', message: error.message }] }
      })
    }

    // ============================================================================
    // PHASE 4: CREATE AUTH USER
    // ============================================================================
    console.log('[Signup API] PHASE 4: Creating auth user...')
    
    try {
      const { data, error: authCreateError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: true,  // ✅ KEY FIX: Auto-confirm email
        user_metadata: {
          username: username.trim().toLowerCase(),
          display_name: fullName?.trim() || username.trim()
        }
      })

      if (authCreateError) {
        console.error('[Signup API] ❌ Auth Create Error:', authCreateError.message, { email, username })
        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to create user',
          data: { errors: [{ step: 'AUTH_CREATE', code: authCreateError.code || 'CREATE_FAILED', message: authCreateError.message }] }
        })
      }

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
      console.error('[Signup API] ❌ Auth Create Exception:', error.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user',
        data: { errors: [{ step: 'AUTH_CREATE', code: 'EXCEPTION', message: error.message }] }
      })
    }

    // ============================================================================
    // PHASE 5: CREATE USER RECORD (ONLY ESSENTIAL FIELDS)
    // ============================================================================
    console.log('[Signup API] PHASE 5: Creating user record...')
    
    try {
      const { data: userData, error: insertError } = await supabase
        .from('user')
        .insert([{
          user_id: authUserId,
          username: username.trim().toLowerCase(),
          display_name: fullName?.trim() || username.trim(),
          email: email.trim().toLowerCase(),
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        console.error('[Signup API] ❌ Insert Error:', insertError.message, { authUserId })
        
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
      console.error('[Signup API] ❌ Insert Exception:', error.message)
      
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
    // PHASE 6: SUCCESS
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
      requiresEmailVerification: false
    }

  } catch (error: any) {
    console.error('[Signup API] ============ SIGNUP ERROR ============')
    console.error('[Signup API] Error:', error?.message || error)
    console.error('[Signup API] ============ END SIGNUP ERROR ============')
    throw error
  }
})
