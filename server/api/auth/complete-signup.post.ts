// ============================================================================
// FILE: /server/api/auth/complete-signup.post.ts - COMPLETE PHASE 5
// ============================================================================
// PROFILE COMPLETION ENDPOINT - Updates user profile after email verification
// ============================================================================
// FIXES:
// ✅ Uses 'user_id' as upsert key (not 'id')
// ✅ Proper conflict resolution
// ✅ Better error handling
// ✅ Comprehensive logging
// ============================================================================

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    console.log('[COMPLETE-SIGNUP] ============ START ============')
    
    const body = await readBody(event)
    const { userId, username, fullName, email } = body

    console.log('[COMPLETE-SIGNUP] Request body:', { userId, username, fullName, email })

    // ============================================================================
    // STEP 1: VALIDATE INPUT
    // ============================================================================
    if (!userId || !username || !email) {
      console.error('[COMPLETE-SIGNUP] ❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID, username, and email are required'
      })
    }

    console.log('[COMPLETE-SIGNUP] ✅ Input validation passed')

    // ============================================================================
    // STEP 2: CREATE SUPABASE ADMIN CLIENT
    // ============================================================================
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[COMPLETE-SIGNUP] ❌ Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[COMPLETE-SIGNUP] ✅ Supabase admin client created')

    // ============================================================================
    // STEP 3: CHECK IF USER PROFILE ALREADY EXISTS
    // ============================================================================
    console.log('[COMPLETE-SIGNUP] Checking if user profile exists for user:', userId)
    
    const { data: existingUser, error: checkError } = await supabase
      .from('user')
      .select('id, user_id, username, email, is_verified')
      .eq('user_id', userId)
      .single()

    if (existingUser) {
      console.log('[COMPLETE-SIGNUP] ✅ User profile already exists for user:', userId)
      console.log('[COMPLETE-SIGNUP] Existing profile:', existingUser)
      
      // If profile exists, just update verification status
      const { data: updatedUser, error: updateError } = await supabase
        .from('user')
        .update({
          is_verified: true,
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('[COMPLETE-SIGNUP] ❌ Error updating verification status:', updateError.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update verification status: ' + updateError.message
        })
      }

      console.log('[COMPLETE-SIGNUP] ✅ Verification status updated')
      console.log('[COMPLETE-SIGNUP] ============ END ============')

      return {
        success: true,
        message: 'Profile already exists - verification status updated',
        profile: updatedUser
      }
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[COMPLETE-SIGNUP] ❌ Error checking user:', checkError.message)
      console.error('[COMPLETE-SIGNUP] Error code:', checkError.code)
    }

    console.log('[COMPLETE-SIGNUP] ℹ️ No existing profile found, creating new one')

    // ============================================================================
    // STEP 4: CREATE NEW USER PROFILE
    // ============================================================================
    console.log('[COMPLETE-SIGNUP] Creating new user profile for user:', userId)
    
    const userData = {
      user_id: userId,
      username: username.toLowerCase().trim(),
      username_lower: username.toLowerCase().trim(),
      display_name: fullName || username,
      email: email.toLowerCase().trim(),
      email_lower: email.toLowerCase().trim(),
      bio: '',
      avatar_url: null,
      is_verified: true,
      profile_completed: false,
      verification_status: 'verified',
      status: 'active',
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('[COMPLETE-SIGNUP] User data to insert:', userData)

    // ✅ FIXED: Use 'user_id' as upsert key instead of 'id'
    const { data: createdUser, error: insertError } = await supabase
      .from('user')
      .upsert([userData], { onConflict: 'user_id' })
      .select()
      .single()

    if (insertError) {
      console.error('[COMPLETE-SIGNUP] ❌ Error creating user profile:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details
      })
      
      // Check if username already exists
      if (insertError.message?.includes('username') || insertError.code === '23505') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username already taken'
        })
      }
      
      // Check if email already exists
      if (insertError.message?.includes('email') || insertError.code === '23505') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email already registered'
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create profile: ' + insertError.message
      })
    }

    console.log('[COMPLETE-SIGNUP] ✅ User profile created successfully')
    console.log('[COMPLETE-SIGNUP] Created profile:', createdUser)
    console.log('[COMPLETE-SIGNUP] ============ END ============')

    return {
      success: true,
      message: 'Profile created successfully',
      profile: createdUser
    }

  } catch (error: any) {
    console.error('[COMPLETE-SIGNUP] ============ ERROR ============')
    console.error('[COMPLETE-SIGNUP] Error message:', error.message)
    console.error('[COMPLETE-SIGNUP] Error status:', error.statusCode)
    console.error('[COMPLETE-SIGNUP] Full error:', JSON.stringify(error, null, 2))
    console.error('[COMPLETE-SIGNUP] ============ END ERROR ============')
    
    throw error
  }
})
