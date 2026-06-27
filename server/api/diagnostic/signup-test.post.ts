// FILE: /server/api/diagnostic/signup-test.post.ts
// ============================================================================
// DIAGNOSTIC ENDPOINT - Test signup process step by step
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Signup Test] Starting diagnostic test...')

    const body = await readBody(event)
    const { email, password, username, fullName } = body

    console.log('[Signup Test] Input:', { email, username, hasPassword: !!password })

    // ============================================================================
    // Test 1: Supabase client
    // ============================================================================
    console.log('[Signup Test] Test 1: Checking Supabase client...')
    let supabase
    try {
      supabase = await serverSupabaseClient(event)
      console.log('[Signup Test] ✅ Supabase client OK')
    } catch (err: any) {
      console.error('[Signup Test] ❌ Supabase client error:', err.message)
      return {
        error: 'Supabase client failed',
        details: err.message
      }
    }

    // ============================================================================
    // Test 2: Check if user table exists
    // ============================================================================
    console.log('[Signup Test] Test 2: Checking user table...')
    try {
      const { data, error } = await supabase
        .from('user')
        .select('user_id')
        .limit(1)

      if (error) {
        console.error('[Signup Test] ❌ User table error:', error.message)
        return {
          error: 'User table query failed',
          details: error.message,
          code: error.code
        }
      }
      console.log('[Signup Test] ✅ User table OK')
    } catch (err: any) {
      console.error('[Signup Test] ❌ User table exception:', err.message)
      return {
        error: 'User table exception',
        details: err.message
      }
    }

    // ============================================================================
    // Test 3: Check if profiles view exists
    // ============================================================================
    console.log('[Signup Test] Test 3: Checking profiles view...')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      if (error) {
        console.error('[Signup Test] ❌ Profiles view error:', error.message)
        return {
          error: 'Profiles view query failed',
          details: error.message,
          code: error.code
        }
      }
      console.log('[Signup Test] ✅ Profiles view OK')
    } catch (err: any) {
      console.error('[Signup Test] ❌ Profiles view exception:', err.message)
      return {
        error: 'Profiles view exception',
        details: err.message
      }
    }

    // ============================================================================
    // Test 4: Check username availability
    // ============================================================================
    console.log('[Signup Test] Test 4: Checking username...')
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('user_id')
        .eq('username', username.toLowerCase())
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[Signup Test] ❌ Username check error:', checkError.message)
        return {
          error: 'Username check failed',
          details: checkError.message,
          code: checkError.code
        }
      }

      if (existingUser) {
        console.error('[Signup Test] ❌ Username already taken')
        return {
          error: 'Username already taken'
        }
      }

      console.log('[Signup Test] ✅ Username available')
    } catch (err: any) {
      console.error('[Signup Test] ❌ Username check exception:', err.message)
      return {
        error: 'Username check exception',
        details: err.message
      }
    }

    // ============================================================================
    // Test 5: Create auth user
    // ============================================================================
    console.log('[Signup Test] Test 5: Creating auth user...')
    let authUser
    try {
      const { data: { user }, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
            full_name: fullName || username,
            avatar_url: null
          }
        }
      })

      if (signupError) {
        console.error('[Signup Test] ❌ Auth signup error:', signupError.message)
        return {
          error: 'Auth signup failed',
          details: signupError.message
        }
      }

      if (!user) {
        console.error('[Signup Test] ❌ No user returned')
        return {
          error: 'No user returned from signup'
        }
      }

      authUser = user
      console.log('[Signup Test] ✅ Auth user created:', user.id)
    } catch (err: any) {
      console.error('[Signup Test] ❌ Auth signup exception:', err.message)
      return {
        error: 'Auth signup exception',
        details: err.message
      }
    }

    // ============================================================================
    // Test 6: Wait for trigger and verify profile
    // ============================================================================
    console.log('[Signup Test] Test 6: Verifying profile creation...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.error('[Signup Test] ⚠️ Profile not found:', profileError.message)
        return {
          warning: 'Profile not found after trigger',
          details: profileError.message,
          code: profileError.code,
          userId: authUser.id
        }
      }

      console.log('[Signup Test] ✅ Profile verified:', profile.id)
    } catch (err: any) {
      console.error('[Signup Test] ❌ Profile verification exception:', err.message)
      return {
        error: 'Profile verification exception',
        details: err.message,
        userId: authUser.id
      }
    }

    return {
      success: true,
      message: 'All tests passed!',
      userId: authUser.id
    }

  } catch (err: any) {
    console.error('[Signup Test] ❌ Unexpected error:', err)
    return {
      error: 'Unexpected error',
      details: err.message
    }
  }
})
