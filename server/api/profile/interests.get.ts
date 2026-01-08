// ============================================================================
// FILE 9: /server/api/profile/interests.get.ts - CORRECTED
// ============================================================================
// ✅ NOTE: This file queries 'interests' table (not 'profiles' or 'user')
// ✅ No changes needed - this is a separate interests lookup table
// ============================================================================

// FILE: /server/api/profile/interests.get.ts - CREATE
// Get available interests for profile completion
// ✅ This file queries the 'interests' table (separate lookup table)
// ✅ No changes needed from 'profiles' to 'user'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { category } = getQuery(event)

    // STEP 1: BUILD QUERY
    let query = supabase
      .from('interests')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')

    // STEP 2: FILTER BY CATEGORY IF PROVIDED
    if (category && typeof category === 'string') {
      query = query.eq('category', category)
    }

    // STEP 3: FETCH INTERESTS
    const { data: interests, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch interests'
      })
    }

    // STEP 4: GROUP BY CATEGORY
    const groupedInterests = interests?.reduce((acc: any, interest: any) => {
      const cat = interest.category || 'Other'
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(interest)
      return acc
    }, {}) || {}

    // STEP 5: RETURN SUCCESS
    return {
      success: true,
      interests: interests || [],
      grouped: groupedInterests
    }

  } catch (error) {
    console.error('[GetInterests] Error:', error)
    throw error
  }
})
