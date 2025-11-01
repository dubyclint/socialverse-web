// FILE: /server/api/interests/user.get.ts - UPDATE
// Get user's interests
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    // STEP 1: VERIFY AUTHENTICATION
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // STEP 2: FETCH USER INTERESTS WITH DETAILS
    const { data: userInterests, error } = await supabase
      .from('user_interests')
      .select('*, interests(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch interests'
      })
    }

    // STEP 3: EXTRACT INTEREST DETAILS
    const interests = userInterests?.map(ui => ui.interests) || []

    // STEP 4: GROUP BY CATEGORY
    const groupedInterests = interests.reduce((acc: any, interest: any) => {
      const cat = interest.category || 'Other'
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(interest)
      return acc
    }, {})

    // STEP 5: RETURN SUCCESS
    return {
      success: true,
      interests,
      grouped: groupedInterests,
      total: interests.length
    }

  } catch (error) {
    console.error('[GetUserInterests] Error:', error)
    throw error
  }
})
