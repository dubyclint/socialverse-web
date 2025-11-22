// FILE: /server/routes/policies.ts - FIXED
// ============================================================================

import { supabase } from '~/server/utils/database'

interface PoliciesQuery {
  feature?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  limit?: number
  offset?: number
}

interface PoliciesResponse {
  policies: any[]
  total: number
  limit: number
  offset: number
}

export default defineEventHandler(async (event): Promise<PoliciesResponse> => {
  try {
    const query = getQuery<PoliciesQuery>(event)

    let supabaseQuery = supabase.from('policies').select('*', { count: 'exact' })

    // Apply filters
    if (query.feature) {
      supabaseQuery = supabaseQuery.eq('feature', query.feature)
    }

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status)
    }

    if (query.priority) {
      supabaseQuery = supabaseQuery.eq('priority', query.priority)
    }

    // Apply pagination
    const limit = Math.min(query.limit || 20, 100)
    const offset = query.offset || 0

    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1)

    const { data: policies, count, error } = await supabaseQuery

    if (error) {
      throw error
    }

    return {
      policies: policies || [],
      total: count || 0,
      limit,
      offset
    }
  } catch (error: any) {
    console.error('[Policies] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch policies'
    })
  }
})
