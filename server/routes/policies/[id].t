import { supabase } from '~/server/db'

interface PolicyResponse {
  id: string
  name: string
  description?: string
  feature: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
  rules: Record<string, any>
  targetCriteria?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export default defineEventHandler(async (event): Promise<PolicyResponse> => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Policy ID is required'
      })
    }

    const { data: policy, error } = await supabase
      .from('policies')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !policy) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Policy not found'
      })
    }

    return policy as PolicyResponse
  } catch (error: any) {
    console.error('Get policy error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})
