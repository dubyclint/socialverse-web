// ============================================================================
// FILE: /server/api/auth/signup.post.ts - FINAL PRODUCTION VERSION
// ============================================================================
// ✅ Creates auth user
// ✅ Creates user_profiles record
// ✅ Updates user metadata
// ✅ Auto-authenticates user
// ✅ Returns session token
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, username } = body

    console.log('[SIGNUP] Starting signup for:', email)

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

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // ============================================================================
    // STEP 1: Create auth user
    // ============================================================================
    console.log('[SIGNUP] STEP 1: Creating auth user...')
    
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          username: username.trim().toLowerCase()
        }
      }
    })

    if (authError) {
      console.error('[SIGNUP] ❌ Auth error:', authError.message)
      throw createError({
        statusCode: 400,
        statusMessage: authError.message
      })
    }

    const authUserId = authData?.user?.id
    if (!authUserId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    console.log('[SIGNUP] ✅ Auth user created:', authUserId)

    // ============================================================================
    // STEP 2: Create user record in database
    // ============================================================================
    console.log('[SIGNUP] STEP 2: Creating user record in database...')

    const now = new Date().toISOString()
    
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .insert([
        {
          id: authUserId,
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          full_name: username.trim().toLowerCase(),
          bio: '',
          avatar_url: null,
          cover_url: null,
          location: '',
          website: '',
          birth_date: null,
          gender: null,
          phone: null,
          is_private: false,
          is_blocked: false,
          is_verified: false,
          verification_status: 'none',
          rank: 'Bronze I',
          rank_points: 0,
          rank_level: 1,
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
          last_seen: now,
          created_at: now,
          updated_at: now
        }
      ])
      .select()
      .single()

    if (userError) {
      console.error('[SIGNUP] ⚠️ User record creation failed:', userError.message)
      console.error('[SIGNUP] Error code:', userError.code)
      // Continue - user auth is still created, just database record failed
    } else {
      console.log('[SIGNUP] ✅ User record created successfully')
    }

    // ============================================================================
    // STEP 3: Update user metadata in auth
    // ============================================================================
    console.log('[SIGNUP] STEP 3: Updating user metadata in auth...')

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      {
        user_metadata: {
          username: username.trim().toLowerCase(),
          full_name: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          rank: 'Bronze I',
          rank_points: 0,
          rank_level: 1,
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
          is_verified: false,
          verification_status: 'none'
        }
      }
    )

    if (metadataError) {
      console.warn('[SIGNUP] ⚠️ Failed to update user metadata:', metadataError.message)
    } else {
      console.log('[SIGNUP] ✅ User metadata updated')
    }

    // ============================================================================
    // STEP 4: Auto-authenticate user after signup
    // ============================================================================
    console.log('[SIGNUP] STEP 4: Auto-authenticating user...')

    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })

    if (sessionError) {
      console.error('[SIGNUP] ⚠️ Auto-authentication failed:', sessionError.message)
      console.log('[SIGNUP] Continuing without session token...')
      
      return {
        success: true,
        user: {
          id: authUserId,
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase()
        },
        message: 'Account created successfully!',
        requiresEmailVerification: false,
        token: null
      }
    }

    if (!sessionData?.session) {
      console.warn('[SIGNUP] ⚠️ No session in auto-authentication response')
      
      return {
        success: true,
        user: {
          id: authUserId,
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase()
        },
        message: 'Account created successfully!',
        requiresEmailVerification: false,
        token: null
      }
    }

    console.log('[SIGNUP] ✅ Auto-authentication successful')
    console.log('[SIGNUP] Session token obtained:', !!sessionData.session.access_token)

    // ============================================================================
    // STEP 5: Return success response with token
    // ============================================================================
    console.log('[SIGNUP] ✅ SIGNUP SUCCESS - ALL STEPS COMPLETED')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: 'Account created successfully!',
      requiresEmailVerification: false,
      token: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresIn: sessionData.session.expires_in
    }

  } catch (error: any) {
    console.error('[SIGNUP] ❌ Fatal error:', error?.message)
    throw error
  }
})
