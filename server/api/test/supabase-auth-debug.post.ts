// server/api/test/supabase-auth-debug.post.ts
// DIAGNOSTIC ENDPOINT - Test Supabase Auth Configuration

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[DEBUG] Starting Supabase Auth diagnostic...')

    // ✅ Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[DEBUG] Environment Check:')
    console.log('  - SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        error: 'Missing Supabase credentials',
        details: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseServiceKey: supabaseServiceKey ? 'Set' : 'Missing'
        }
      }
    }

    // ✅ Create Supabase client
    console.log('[DEBUG] Creating Supabase client...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ✅ Test 1: Check if we can query the auth.users table
    console.log('[DEBUG] Test 1: Querying auth.users table...')
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1)

    if (usersError) {
      console.error('[DEBUG] Auth users query error:', usersError)
      return {
        success: false,
        error: 'Cannot query auth.users table',
        details: usersError
      }
    }

    console.log('[DEBUG] ✅ Auth users query successful')

    // ✅ Test 2: Check if we can query the user table
    console.log('[DEBUG] Test 2: Querying user table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user')
      .select('user_id, username')
      .limit(1)

    if (profilesError) {
      console.error('[DEBUG] User table query error:', profilesError)
      return {
        success: false,
        error: 'Cannot query user table',
        details: profilesError
      }
    }

    console.log('[DEBUG] ✅ User table query successful')

    // ✅ Test 3: Try to create a test user
    console.log('[DEBUG] Test 3: Attempting to create test user...')
    const testEmail = `test-${Date.now()}@example.com`
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false
    })

    if (authError) {
      console.error('[DEBUG] Auth user creation error:', authError)
      return {
        success: false,
        error: 'Cannot create auth user',
        details: {
          message: authError.message,
          status: authError.status,
          code: authError.code
        }
      }
    }

    console.log('[DEBUG] ✅ Test user created:', authData.user?.id)

    // ✅ Test 4: Try to insert into user table
    console.log('[DEBUG] Test 4: Attempting to insert into user table...')
    const { data: profileData, error: profileError } = await supabase
      .from('user')
      .insert({
        user_id: authData.user!.id,
        username: `testuser${Date.now()}`,
        display_name: 'Test User',
        avatar_url: null,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('[DEBUG] Profile insert error:', profileError)
      
      // Clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user!.id)
      
      return {
        success: false,
        error: 'Cannot insert into user table',
        details: {
          message: profileError.message,
          code: profileError.code
        }
      }
    }

    console.log('[DEBUG] ✅ Profile inserted successfully')

    // ✅ Clean up test data
    await supabase.auth.admin.deleteUser(authData.user!.id)

    return {
      success: true,
      message: 'All Supabase tests passed!',
      details: {
        supabaseUrl: supabaseUrl,
        authUserCreation: '✅ Working',
        profileInsert: '✅ Working',
        testEmail: testEmail
      }
    }

  } catch (error: any) {
    console.error('[DEBUG] Diagnostic error:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
})
