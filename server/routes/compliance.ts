// FILE: /server/routes/compliance.ts - FIXED
// ============================================================================

import { supabase } from '~/server/utils/database'

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
    const { userId, feature, context } = body

    if (!userId || !feature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: userId, feature'
      })
    }
    // Check user compliance status
    const { data: userCompliance, error } = await supabase
      .from('user_compliance')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Determine if feature is allowed
    const allowed = !userCompliance?.restricted_features?.includes(feature)

    return {
      allowed,
      restrictions: userCompliance?.restricted_features || [],
      message: allowed ? 'Feature access allowed' : 'Feature access restricted'
    }
  } catch (error: any) {
    console.error('[Compliance] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Compliance check failed'
    })
  }
})
