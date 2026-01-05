// ============================================================================
// FILE: /server/api/auth/signup.post.ts - ALTERNATIVE APPROACH
// ============================================================================
// Use client-side signUp instead of admin.createUser
// This bypasses the admin endpoint which seems to be having issues
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Signup API] ============ SIGNUP REQUEST START ============')
    
    const body = await readBody(event)
    const { email, password, username, fullName } = body

    console.log('[Signup API] Signup attempt:', { email, username })

    // Validation
    if (!email || !password || !username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    // Create TWO clients: one anon for signup, one admin for database
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    console.log('[Signup API] PHASE 1: Checking username uniqueness...')
    
    const { data: existingUser } = await supabaseAdmin
      .from('user')
      .select('id')
      .ilike('username', username.trim().toLowerCase())
      .single()

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username already taken'
      })
    }

    console.log('[Signup API] ✅ Username is available')

    // ============================================================================
    // PHASE 2: Use CLIENT-SIDE signUp (not admin.createUser)
    // ============================================================================
    console.log('[Signup API] PHASE 2: Creating auth user (client method)...')
    
    let authUserId: string | null = null

    try {
      const { data, error } = await supabaseAnon.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            username: username.trim().toLowerCase(),
            display_name: fullName?.trim() || username.trim()
          }
        }
      })

      if (error) {
        console.error('[Signup API] ❌ SignUp failed:', error.message)
        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to create user account',
          data: { error: error.message }
        })
      }

      authUserId = data?.user?.id
      console.log('[Signup API] ✅ Auth user created:', authUserId)
    } catch (e: any) {
      console.error('[Signup API] ❌ SignUp exception:', e.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user account',
        data: { error: e.message }
      })
    }

    if (!authUserId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed - no ID returned'
      })
    }

    // ============================================================================
    // PHASE 3: Create user record in database
    // ============================================================================
    console.log('[Signup API] PHASE 3: Creating user record...')
    
    const { data: userData, error: insertError } = await supabaseAdmin
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
      console.error('[Signup API] ❌ Insert Error:', insertError.message)
      
      // Rollback auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
      } catch (e) {
        console.error('[Signup API] ⚠️ Rollback failed')
      }

      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user record',
        data: { error: insertError.message }
      })
    }

    console.log('[Signup API] ✅ User record created')
    console.log('[Signup API] ============ SIGNUP REQUEST END ============')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        display_name: fullName?.trim() || username.trim()
      },
      message: 'Account created successfully! Please check your email to verify.',
      requiresEmailVerification: true
    }

  } catch (error: any) {
    console.error('[Signup API] ============ SIGNUP ERROR ============')
    console.error('[Signup API] Error:', error?.message || error)
    console.error('[Signup API] ============ END SIGNUP ERROR ============')
    throw error
  }
})
