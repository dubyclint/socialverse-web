// ============================================================================
// FILE 6: /server/api/auth/login.post.ts - COMPLETE FIXED VERSION (FINAL)
// ============================================================================
// FIXES:
// ✅ Verify it returns complete user data
// ✅ Ensure token is returned
// ✅ Better error handling
// ✅ Profile fetch on login
// ✅ Auto-create profile if missing
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

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
    // STEP 2: Initialize Supabase client
    // ============================================================================
    console.log('[Auth/Login] STEP 2: Initializing Supabase client...')
    
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
    console.log('[Auth/Login] STEP 3: Authenticating user:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // ============================================================================
    // STEP 4: Handle authentication errors
    // ============================================================================
    if (error) {
      console.error('[Auth/Login] ✗ Authentication failed:', {
        message: error.message,
        status: error.status,
        code: error.code
      })
      
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
    // STEP 6: Fetch profile from profiles table
    // ============================================================================
    console.log('[Auth/Login] STEP 6: Fetching profile from profiles table...')
    const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, user_id, username, full_name, avatar_url, bio, is_verified, created_at, updated_at')
  // ✅ Removed: email, location
  // ✅ Added: user_id, created_at, updated_at
  // ✅ Changed: verified → is_verified
  .eq('id', data.user.id)
  .single()
    
    if (profileError) {
      console.warn('[Auth/Login] ⚠️ Profile fetch error:', {
        message: profileError.message,
        code: profileError.code
      })
      
      // ============================================================================
      // FALLBACK 1: Profile doesn't exist - try to create it
      // ============================================================================
      if (profileError.code === 'PGRST116') {
        console.log('[Auth/Login] Profile not found (PGRST116), attempting to create...')
        
        const username = data.user.user_metadata?.username || 
                        data.user.email?.split('@')[0] || 
                        'user'
        const fullName = data.user.user_metadata?.full_name || username
        
        console.log('[Auth/Login] Creating profile with:', {
          username,
          fullName,
          email: data.user.email
        })
        
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
          console.warn('[Auth/Login] ⚠️ Failed to create profile:', {
            message: createProfileError.message,
            code: createProfileError.code
          })
          console.log('[Auth/Login] Using auth user metadata as fallback')
          
          // ============================================================================
          // FALLBACK 2: Profile creation failed - use auth metadata
          // ============================================================================
          console.log('[Auth/Login] ✅ Returning login response with fallback data')
          
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
        console.log('[Auth/Login] New profile:', {
          id: newProfile.id,
          username: newProfile.username,
          full_name: newProfile.full_name
        })
        
        // ============================================================================
        // STEP 7: Return success response with newly created profile
        // ============================================================================
        console.log('[Auth/Login] ✅ Returning login response with newly created profile')
        console.log('[Auth/Login] ============ LOGIN REQUEST END ============')
        
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
      
      // ============================================================================
      // FALLBACK 3: Other profile fetch errors - use auth metadata
      // ============================================================================
      console.warn('[Auth/Login] Using auth user metadata as fallback')
      console.log('[Auth/Login] ✅ Returning login response with fallback data')
      console.log('[Auth/Login] ============ LOGIN REQUEST END ============')
      
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
    console.log('[Auth/Login] Profile data:', {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url
    })

    // ============================================================================
    // STEP 7: Return success response with complete user data
    // ============================================================================
    console.log('[Auth/Login] STEP 7: Building success response...')
    console.log('[Auth/Login] ✅ Login complete, returning response')
    console.log('[Auth/Login] Response includes:', {
      token: !!data.session.access_token,
      refreshToken: !!data.session.refresh_token,
      userId: profile.id,
      username: profile.username
    })
    
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
        avatar_url: profile.avatar_url
      }
    }

  } catch (error: any) {
    console.error('[Auth/Login] ============ LOGIN ERROR ============')
    console.error('[Auth/Login] Error type:', error.constructor.name)
    console.error('[Auth/Login] Error message:', error.message || error)
    console.error('[Auth/Login] Error status:', error.statusCode)
    console.error('[Auth/Login] Error details:', error.statusMessage)
    console.error('[Auth/Login] ============ END ERROR ============')
    
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
