// server/api/test/supabase-check.get.ts - DIAGNOSTIC ENDPOINT
// This endpoint will help identify what's wrong with Supabase

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[DIAGNOSTIC] Starting Supabase health check...')

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // ✅ Check 1: Environment variables
    console.log('[DIAGNOSTIC] Check 1: Environment variables')
    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        error: 'Missing Supabase credentials',
        checks: {
          supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
          supabaseServiceKey: supabaseServiceKey ? '✅ Set' : '❌ Missing'
        }
      }
    }

    // ✅ Check 2: Create client
    console.log('[DIAGNOSTIC] Check 2: Creating Supabase client')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ✅ Check 3: Query auth.users table
    console.log('[DIAGNOSTIC] Check 3: Querying auth.users table')
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1)

    if (usersError) {
      console.error('[DIAGNOSTIC] Auth users query failed:', usersError)
      return {
        success: false,
        error: 'Cannot query auth.users table',
        checks: {
          supabaseUrl: '✅ Set',
          supabaseServiceKey: '✅ Set',
          authUsersQuery: `❌ ${usersError.message}`
        }
      }
    }

    console.log('[DIAGNOSTIC] ✅ Auth users query successful')

    // ✅ Check 4: Query user table
    console.log('[DIAGNOSTIC] Check 4: Querying user table')
    const { data: profiles, error: profilesError } = await supabase
      .from('user')
      .select('user_id, username')
      .limit(1)

    if (profilesError) {
      console.error('[DIAGNOSTIC] User table query failed:', profilesError)
      return {
        success: false,
        error: 'Cannot query user table',
        checks: {
          supabaseUrl: '✅ Set',
          supabaseServiceKey: '✅ Set',
          authUsersQuery: '✅ Working',
          userTableQuery: `❌ ${profilesError.message}`
        }
      }
    }

    console.log('[DIAGNOSTIC] ✅ User table query successful')

    // ✅ Check 5: Try to create a test auth user
    console.log('[DIAGNOSTIC] Check 5: Attempting to create test auth user')
    const testEmail = `diagnostic-test-${Date.now()}@example.com`
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false
    })

    if (authError) {
      console.error('[DIAGNOSTIC] Auth user creation failed:', {
        message: authError.message,
        status: authError.status,
        code: authError.code
      })
      
      return {
        success: false,
        error: 'Cannot create auth user',
        checks: {
          supabaseUrl: '✅ Set',
          supabaseServiceKey: '✅ Set',
          authUsersQuery: '✅ Working',
          userTableQuery: '✅ Working',
          createAuthUser: `❌ ${authError.message}`
        },
        details: {
          errorStatus: authError.status,
          errorCode: authError.code,
          errorMessage: authError.message
        }
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Auth user creation returned no user data',
        checks: {
          supabaseUrl: '✅ Set',
          supabaseServiceKey: '✅ Set',
          authUsersQuery: '✅ Working',
          userTableQuery: '✅ Working',
          createAuthUser: '❌ No user data returned'
        }
      }
    }

    console.log('[DIAGNOSTIC] ✅ Test auth user created:', authData.user.id)

    // ✅ Check 6: Try to insert into user table
    console.log('[DIAGNOSTIC] Check 6: Attempting to insert into user table')
    const { data: profileData, error: profileError } = await supabase
      .from('user')
      .insert({
        user_id: authData.user.id,
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
      console.error('[DIAGNOSTIC] Profile insert failed:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details
      })
      
      // Clean up
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return {
        success: false,
        error: 'Cannot insert into user table',
        checks: {
          supabaseUrl: '✅ Set',
          supabaseServiceKey: '✅ Set',
          authUsersQuery: '✅ Working',
          userTableQuery: '✅ Working',
          createAuthUser: '✅ Working',
          insertProfile: `❌ ${profileError.message}`
        },
        details: {
          errorCode: profileError.code,
          errorMessage: profileError.message,
          errorDetails: profileError.details
        }
      }
    }

    console.log('[DIAGNOSTIC] ✅ Profile insert successful')

    // ✅ Clean up test data
    await supabase.auth.admin.deleteUser(authData.user.id)

    return {
      success: true,
      message: '✅ All Supabase checks passed!',
      checks: {
        supabaseUrl: '✅ Set',
        supabaseServiceKey: '✅ Set',
        authUsersQuery: '✅ Working',
        userTableQuery: '✅ Working',
        createAuthUser: '✅ Working',
        insertProfile: '✅ Working'
      },
      details: {
        supabaseUrl: supabaseUrl,
        totalAuthUsers: users?.length || 0,
        totalProfiles: profiles?.length || 0,
        testEmail: testEmail
      }
    }

  } catch (error: any) {
    console.error('[DIAGNOSTIC] Unexpected error:', error)
    return {
      success: false,
      error: 'Unexpected error during diagnostic',
      details: {
        message: error.message,
        stack: error.stack
      }
    }
  }
})
