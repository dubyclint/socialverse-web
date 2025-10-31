// /server/api/interests/remove.post.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

interface RemoveInterestRequest {
  interestId: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<RemoveInterestRequest>(event)

    if (!body.interestId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest ID is required'
      })
    }

    const { error } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)
      .eq('interest_id', body.interestId)

    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to remove interest'
      })
    }

    return {
      success: true,
      message: 'Interest removed successfully'
    }
  } catch (error) {
    console.error('[Remove Interest] Error:', error)
    throw error
  }
})
