// FILE: /server/api/interests/list.get.ts - UPDATE
// Get all available interests
// ============================================================================

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
      grouped: groupedInterests,
      total: interests?.length || 0
    }

  } catch (error) {
    console.error('[ListInterests] Error:', error)
    throw error
  }
})
