import { supabase } from '~/server/db'

interface ComplianceCheckRequest {
  userId: string
  feature: string
  context?: Record<string, any>
}

interface ComplianceCheckResponse {
  allowed: boolean
  restrictions?: string[]
  message: string
}

export default defineEventHandler(async (event): Promise<ComplianceCheckResponse> => {
  try {
    // Only allow POST requests
    if (event.node.req.method !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }

    const body = await readBody<ComplianceCheckRequest>(event)

    // Validate required fields
    if (!body.userId || !body.feature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'userId and feature are required'
      })
    }

    // Query Supabase for user compliance data
    const { data: userCompliance, error } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('user_id', body.userId)
      .eq('feature', body.feature)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error'
      })
    }

    // Check if feature is allowed
    const allowed = !userCompliance || userCompliance.is_allowed !== false

    return {
      allowed,
      restrictions: userCompliance?.restrictions || [],
      message: allowed ? 'Feature access allowed' : 'Feature access denied'
    }
  } catch (error: any) {
    console.error('Compliance check error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})
