// ============================================================================
// FILE 2: /server/api/auth/signup.post.ts - COMPLETE FIXED VERSION
// ============================================================================
// FIXES:
// ✅ Uses client-side signUp (not admin.createUser)
// ✅ Clean logging with [SIGNUP] prefix
// ✅ Requires SUPABASE_ANON_KEY environment variable
// ✅ Proper error handling and rollback
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, username, fullName } = body

    console.log('[SIGNUP] Starting signup for:', email)

    // ============================================================================
    // VALIDATION
    // ============================================================================
    if (!email || !password || !username) {
      console.log('[SIGNUP] ❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.log('[SIGNUP] ❌ Missing Supabase config')
      console.log('[SIGNUP] URL:', supabaseUrl ? '✓' : '✗')
      console.log('[SIGNUP] ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
      console.log('[SIGNUP] SERVICE_KEY:', supabaseServiceKey ? '✓' : '✗')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // ============================================================================
    // CHECK USERNAME UNIQUENESS
    // ============================================================================
    console.log('[SIGNUP] Checking username:', username)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user')
      .select('id')
      .ilike('username', username.trim().toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('[SIGNUP] ❌ Username check error:', checkError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Username check failed'
      })
    }

    if (existingUser) {
      console.log('[SIGNUP] ❌ Username already taken')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username already taken'
      })
    }

    console.log('[SIGNUP] ✓ Username available')

    // ============================================================================
    // SIGN UP WITH SUPABASE AUTH (CLIENT METHOD)
    // ============================================================================
    console.log('[SIGNUP] Creating auth user...')
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          username: username.trim().toLowerCase(),
          display_name: fullName?.trim() || username.trim()
        }
      }
    })

    if (authError) {
      console.log('[SIGNUP] ❌ Auth signup error:', authError.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user: ' + authError.message
      })
    }

    const authUserId = authData?.user?.id
    if (!authUserId) {
      console.log('[SIGNUP] ❌ No user ID returned from auth')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    console.log('[SIGNUP] ✓ Auth user created:', authUserId)

    // ============================================================================
    // CREATE USER RECORD IN DATABASE
    // ============================================================================
    console.log('[SIGNUP] Creating user record in database...')
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
      console.log('[SIGNUP] ❌ Database insert error:', insertError.message)
      
      // ROLLBACK: Delete auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        console.log('[SIGNUP] ✓ Rolled back auth user')
      } catch (e) {
        console.log('[SIGNUP] ⚠️ Rollback failed')
      }

      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user record: ' + insertError.message
      })
    }

    console.log('[SIGNUP] ✓✓✓ SIGNUP SUCCESS ✓✓✓')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: 'Account created! Check your email to verify.'
    }

  } catch (error: any) {
    console.log('[SIGNUP] ❌❌❌ SIGNUP FAILED ❌❌❌')
    console.log('[SIGNUP] Error:', error?.message || error)
    throw error
  }
})
