// server/api/pewgift/leaderboard.get.ts
// ============================================================================
// GET PEWGIFT LEADERBOARD
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)

    const supabase = await serverSupabaseClient(event)

    const { data: leaderboard, error } = await supabase
      .from('pewgift_leaderboard')
      .select('*')
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: leaderboard || []
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch leaderboard'
    })
  }
})
