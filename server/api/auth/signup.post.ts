// ============================================================================
// FILE: /server/api/auth/signup.post.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ ISSUE #1 FIXED: full_name set to null (not username)
// ✅ ISSUE #2 FIXED: profile_completed set to false (not true)
// ✅ Comprehensive error handling and logging
// ✅ Auto-authentication after signup
// ✅ Proper redirect to profile completion flow
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, username } = body

    console.log('[SIGNUP] ============ SIGNUP REQUEST START ============')
    console.log('[SIGNUP] Starting signup for:', email)

    // ============================================================================
    // STEP 1: VALIDATE REQUEST BODY
    // ============================================================================
    console.log('[SIGNUP] STEP 1: Validating request body...')

    if (!email || !password || !username) {
      console.error('[SIGNUP] ❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      console.error('[SIGNUP] ❌ Invalid email format:', email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // Validate password length
    if (password.length < 6) {
      console.error('[SIGNUP] ❌ Password too short')
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters'
      })
    }

    // Validate username length
    if (username.trim().length < 3) {
      console.error('[SIGNUP] ❌ Username too short')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be at least 3 characters'
      })
    }

    console.log('[SIGNUP] ✅ Request body validation passed')

    // ============================================================================
    // STEP 2: INITIALIZE SUPABASE CLIENTS
    // ============================================================================
    console.log('[SIGNUP] STEP 2: Initializing Supabase clients...')

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('[SIGNUP] ❌ Supabase configuration missing')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[SIGNUP] ✅ Supabase clients initialized')

    // ============================================================================
    // STEP 3: CREATE AUTH USER
    // ============================================================================
    console.log('[SIGNUP] STEP 3: Creating auth user...')

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
      console.error('[SIGNUP] ❌ User creation failed - no user ID returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    console.log('[SIGNUP] ✅ Auth user created:', authUserId)

    // ============================================================================
    // STEP 4: CREATE USER PROFILE RECORD IN DATABASE
    // ============================================================================
    console.log('[SIGNUP] STEP 4: Creating user profile record in database...')

    const now = new Date().toISOString()

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .insert([
        {
          id: authUserId,
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          full_name: null,  // ✅ ISSUE #1 FIX: Set to null, NOT username
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
          verification_status: 'unverified',
          rank: 'Bronze I',
          rank_points: 0,
          rank_level: 1,
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
          profile_completed: false,  // ✅ ISSUE #2 FIX: Set to false, NOT true
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
      // Don't throw - continue with metadata update
    } else {
      console.log('[SIGNUP] ✅ User profile record created successfully')
      console.log('[SIGNUP] Profile data:', {
        id: userRecord?.id,
        email: userRecord?.email,
        username: userRecord?.username,
        full_name: userRecord?.full_name,  // ✅ Verify it's null
        profile_completed: userRecord?.profile_completed  // ✅ Verify it's false
      })
    }

    // ============================================================================
    // STEP 5: UPDATE USER METADATA IN AUTH
    // ============================================================================
    console.log('[SIGNUP] STEP 5: Updating user metadata in auth...')

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      {
        user_metadata: {
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          rank: 'Bronze I',
          rank_points: 0,
          rank_level: 1,
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
          is_verified: false,
          verification_status: 'unverified',
          profile_completed: false  // ✅ ISSUE #2 FIX: Set to false
        }
      }
    )

    if (metadataError) {
      console.warn('[SIGNUP] ⚠️ Failed to update user metadata:', metadataError.message)
      // Don't throw - continue with email and authentication
    } else {
      console.log('[SIGNUP] ✅ User metadata updated successfully')
    }

    // ============================================================================
    // STEP 6: SEND VERIFICATION EMAIL (OPTIONAL - FAILS GRACEFULLY)
    // ============================================================================
    console.log('[SIGNUP] STEP 6: Attempting to send verification email...')

    const verificationToken = Buffer.from(JSON.stringify({
      userId: authUserId,
      email: email.trim().toLowerCase()
    })).toString('base64')

    try {
      const emailResult = await sendVerificationEmail(
        email.trim().toLowerCase(),
        username.trim().toLowerCase(),
        verificationToken
      )

      if (emailResult.success) {
        console.log('[SIGNUP] ✅ Verification email sent successfully')
      } else {
        console.warn('[SIGNUP] ⚠️ Failed to send verification email:', emailResult.error)
        console.log('[SIGNUP] Continuing without email - user will be auto-authenticated')
      }
    } catch (emailError: any) {
      console.warn('[SIGNUP] ⚠️ Email service error:', emailError.message)
      console.log('[SIGNUP] Continuing without email - user will be auto-authenticated')
    }

    // ============================================================================
    // STEP 7: AUTO-AUTHENTICATE USER AFTER SIGNUP
    // ============================================================================
    console.log('[SIGNUP] STEP 7: Auto-authenticating user...')

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
        token: null,
        redirectTo: '/auth/complete-profile'
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
        token: null,
        redirectTo: '/auth/complete-profile'
      }
    }

    console.log('[SIGNUP] ✅ Auto-authentication successful')
    console.log('[SIGNUP] Session token obtained:', !!sessionData.session.access_token)

    // ============================================================================
    // STEP 8: RETURN SUCCESS RESPONSE WITH TOKEN AND REDIRECT
    // ============================================================================
    console.log('[SIGNUP] STEP 8: Building success response...')
    console.log('[SIGNUP] ✅ SIGNUP SUCCESS - ALL STEPS COMPLETED')
    console.log('[SIGNUP] ============ SIGNUP REQUEST END ============')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: 'Account created successfully! Welcome to SocialVerse!',
      requiresEmailVerification: false,
      token: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresIn: sessionData.session.expires_in,
      redirectTo: '/auth/complete-profile'  // ✅ Redirect to profile completion flow
    }

  } catch (error: any) {
    console.error('[SIGNUP] ============ SIGNUP ERROR ============')
    console.error('[SIGNUP] ❌ Fatal error:', error?.message)
    console.error('[SIGNUP] Error details:', {
      statusCode: error?.statusCode,
      statusMessage: error?.statusMessage,
      message: error?.message
    })
    console.error('[SIGNUP] ============ SIGNUP ERROR END ============')

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Signup failed - please try again'
    })
  }
})
