// ============================================================================
// FILE 3: /server/api/interests/save.post.ts
// Save user interests (replaces all existing)
// ============================================================================

interface SaveInterestsRequest {
  interests: string[]
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

    const body = await readBody<SaveInterestsRequest>(event)

    if (!body.interests || !Array.isArray(body.interests)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Interests must be an array'
      })
    }

    if (body.interests.length > 5) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Maximum 5 interests allowed'
      })
    }

    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    // Remove all existing interests
    await supabase.rpc('remove_all_user_interests', { p_user_id: user.id })

    // Add new interests
    const { data: result, error } = await supabase
      .rpc('add_user_interests', {
        p_user_id: user.id,
        p_interest_names: body.interests
      })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save interests'
      })
    }

    return {
      success: true,
      message: 'Interests saved successfully',
      data: result
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message
    })
  }
})
