import { supabase } from '~/server/db'

interface UserRestrictionsResponse {
  userId: string
  restrictions: Array<{
    feature: string
    restrictions: string[]
    reason?: string
  }>
}

export default defineEventHandler(async (event): Promise<UserRestrictionsResponse> => {
  try {
    const userId = getRouterParam(event, 'userId')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Query Supabase for user restrictions
    const { data: restrictions, error } = await supabase
      .from('compliance_rules')
      .select('feature, restrictions, reason')
      .eq('user_id', userId)
      .eq('is_allowed', false)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error'
      })
    }

    return {
      userId,
      restrictions: restrictions || []
    }
  } catch (error: any) {
    console.error('Get user restrictions error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})
