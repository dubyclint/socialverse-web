import { supabase } from '~/server/db'

interface CreatePolicyRequest {
  name: string
  description?: string
  feature: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  rules: Record<string, any>
  targetCriteria?: Record<string, any>
}

interface CreatePolicyResponse {
  id: string
  message: string
}

export default defineEventHandler(async (event): Promise<CreatePolicyResponse> => {
  try {
    if (event.node.req.method !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }

    const body = await readBody<CreatePolicyRequest>(event)

    // Validate required fields
    if (!body.name || !body.feature || !body.priority || !body.rules) {
      throw createError({
        statusCode: 400,
        statusMessage: 'name, feature, priority, and rules are required'
      })
    }

    // Validate priority
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(body.priority)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid priority value'
      })
    }

    // Insert into Supabase
    const { data: policy, error } = await supabase
      .from('policies')
      .insert([
        {
          name: body.name,
          description: body.description,
          feature: body.feature,
          priority: body.priority,
          status: 'DRAFT',
          rules: body.rules,
          target_criteria: body.targetCriteria,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create policy'
      })
    }

    return {
      id: policy.id,
      message: 'Policy created successfully'
    }
  } catch (error: any) {
    console.error('Create policy error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})
