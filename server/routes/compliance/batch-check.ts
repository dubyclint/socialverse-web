import { supabase } from '~/server/db'

interface BatchCheckRequest {
  userId: string
  features: string[]
  context?: Record<string, any>
}

interface BatchCheckResponse {
  userId: string
  results: Array<{
    feature: string
    allowed: boolean
    restrictions?: string[]
  }>
}

export default defineEventHandler(async (event): Promise<BatchCheckResponse> => {
  try {
    if (event.node.req.method !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }

    const body = await readBody<BatchCheckRequest>(event)

    if (!body.userId || !Array.isArray(body.features) || body.features.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'userId and features array are required'
      })
    }

    // Query Supabase for all compliance rules for user
    const { data: complianceRules, error } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('user_id', body.userId)
      .in('feature', body.features)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error'
      })
    }

    // Build results map
    const rulesMap = new Map(complianceRules?.map(r => [r.feature, r]) || [])

    const results = body.features.map(feature => ({
      feature,
      allowed: !rulesMap.has(feature) || rulesMap.get(feature)?.is_allowed !== false,
      restrictions: rulesMap.get(feature)?.restrictions || []
    }))

    return {
      userId: body.userId,
      results
    }
  } catch (error: any) {
    console.error('Batch compliance check error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})
