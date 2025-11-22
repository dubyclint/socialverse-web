// server/api/pewgift/types.get.ts
// ============================================================================
// GET AVAILABLE PEWGIFT TYPES
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category as string

    const supabase = await serverSupabaseClient(event)

    let queryBuilder = supabase
      .from('pewgift_types')
      .select('*')
      .eq('is_active', true)

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    const { data: gifts, error } = await queryBuilder
      .order('rarity', { ascending: false })
      .order('price_in_credits', { ascending: true })

    if (error) throw error

    return {
      success: true,
      data: gifts || []
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch gift types'
    })
  }
})
