// ============================================================================
// FIXED: /server/api/rank/get.ts
// ============================================================================
// GET USER RANK - FIXED: Correct table name and error handling
// ✅ FIXED: Changed 'users' to 'user' table
// ✅ FIXED: Proper error handling with logging
// ✅ FIXED: Fallback values for missing columns
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface RankResponse {
  success: boolean
  data?: {
    rank: string
    points: number
    level: number
  }
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<RankResponse> => {
  try {
    console.log('[Rank Get API] Fetching user rank...')

    // ============================================================================
    // STEP 1: Get Supabase client
    // ============================================================================
    const supabase = await serverSupabaseClient(event)

    // ============================================================================
    // STEP 2: Get user ID from query or context
    // ============================================================================
    const query = getQuery(event)
    const userId = (query.userId as string) || event.context.user?.id

    if (!userId) {
      console.error('[Rank Get API] ❌ User ID is required')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Rank Get API] User ID:', userId)

    // ============================================================================
    // STEP 3: Fetch user rank from user table (CORRECTED TABLE NAME)
    // ============================================================================
    console.log('[Rank Get API] Querying user table for rank...')

    const { data: user, error: userError } = await supabase
      .from('user')  // ✅ FIXED: Changed from 'users' to 'user'
      .select('rank, rank_points, rank_level')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('[Rank Get API] ❌ User table error:', userError.message)
      
      // Handle "no rows returned" error
      if (userError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch user rank: ' + userError.message
      })
    }

    if (!user) {
      console.error('[Rank Get API] ❌ User not found for ID:', userId)
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    console.log('[Rank Get API] ✅ Rank fetched successfully')

    return {
      success: true,
      data: {
        rank: user.rank || 'Bronze I',  // ✅ Default rank
        points: user.rank_points || 0,   // ✅ Default points
        level: user.rank_level || 1      // ✅ Default level
      },
      message: 'Rank fetched successfully'
    }

  } catch (err: any) {
    console.error('[Rank Get API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching rank',
      data: { details: err.message }
    })
  }
})
