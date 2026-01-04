// FILE: /server/api/auth/complete-signup.post.ts
// FIXED VERSION - Insert into 'user' table instead of 'profiles'

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
    // STEP 3: Check if user profile already exists
    // ============================================================================
    console.log('[API] Checking if user profile exists for user:', userId)
    
    const { data: existingUser, error: checkError } = await supabase
      .from('user')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      console.log('[API] ✅ User profile already exists for user:', userId)
      return {
        success: true,
        message: 'Profile already exists',
        profile: existingUser
      }
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[API] ❌ Error checking user:', checkError.message)
    }

    // ============================================================================
    // STEP 4: Update user profile (INSERT or UPDATE)
    // ============================================================================
    console.log('[API] Updating user profile for user:', userId)
    
    const userData = {
      id: userId,
      username: username.toLowerCase().trim(),
      username_lower: username.toLowerCase().trim(),
      display_name: fullName || username,
      email: email.toLowerCase().trim(),
      email_lower: email.toLowerCase().trim(),
      bio: '',
      avatar_url: null,
      is_verified: false,
      profile_completed: false,
      verification_status: 'pending',
      status: 'active',
      updated_at: new Date().toISOString()
    }

    console.log('[API] User data to upsert:', userData)

    // Use upsert to handle both insert and update
    const { data: updatedUser, error: updateError } = await supabase
      .from('user')
      .upsert([userData], { onConflict: 'id' })
      .select()
      .single()

    if (updateError) {
      console.error('[API] ❌ Error updating user:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details
      })
      
      // Check if username already exists
      if (updateError.message?.includes('username') || updateError.code === '23505') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username already taken'
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + updateError.message
      })
    }

    console.log('[API] ✅ User profile updated successfully')
    console.log('[API] ============ COMPLETE SIGNUP END ============')

    return {
      success: true,
      message: 'Profile updated successfully',
      profile: updatedUser
    }

  } catch (error: any) {
    console.error('[API] ============ COMPLETE SIGNUP ERROR ============')
    console.error('[API] Error message:', error.message)
    console.error('[API] Error status:', error.statusCode)
    console.error('[API] ============ END ERROR ============')
    
    throw error
  }
})

