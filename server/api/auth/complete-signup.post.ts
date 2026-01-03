// ============================================================================
// CORRECTED FILE 3: /server/api/auth/complete-signup.post.ts
// ============================================================================
// FIX: Changed 'verified' to 'is_verified' and fixed import
// ============================================================================

import { serverSupabaseClient } from '~/server/utils/supabase-server'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] ============ COMPLETE SIGNUP START ============')
    
    const body = await readBody(event)
    const { userId, username, fullName, email } = body

    console.log('[API] Completing signup for user:', userId)
    console.log('[API] Username:', username)
    console.log('[API] Email:', email)

    // ============================================================================
    // STEP 1: Validate input
    // ============================================================================
    if (!userId || !username || !email) {
      console.error('[API] ❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID, username, and email are required'
      })
    }

    // ============================================================================
    // STEP 2: Get Supabase client
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    if (!supabase) {
      console.error('[API] ❌ Supabase not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database unavailable'
      })
    }

    console.log('[API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 3: Check if profile already exists
    // ============================================================================
    console.log('[API] Checking if profile exists for user:', userId)
    
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('[API] ✅ Profile already exists for user:', userId)
      return {
        success: true,
        message: 'Profile already exists',
        profile: existingProfile
      }
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[API] ❌ Error checking profile:', checkError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to check profile'
      })
    }

    // ============================================================================
    // STEP 4: Create new profile
    // ============================================================================
    console.log('[API] Creating new profile for user:', userId)
    
    // ✅ FIX: Changed 'verified' to 'is_verified'
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username.toLowerCase(),
        username_lower: username.toLowerCase(),
        full_name: fullName || username,
        email: email.toLowerCase(),
        avatar_url: null,
        bio: '',
        location: '',
        website: '',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createProfileError) {
      console.error('[API] ❌ Error creating profile:', createProfileError)
      
      // Check if username already exists
      if (createProfileError.message?.includes('username')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username already taken'
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create profile'
      })
    }

    console.log('[API] ✅ Profile created successfully for user:', userId)
    console.log('[API] ============ COMPLETE SIGNUP END ============')

    return {
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    }

  } catch (error: any) {
    console.error('[API] ============ COMPLETE SIGNUP ERROR ============')
    console.error('[API] Error message:', error.message)
    console.error('[API] Error status:', error.statusCode)
    console.error('[API] ============ END ERROR ============')
    
    throw error
  }
})
