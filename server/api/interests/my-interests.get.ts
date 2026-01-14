// ============================================================================
// FILE 2: /server/api/interests/my-interests.get.ts
// Get current user's interests
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    
    if (!user || !user.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    const { data: interests, error } = await supabase
      .rpc('get_user_interests', { p_user_id: user.id })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch user interests'
      })
    }

    return {
      success: true,
      data: interests || []
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message
    })
  }
})
