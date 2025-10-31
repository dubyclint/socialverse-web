// server/api/interests/add.post.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

interface AddInterestRequest {
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

    const body = await readBody<AddInterestRequest>(event)

    if (!body.interestId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest ID is required'
      })
    }

    const { error } = await supabase
      .from('user_interests')
      .insert({
        user_id: userId,
        interest_id: body.interestId
      })

    if (error) {
      if (error.code === '23505') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Interest already added'
        })
      }
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to add interest'
      })
    }

    return {
      success: true,
      message: 'Interest added successfully'
    }
  } catch (error) {
    console.error('[Add Interest] Error:', error)
    throw error
  }
})
