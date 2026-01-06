// ============================================================================
// FILE: /server/api/auth/signup.post.ts - FIXED WITH RPC FUNCTION
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, username, fullName } = body

    console.log('[SIGNUP] Starting signup for:', email)

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

    // Check username
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

    // Sign up with Supabase Auth
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
    // CREATE USER RECORD USING RPC FUNCTION (BYPASSES RLS)
    // ============================================================================
    console.log('[SIGNUP] Creating user profile via RPC function...')
    
    const { data: userData, error: rpcError } = await supabaseAdmin.rpc(
      'create_user_profile',
      {
        p_user_id: authUserId,
        p_username: username.trim().toLowerCase(),
        p_email: email.trim().toLowerCase(),
        p_display_name: fullName?.trim() || username.trim()
      }
    )

    if (rpcError) {
      console.log('[SIGNUP] ❌ RPC function error:', rpcError.message)
      console.log('[SIGNUP] ❌ Error code:', rpcError.code)
      console.log('[SIGNUP] ❌ Error details:', rpcError.details)
      
      // ROLLBACK: Delete auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        console.log('[SIGNUP] ✓ Rolled back auth user')
      } catch (e) {
        console.log('[SIGNUP] ⚠️ Rollback failed')
      }

      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user profile: ' + rpcError.message
      })
    }

    console.log('[SIGNUP] ✓ User profile created successfully')
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
