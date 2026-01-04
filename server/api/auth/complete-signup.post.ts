//FILE 2: /server/api/auth/complete-signup.post.ts
//COMPLETE FILE - Complete Signup Profile Creation

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] ============ COMPLETE SIGNUP START ============')
    
    const body = await readBody(event)
    const { userId, username, fullName, email } = body

    console.log('[API] Request body:', { userId, username, fullName, email })

    // ============================================================================
    // STEP 1: Validate input
    // ============================================================================
    if (!userId || !username || !email) {
      console.error('[API] ❌ Missing required fields')
      console.error('[API] userId:', userId)
      console.error('[API] username:', username)
      console.error('[API] email:', email)
      
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID, username, and email are required'
      })
    }

    // ============================================================================
    // STEP 2: Create admin Supabase client
    // ============================================================================
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] ❌ Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[API] ✅ Supabase admin client created')

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
      console.error('[API] ❌ Error checking profile:', checkError.message)
    }

    // ============================================================================
    // STEP 4: Create new profile
    // ============================================================================
    console.log('[API] Creating new profile for user:', userId)
    
    const profileData = {
      id: userId,
      username: username.toLowerCase().trim(),
      username_lower: username.toLowerCase().trim(),
      full_name: fullName || username,
      email: email.toLowerCase().trim(),
      avatar_url: null,
      bio: '',
      location: '',
      website: '',
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('[API] Profile data to insert:', profileData)

    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()

    if (createProfileError) {
      console.error('[API] ❌ Error creating profile:', {
        message: createProfileError.message,
        code: createProfileError.code,
        details: createProfileError.details
      })
      
      // Check if username already exists
      if (createProfileError.message?.includes('username') || createProfileError.code === '23505') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username already taken'
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create profile: ' + createProfileError.message
      })
    }

    console.log('[API] ✅ Profile created successfully')
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
