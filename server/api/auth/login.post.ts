// ============================================================================
// FILE: /server/api/auth/login.post.ts - FINAL PRODUCTION VERSION
// ============================================================================
// ✅ Authenticates user
// ✅ Queries user_profiles table
// ✅ Returns complete user data
// ✅ Redirects to feed on success
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '../../utils/supabase-server'

export default defineEventHandler(async (event) => {
  console.log('[Auth/Login] ============ LOGIN REQUEST START ============')
  
  try {
    // ============================================================================
    // STEP 1: Read and validate request body
    // ============================================================================
    console.log('[Auth/Login] STEP 1: Reading request body...')
    
    const body = await readBody(event)
    const { email, password } = body

    console.log('[Auth/Login] Email:', email)
    console.log('[Auth/Login] Password provided:', !!password)

    if (!email || !password) {
      console.error('[Auth/Login] ❌ Missing email or password')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    console.log('[Auth/Login] ✅ Request body validated')

    // ============================================================================
    // STEP 2: Initialize Supabase clients
    // ============================================================================
    console.log('[Auth/Login] STEP 2: Initializing Supabase clients...')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Auth/Login] ❌ Supabase configuration missing')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    console.log('[Auth/Login] ✅ Supabase clients initialized')

    // ============================================================================
    // STEP 3: Authenticate with Supabase
    // ============================================================================
    console.log('[Auth/Login] STEP 3: Authenticating user:', email)

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })

    // ============================================================================
    // STEP 4: Handle authentication errors
    // ============================================================================
    if (error) {
      console.error('[Auth/Login] ❌ Authentication failed:', {
        message: error.message,
        status: error.status,
        code: error.code
      })
      
      if (error.message.includes('Email not confirmed')) {
        console.warn('[Auth/Login] Email not confirmed for:', email)
        throw createError({
          statusCode: 401,
          statusMessage: 'Email not confirmed. Please check your email for verification link.'
        })
      }

      if (error.message.includes('Invalid login credentials')) {
        console.warn('[Auth/Login] Invalid credentials for:', email)
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid email or password'
        })
      }

      throw createError({
        statusCode: 401,
        statusMessage: error.message || 'Authentication failed'
      })
    }

    // ============================================================================
    // STEP 5: Validate response data
    // ============================================================================
    console.log('[Auth/Login] STEP 5: Validating response data...')
    
    if (!data.session || !data.user) {
      console.error('[Auth/Login] ❌ No session or user in response')
      throw createError({
        statusCode: 401,
        statusMessage: 'Login failed - no session created'
      })
    }

    console.log('[Auth/Login] ✅ Login successful for:', email)
    console.log('[Auth/Login] ✅ User ID:', data.user.id)
    console.log('[Auth/Login] ✅ Session created')

    // ============================================================================
    // STEP 6: Fetch complete profile from user_profiles table
    // ============================================================================
    console.log('[Auth/Login] STEP 6: Fetching complete profile...')
    
    const supabaseAdmin = await getAdminClient()

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.warn('[Auth/Login] ⚠️ Profile fetch error:', {
        message: profileError.message,
        code: profileError.code
      })
      
      // Fallback to JWT data if profile not found
      console.log('[Auth/Login] Using JWT data as fallback')
      
      return {
        success: true,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || 'user',
          full_name: data.user.user_metadata?.full_name || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          rank: data.user.user_metadata?.rank || 'Bronze I',
          rank_points: data.user.user_metadata?.rank_points || 0,
          rank_level: data.user.user_metadata?.rank_level || 1,
          is_verified: data.user.user_metadata?.is_verified || false,
          verification_status: data.user.user_metadata?.verification_status || 'unverified'
        },
        redirectTo: '/feed'
      }
    }

    if (!profile) {
      console.error('[Auth/Login] ❌ Profile not found')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[Auth/Login] ✅ Profile fetched successfully')
    console.log('[Auth/Login] Profile data:', {
      id: profile.id,
      username: profile.username,
      rank: profile.rank,
      is_verified: profile.is_verified
    })

    // ============================================================================
    // STEP 7: Return success response with complete user data
    // ============================================================================
    console.log('[Auth/Login] STEP 7: Building success response...')
    console.log('[Auth/Login] ✅ Login complete, returning response')
    console.log('[Auth/Login] ============ LOGIN REQUEST END ============')
    
    return {
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        rank: profile.rank,
        rank_points: profile.rank_points,
        rank_level: profile.rank_level,
        is_verified: profile.is_verified,
        verification_status: profile.verification_status
      },
      redirectTo: '/feed'
    }

  } catch (error: any) {
    console.error('[Auth/Login] ============ LOGIN ERROR ============')
    console.error('[Auth/Login] Error message:', error.message || error)
    console.error('[Auth/Login] ============ END ERROR ============')
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Login failed - please try again'
    })
  }
})
