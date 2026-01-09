// ============================================================================
// FIXED FILE: /server/api/auth/signup.post.ts
// ============================================================================
// ✅ FIX 1: Return session token after signup
// ✅ FIX 2: Auto-authenticate user after signup
// ✅ FIX 3: Return complete user data with token
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '~/server/utils/email'

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

    console.log('[SIGNUP] Creating auth user...')
    
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
      console.error('[SIGNUP] Auth error:', authError.message)
      
      if (authError.message && authError.message.toLowerCase().includes('database')) {
        console.warn('[SIGNUP] ⚠️ Database error, continuing...')
      } else if (authError.message && authError.message.toLowerCase().includes('email')) {
        console.warn('[SIGNUP] ⚠️ Email error, continuing...')
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: authError.message
        })
      }
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
    // CREATE USER RECORD IN DATABASE
    // ============================================================================
    console.log('[SIGNUP] Creating user record in database...')

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
    } else {
      console.log('[SIGNUP] ✅ User record created successfully')
    }

    // ============================================================================
    // ✅ FIX: AUTO-AUTHENTICATE USER AFTER SIGNUP
    // ============================================================================
    console.log('[SIGNUP] Auto-authenticating user after signup...')

    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })

    if (sessionError) {
      console.error('[SIGNUP] ⚠️ Auto-authentication failed:', sessionError.message)
      console.log('[SIGNUP] Continuing without session token...')
      
      // Return response without token (frontend will need to login separately)
      return {
        success: true,
        user: {
          id: authUserId,
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase()
        },
        message: 'Account created successfully!',
        requiresEmailVerification: false,
        token: null // ❌ No token available
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
        token: null // ❌ No token available
      }
    }

    console.log('[SIGNUP] ✅ Auto-authentication successful')
    console.log('[SIGNUP] Session token obtained:', !!sessionData.session.access_token)

    // ============================================================================
    // ✅ FIX: RETURN COMPLETE RESPONSE WITH TOKEN
    // ============================================================================
    console.log('[SIGNUP] ✅ SIGNUP SUCCESS WITH AUTO-AUTHENTICATION')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: 'Account created successfully!',
      requiresEmailVerification: false,
      // ✅ NEW: Include session token for auto-authentication
      token: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresIn: sessionData.session.expires_in
    }

  } catch (error: any) {
    console.error('[SIGNUP] ❌ Fatal error:', error?.message)
    throw error
  }
})
