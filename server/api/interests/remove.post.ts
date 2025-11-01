// FILE: /server/api/interests/remove.post.ts - UPDATE
// Remove interest from user profile
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface RemoveInterestRequest {
  interestId: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    // STEP 1: VERIFY AUTHENTICATION
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<RemoveInterestRequest>(event)

    // STEP 2: VALIDATE INPUT
    if (!body.interestId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest ID is required'
      })
    }

    // STEP 3: REMOVE INTEREST FROM USER
    const { error: removeError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)
      .eq('interest_id', body.interestId)

    if (removeError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to remove interest'
      })
    }

    // STEP 4: RETURN SUCCESS
    return {
      success: true,
      message: 'Interest removed successfully'
    }

  } catch (error) {
    console.error('[RemoveInterest] Error:', error)
    throw error
  }
})
