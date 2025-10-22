import { supabase } from '~/server/db'

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

    const { data: policies, error, count } = await supabaseQuery

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error'
      })
    }

    return {
      policies: policies || [],
      total: count || 0,
      limit,
      offset
    }
  } catch (error: any) {
    console.error('Get policies error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})
