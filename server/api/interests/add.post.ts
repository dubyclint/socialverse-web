// ============================================================================
// FILE: /server/api/interests/add.post.ts - COMPLETE UPDATED VERSION
// ============================================================================
// Add interest to user profile with auto-sync to profile.interests
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface AddInterestRequest {
  interestId: string
}

interface AddInterestResponse {
  success: boolean
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<AddInterestResponse> => {
  console.log('[Interests/Add API] ============ ADD INTEREST START ============')

  try {
    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    console.log('[Interests/Add API] STEP 1: Authenticating user...')
    
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Interests/Add API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Interests/Add API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Read request body
    // ============================================================================
    console.log('[Interests/Add API] STEP 2: Reading request body...')
    
    const body = await readBody<AddInterestRequest>(event)
    const { interestId } = body

    console.log('[Interests/Add API] Interest ID:', interestId)

    // ============================================================================
    // STEP 3: Validate input
    // ============================================================================
    console.log('[Interests/Add API] STEP 3: Validating input...')
    
    if (!interestId || typeof interestId !== 'string') {
      console.error('[Interests/Add API] ❌ Invalid interest ID')
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest ID is required'
      })
    }

    console.log('[Interests/Add API] ✅ Input validated')

    // ============================================================================
    // STEP 4: Check if interest exists
    // ============================================================================
    console.log('[Interests/Add API] STEP 4: Checking if interest exists...')
    
    const { data: interest, error: interestError } = await supabase
      .from('interests')
      .select('id, name, category')
      .eq('id', interestId)
      .eq('is_active', true)
      .single()

    if (interestError || !interest) {
      console.error('[Interests/Add API] ❌ Interest not found:', interestId)
      throw createError({
        statusCode: 404,
        statusMessage: 'Interest not found'
      })
    }

    console.log('[Interests/Add API] ✅ Interest found:', {
      id: interest.id,
      name: interest.name,
      category: interest.category
    })

    // ============================================================================
    // STEP 5: Check if user already has this interest
    // ============================================================================
    console.log('[Interests/Add API] STEP 5: Checking for duplicates...')
    
    const { data: existingInterest, error: checkError } = await supabase
      .from('user_interests')
      .select('id')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .single()

    if (existingInterest) {
      console.warn('[Interests/Add API] ⚠️ User already has this interest')
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest already added'
      })
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Interests/Add API] ❌ Error checking duplicates:', checkError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to check interest'
      })
    }

    console.log('[Interests/Add API] ✅ No duplicates found')

    // ============================================================================
    // STEP 6: Add interest to user_interests junction table
    // ============================================================================
    console.log('[Interests/Add API] STEP 6: Adding interest to user_interests...')
    
    const { error: addError } = await supabase
      .from('user_interests')
      .insert({
        user_id: userId,
        interest_id: interestId,
        created_at: new Date().toISOString()
      })

    if (addError) {
      console.error('[Interests/Add API] ❌ Add error:', {
        message: addError.message,
        code: addError.code
      })

      if (addError.code === '23505') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Interest already added'
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to add interest'
      })
    }

    console.log('[Interests/Add API] ✅ Interest added to user_interests')

    // ============================================================================
    // STEP 7: Fetch all user interests and sync to profile
    // ============================================================================
    console.log('[Interests/Add API] STEP 7: Syncing interests to profile...')
    
    const { data: userInterests, error: fetchError } = await supabase
      .from('user_interests')
      .select('interest_id, interests(id, name, category, icon_url)')
      .eq('user_id', userId)

    if (fetchError) {
      console.warn('[Interests/Add API] ⚠️ Error fetching user interests:', fetchError.message)
    } else {
      console.log('[Interests/Add API] ✅ User interests fetched:', userInterests?.length || 0)

      // Build interests array for profile
      const interestsArray = userInterests?.map((ui: any) => ({
        id: ui.interests.id,
        name: ui.interests.name,
        category: ui.interests.category,
        icon_url: ui.interests.icon_url
      })) || []

      console.log('[Interests/Add API] Syncing', interestsArray.length, 'interests to profile...')

      // Update profile with interests array
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          interests: interestsArray,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.warn('[Interests/Add API] ⚠️ Error syncing to profile:', updateError.message)
      } else {
        console.log('[Interests/Add API] ✅ Interests synced to profile')
      }
    }

    // ============================================================================
    // STEP 8: Return success response
    // ============================================================================
    console.log('[Interests/Add API] STEP 8: Building response...')
    console.log('[Interests/Add API] ✅ Interest added successfully')
    console.log('[Interests/Add API] ============ ADD INTEREST END ============')

    return {
      success: true,
      message: 'Interest added successfully'
    }

  } catch (err: any) {
    console.error('[Interests/Add API] ============ ADD INTEREST ERROR ============')
    console.error('[Interests/Add API] Error:', err.message)
    console.error('[Interests/Add API] ============ END ERROR ============')
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while adding interest',
      data: { details: err.message }
    })
  }
})
