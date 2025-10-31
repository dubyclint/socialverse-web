// /server/api/interests/user.get.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

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

    const { data: userInterests, error } = await supabase
      .from('user_interests')
      .select('interest_id, interests(id, name, category)')
      .eq('user_id', userId)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch user interests'
      })
    }

    return {
      success: true,
      interests: userInterests?.map(ui => ui.interests) || []
    }
  } catch (error) {
    console.error('[Get User Interests] Error:', error)
    throw error
  }
})
