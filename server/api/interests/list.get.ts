// ============================================================================
// FILE: /server/api/interests/list.get.ts - COMPLETE UPDATED VERSION
// ============================================================================
// Get all available interests with optional category filtering
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  console.log('[Interests/List API] ============ LIST INTERESTS START ============')

  try {
    // ============================================================================
    // STEP 1: Get query parameters
    // ============================================================================
    console.log('[Interests/List API] STEP 1: Reading query parameters...')
    
    const query = getQuery(event)
    const category = query.category as string | undefined

    console.log('[Interests/List API] Query params:', { category })

    // ============================================================================
    // STEP 2: Initialize Supabase client
    // ============================================================================
    console.log('[Interests/List API] STEP 2: Initializing Supabase client...')
    
    const supabase = await serverSupabaseClient(event)
    
    if (!supabase) {
      console.error('[Interests/List API] ❌ Supabase not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database unavailable'
      })
    }

    console.log('[Interests/List API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 3: Build query
    // ============================================================================
    console.log('[Interests/List API] STEP 3: Building query...')
    
    let queryBuilder = supabase
      .from('interests')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    // Apply category filter if provided
    if (category && typeof category === 'string') {
      console.log('[Interests/List API] Filtering by category:', category)
      queryBuilder = queryBuilder.eq('category', category)
    }

    console.log('[Interests/List API] ✅ Query built')

    // ============================================================================
    // STEP 4: Fetch interests
    // ============================================================================
    console.log('[Interests/List API] STEP 4: Fetching interests...')
    
    const { data: interests, error } = await queryBuilder

    if (error) {
      console.error('[Interests/List API] ❌ Fetch error:', {
        message: error.message,
        code: error.code
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch interests'
      })
    }

    console.log('[Interests/List API] ✅ Interests fetched:', interests?.length || 0)

    // ============================================================================
    // STEP 5: Group interests by category
    // ============================================================================
    console.log('[Interests/List API] STEP 5: Grouping interests...')
    
    const groupedInterests: Record<string, any[]> = {}
    
    interests?.forEach(interest => {
      const cat = interest.category || 'Other'
      if (!groupedInterests[cat]) {
        groupedInterests[cat] = []
      }
      groupedInterests[cat].push(interest)
    })

    console.log('[Interests/List API] ✅ Interests grouped into', Object.keys(groupedInterests).length, 'categories')

    // ============================================================================
    // STEP 6: Return success response
    // ============================================================================
    console.log('[Interests/List API] STEP 6: Building response...')
    console.log('[Interests/List API] ✅ Interests listed successfully')
    console.log('[Interests/List API] ============ LIST INTERESTS END ============')

    return {
      success: true,
      interests: interests || [],
      grouped: groupedInterests,
      total: interests?.length || 0
    }

  } catch (error: any) {
    console.error('[Interests/List API] ============ LIST INTERESTS ERROR ============')
    console.error('[Interests/List API] Error:', error.message)
    console.error('[Interests/List API] ============ END ERROR ============')

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to list interests'
    })
  }
})
