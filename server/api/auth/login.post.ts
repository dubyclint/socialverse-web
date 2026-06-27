// ============================================================================
// FILE: /server/api/auth/login.post.ts - PRODUCTION COMPILATION SECURED
// ============================================================================
import { defineEventHandler, readBody, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  console.log('[Auth/Login] ============ LOGIN REQUEST START ============')
  
  try {
    const body = await readBody(event)
    const { email, password } = body

    if (!email || !password) {
      console.error('[Auth/Login] ❌ Credentials validation rejected on incoming payload')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Initialize environment credentials safely
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('[Auth/Login] ❌ Environment variables missing from runtime node')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration initialization error'
      })
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Auth/Login] Sending credentials to native token service...')
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })

    if (authError || !authData.session || !authData.user) {
      console.error('[Auth/Login] ❌ Core login validation rejected:', authError?.message)
      throw createError({
        statusCode: 401,
        statusMessage: authError?.message || 'Invalid email or password credentials'
      })
    }

    console.log('[Auth/Login] ✅ Authentication challenge confirmed. User identity ID:', authData.user.id)

    console.log('[Auth/Login] Querying matching database row inside "profiles"...')
    
    // ✅ FIXED: Explicitly maps to 'user_id' to prevent the 400 bad request error context
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('username, full_name, avatar_url, rank, rank_points, profile_completed, is_verified')
      .eq('user_id', authData.user.id) 
      .maybeSingle()

    // Handle new users who have registered but don't have filled tables rows yet
    if (profileError || !profile) {
      console.warn('[Auth/Login] ⚠️ Target profile record matching ID missing. Deploying fallback context.')
      
      const meta = authData.user.user_metadata
      return {
        success: true,
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          username: meta?.username || 'user',
          full_name: meta?.full_name || 'User Profile',
          avatar_url: meta?.avatar_url || null,
          rank: 'Bronze I',
          rank_points: 0,
          is_verified: false
        },
        // ✅ FIXED: Clean alignment path removing the broken '/auth/' sub-directory prefix
        redirectTo: '/profile/complete' 
      }
    }

    console.log('[Auth/Login] ✅ High-fidelity profile loaded cleanly. Constructing transaction response...')
    console.log('[Auth/Login] ============ LOGIN REQUEST END ============')
    
    return {
      success: true,
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresIn: authData.session.expires_in,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        rank: profile.rank,
        rank_points: profile.rank_points,
        is_verified: profile.is_verified
      },
      // ✅ FIXED: Redirects based directly on individual complete flags to real page files
      redirectTo: profile.profile_completed ? '/feed' : '/profile/complete'
    }

  } catch (error: any) {
    console.error('[Auth/Login] ============ CRITICAL EXCEPTION CAUGHT ============')
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'An internal exception disrupted authentication routing calculations'
    })
  }
})
