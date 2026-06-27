// ============================================================================
// FILE 4: /server/api/interests/delete.post.ts
// Delete specific user interest
// ============================================================================

interface DeleteInterestRequest {
  interest_id: string
}

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    
    if (!user || !user.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<DeleteInterestRequest>(event)

    if (!body.interest_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest ID required'
      })
    }

    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    const { error } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id)
      .eq('interest_id', body.interest_id)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete interest'
      })
    }

    return {
      success: true,
      message: 'Interest deleted successfully'
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message
    })
  }
})
