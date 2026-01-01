// ============================================================================
// FILE: /server/api/auth/login.post.ts - COMPLETE FIXED VERSION WITH PROFILE FETCH
// ============================================================================
// Login endpoint with comprehensive error handling and profile data fetching
// ✅ FIXED: Now fetches profile from profiles table to get real username
// ✅ FIXED: Returns complete user data with username, full_name, avatar_url
// ✅ FIXED: Proper error handling for profile fetch
// ✅ FIXED: Auto-creates profile if missing during login
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  console.log('[Auth/Login] POST request received')
  
  try {
    // ============================================================================
    // STEP 1: Read and validate request body
    // ============================================================================
    const body = await readBody(event)
    const { email, password } = body

    console.log('[Auth/Login] Email:', email)

    if (!email || !password) {
      console.error('[Auth/Login] ❌ Missing email or password')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // ============================================================================
    // STEP 2: Initialize Supabase client
    // ============================================================================
    console.log('[Auth/Login] Initializing Supabase client...')
    
    const supabase = await serverSupabaseClient(event)
    
    if (!supabase) {
      console.error('[Auth/Login] ❌ Supabase not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database unavailable'
      })
    }

    console.log('[Auth/Login] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 3: Authenticate with Supabase
    // ============================================================================
    console.log('[Auth/Login] Authenticating user:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // ============================================================================
    // STEP 4: Handle authentication errors
    // ============================================================================
    if (error) {
      console.error('[Auth/Login] ✗ Authentication failed:', error.message)
      
      // Check for specific error messages
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
          statusMessage: 'Invalid login credentials'
        })
      }

      if (error.message.includes('User not found')) {
        console.warn('[Auth/Login] User not found:', email)
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid login credentials'
        })
      }

      // Generic error
      throw createError({
        statusCode: 401,
        statusMessage: error.message || 'Authentication failed'
      })
    }

    // ============================================================================
    // STEP 5: Validate response data
    // ============================================================================
    if (!data.session || !data.user) {
      console.error('[Auth/Login] ❌ No session or user in response')
      throw createError({
        statusCode: 401,
        statusMessage: 'Login failed - no session created'
      })
    }

    console.log('[Auth/Login] ✅ Login successful for:', email)
    console.log('[Auth/Login] ✅ User ID:', data.user.id)

    // ============================================================================
    // STEP 6: Fetch profile from profiles table
    // ============================================================================
    console.log('[Auth/Login] Fetching profile from profiles table...')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, email, avatar_url, bio, location, verified')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.warn('[Auth/Login] ⚠️ Profile fetch error:', profileError.message)
      
      // If profile doesn't exist, try to create it
      if (profileError.code === 'PGRST116') {
        console.log('[Auth/Login] Profile not found, attempting to create...')
        
        const username = data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'user'
        const fullName = data.user.user_metadata?.full_name || username
        
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username.toLowerCase(),
            username_lower: username.toLowerCase(),
            full_name: fullName,
            email: data.user.email,
            avatar_url: null,
            bio: '',
            location: '',
            verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (createProfileError) {
          console.warn('[Auth/Login] ⚠️ Failed to create profile:', createProfileError.message)
          // Don't fail login - use auth user metadata as fallback
          console.log('[Auth/Login] Using auth user metadata as fallback')
          
          return {
            success: true,
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            user: {
              id: data.user.id,
              email: data.user.email,
              username: data.user.user_metadata?.username || username,
              full_name: data.user.user_metadata?.full_name || fullName,
              avatar_url: data.user.user_metadata?.avatar_url || null
            }
          }
        }
        
        console.log('[Auth/Login] ✅ Profile created successfully')
        
        return {
          success: true,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
          user: {
            id: newProfile.id,
            email: newProfile.email,
            username: newProfile.username,
            full_name: newProfile.full_name,
            avatar_url: newProfile.avatar_url
          }
        }
      }
      
      // For other errors, use auth user metadata as fallback
      console.warn('[Auth/Login] Using auth user metadata as fallback')
      
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
          avatar_url: data.user.user_metadata?.avatar_url || null
        }
      }
    }

    if (!profile) {
      console.error('[Auth/Login] ❌ Profile not found and could not be created')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[Auth/Login] ✅ Profile fetched successfully')
    console.log('[Auth/Login] Profile username:', profile.username)

    // ============================================================================
    // STEP 7: Return success response with complete user data
    // ============================================================================
    console.log('[Auth/Login] ✅ Login complete, returning response')
    
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
        avatar_url: profile.avatar_url
      }
    }

  } catch (error: any) {
    console.error('[Auth/Login] ❌ Error:', error.message || error)
    
    // If it's already a formatted error, throw it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise, return generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Login failed - please try again'
    })
  }
})
