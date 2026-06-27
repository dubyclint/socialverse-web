// ============================================================================
// FILE: /server/api/test/supabase-auth-debug.post.ts - RECONCILED
// ============================================================================
import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[DEBUG] Starting Supabase Auth diagnostic...')

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        error: 'Missing Supabase administrative service role credentials',
        details: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseServiceKey: supabaseServiceKey ? 'Set' : 'Missing'
        }
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Test 1: Check if we can query the core auth context sandbox
    console.log('[DEBUG] Test 1: Querying auth.users system table...')
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1)

    if (usersError) {
      return { success: false, error: 'Cannot query auth.users sandbox engine directly.', details: usersError }
    }

    // Test 2: Check database profile table layout
    // ✅ FIXED: Points to 'profiles', not the legacy 'user' table string
    console.log('[DEBUG] Test 2: Querying production profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .limit(1)

    if (profilesError) {
      return { success: false, error: 'Cannot query verified profiles schema table.', details: profilesError }
    }

    // Test 3: Sandbox User Lifecycle Loop
    console.log('[DEBUG] Test 3: Attempting to create system validation test user...')
    const testEmail = `test-${Date.now()}@example.com`
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestProductionPassword123!',
      email_confirm: true
    })

    if (authError || !authData?.user) {
      return { success: false, error: 'Cannot provision operational test user context.', details: authError }
    }

    const verifiedUserId = authData.user.id
    console.log('[DEBUG] ✅ Test user created with UUID context:', verifiedUserId)

    // Test 4: Schema insertion confirmation check
    // ✅ FIXED: Targets 'profiles' using 'user_id' matching database foreign-key constraints
    console.log('[DEBUG] Test 4: Attempting configuration insert into profiles...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: verifiedUserId,
        username: `testuser_${Date.now()}`,
        display_name: 'Test Diagnostics Unit',
        avatar_url: null,
        bio: 'Automated software configuration test profile.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    // Always ensure cleanup executes, regardless of profile insertion results
    if (profileError) {
      console.error('[DEBUG] Profile insert failed. Cleaning up orphan auth account...')
      await supabase.auth.admin.deleteUser(verifiedUserId)
      return { success: false, error: 'Cannot complete profile insert tracking operations.', details: profileError }
    }

    console.log('[DEBUG] ✅ Profile mapping validated. Purging diagnostic test footprint...')
    await supabase.auth.admin.deleteUser(verifiedUserId)

    return {
      success: true,
      message: 'All application Supabase database engine verification loops passed successfully!',
      details: {
        supabaseUrl,
        authUserCreation: '✅ Working',
        profileInsert: '✅ Working',
        testEmail
      }
    }

  } catch (error: any) {
    console.error('[DEBUG] Diagnostic critical exception thrown:', error)
    return { success: false, error: error.message, stack: error.stack }
  }
})
